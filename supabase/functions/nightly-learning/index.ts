// supabase/functions/nightly-learning/index.ts
// Job qui traite l'apprentissage différé chaque nuit

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  const stats = {
    processed: 0,
    skipped: 0,
    errors: 0,
    totalReward: 0,
  };

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Récupérer les expériences non traitées (24-48h)
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const maxAge = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();

    const { data: pendingExperiences, error: fetchError } = await supabase
      .from('sage_experiences')
      .select('id, user_id, context_vector, action_type, metrics_before, feedback_type')
      .is('reward', null)
      .eq('learning_enabled', true)
      .lt('created_at', cutoffTime)
      .gt('created_at', maxAge)
      .limit(500);

    if (fetchError) {
      throw new Error(`Failed to fetch experiences: ${fetchError.message}`);
    }

    console.log(`[NightlyLearning] Found ${pendingExperiences?.length || 0} pending experiences`);

    // 2. Traiter chaque expérience
    for (const exp of pendingExperiences || []) {
      try {
        // Vérifier consentement actuel
        const { data: consents } = await supabase
          .from('user_consents')
          .select('purpose, granted')
          .eq('user_id', exp.user_id);

        const consentMap: Record<string, boolean> = {};
        for (const c of consents || []) {
          consentMap[c.purpose as string] = Boolean(c.granted);
        }

        const learningEnabled = consentMap['ai_profiling'] && consentMap['policy_learning'];

        if (!learningEnabled) {
          // Marquer comme skip
          await supabase.from('sage_experiences')
            .update({ learning_enabled: false })
            .eq('id', exp.id);
          stats.skipped++;
          continue;
        }

        // Calculer métriques after (simplifié pour edge function)
        const metricsAfter = await fetchUserMetrics(supabase, exp.user_id);

        // Calculer reward
        const reward = computeReward({
          accepted: exp.feedback_type === 'accepted',
          rejected: exp.feedback_type === 'rejected',
          ignored: exp.feedback_type === 'ignored',
          metricsBefore: (exp.metrics_before as Record<string, number>) || {},
          metricsAfter: metricsAfter,
        });

        // Mettre à jour l'expérience
        await supabase.from('sage_experiences')
          .update({
            metrics_after: metricsAfter,
            reward: reward,
          })
          .eq('id', exp.id);

        // Mettre à jour les poids
        const contextVec = (exp.context_vector as number[]) || [];
        await updatePolicyWeights(supabase, exp.user_id, contextVec, exp.action_type, reward);

        stats.processed++;
        stats.totalReward += reward;

      } catch (expError) {
        console.error(`[NightlyLearning] Error processing ${exp.id}:`, expError);
        stats.errors++;
      }
    }

    const duration = Date.now() - startTime;
    const avgReward = stats.processed > 0 ? stats.totalReward / stats.processed : 0;

    console.log(`[NightlyLearning] Completed in ${duration}ms:`, stats);

    return new Response(JSON.stringify({
      success: true,
      stats: {
        ...stats,
        avgReward,
        durationMs: duration,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[NightlyLearning] Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stats,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// === HELPERS ===

// deno-lint-ignore no-explicit-any
async function fetchUserMetrics(supabase: any, userId: string) {
  const today = new Date().toISOString().split('T')[0];
  
  const [habits, tasks] = await Promise.all([
    supabase.from('habit_logs').select('completed').eq('user_id', userId).eq('date', today),
    supabase.from('tasks').select('status, due_date').eq('user_id', userId).is('deleted_at', null),
  ]);

  const habitsData = habits.data || [];
  const tasksData = tasks.data || [];
  
  // deno-lint-ignore no-explicit-any
  const habitsDone = habitsData.filter((h: any) => h.completed).length;
  const habitsTotal = habitsData.length || 1;
  // deno-lint-ignore no-explicit-any
  const tasksDone = tasksData.filter((t: any) => t.status === 'done').length;
  // deno-lint-ignore no-explicit-any
  const tasksOverdue = tasksData.filter((t: any) => {
    return t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date();
  }).length;

  return {
    habits_rate_7d: habitsDone / habitsTotal,
    task_overdue_ratio: tasksData.length > 0 ? tasksOverdue / tasksData.length : 0,
    momentum_index: (habitsDone / habitsTotal + tasksDone / Math.max(tasksData.length, 1)) / 2,
    data_quality: 0.7,
  };
}

function computeReward(ctx: {
  accepted: boolean;
  rejected: boolean;
  ignored: boolean;
  metricsBefore: Record<string, number>;
  metricsAfter: Record<string, number>;
}): number {
  let reward = 0;

  if (ctx.accepted) reward += 1.0;
  if (ctx.rejected) reward -= 2.0;
  if (ctx.ignored) reward -= 1.0;

  const dm = (ctx.metricsAfter?.momentum_index ?? 0) - (ctx.metricsBefore?.momentum_index ?? 0);
  const dor = (ctx.metricsAfter?.task_overdue_ratio ?? 0) - (ctx.metricsBefore?.task_overdue_ratio ?? 0);

  reward += Math.max(-1, Math.min(1, dm)) * 1.5;
  reward += Math.max(-1, Math.min(1, -dor)) * 1.8;

  return Math.max(-5, Math.min(5, reward));
}

// deno-lint-ignore no-explicit-any
async function updatePolicyWeights(
  supabase: any,
  userId: string,
  contextVector: number[],
  actionType: string,
  reward: number
) {
  const learningRate = 0.05;

  const { data: existing } = await supabase
    .from('sage_policy_weights')
    .select('weights')
    .eq('user_id', userId)
    .eq('action_type', actionType)
    .maybeSingle();

  let weights: number[] = existing?.weights || [];
  
  if (weights.length === 0 || weights.length < contextVector.length) {
    weights = new Array(contextVector.length).fill(0).map(() => (Math.random() - 0.5) * 0.1);
  }

  for (let i = 0; i < weights.length && i < contextVector.length; i++) {
    weights[i] += learningRate * reward * contextVector[i];
  }

  await supabase.from('sage_policy_weights').upsert({
    user_id: userId,
    action_type: actionType,
    weights: weights,
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'user_id,action_type',
  });
}
