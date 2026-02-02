import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getRequiredWorkspaceId } from '../_shared/workspace.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * COMPUTE-SCORE-REALTIME
 * 
 * Calculates user scores on-demand (not waiting for nightly job).
 * Updates both scores_daily and daily_stats tables.
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get workspace ID (multi-tenant)
    let workspaceId: string;
    try {
      workspaceId = await getRequiredWorkspaceId(supabase, userId);
    } catch (wsError) {
      console.error('Failed to get workspace:', wsError);
      return new Response(JSON.stringify({ error: 'No workspace found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all metrics in parallel
    const [habitsResult, tasksResult, logsResult, focusResult] = await Promise.all([
      supabase
        .from('habits')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true),
      supabase
        .from('tasks')
        .select('id, status, priority')
        .eq('user_id', userId)
        .is('deleted_at', null),
      supabase
        .from('habit_logs')
        .select('id, completed')
        .eq('user_id', userId)
        .gte('date', weekAgo)
        .eq('completed', true),
      supabase
        .from('focus_sessions')
        .select('duration_min')
        .eq('user_id', userId)
        .gte('start_time', `${today}T00:00:00`)
        .lte('start_time', `${today}T23:59:59`),
    ]);

    const totalHabits = habitsResult.data?.length || 0;
    const completedLogs = logsResult.data?.length || 0;
    const expectedLogs = totalHabits * 7;
    
    const totalTasks = tasksResult.data?.length || 0;
    const completedTasks = tasksResult.data?.filter(t => t.status === 'done').length || 0;
    
    const focusMinutes = focusResult.data?.reduce((sum, s) => sum + (s.duration_min || 0), 0) || 0;

    // Calculate scores
    const habitScore = expectedLogs > 0 
      ? Math.min(100, (completedLogs / expectedLogs) * 100) 
      : (totalHabits === 0 ? 100 : 0);
    
    const taskScore = totalTasks > 0 
      ? (completedTasks / totalTasks) * 100 
      : 100;
    
    const healthScore = Math.min(100, (focusMinutes / 120) * 100);
    
    // Finance score (simplified - check budget adherence)
    const financeScore = 75; // Default if no finance data

    // Weighted global score (same weights as nightly-scoring)
    const globalScore = Math.round(
      (habitScore * 0.35) +
      (taskScore * 0.25) +
      (financeScore * 0.20) +
      (healthScore * 0.20)
    );

    // Calculate momentum (based on consistency)
    const consistency = expectedLogs > 0 ? completedLogs / expectedLogs : 1;
    const momentumIndex = Math.min(100, Math.max(0, consistency * 100));

    // Calculate burnout index
    const burnoutIndex = Math.min(100, Math.max(0,
      ((100 - taskScore) * 0.4) + 
      ((100 - habitScore) * 0.3) + 
      ((100 - globalScore) * 0.3)
    ));

    // Upsert into scores_daily (primary scoring table)
    const { error: scoreError } = await supabase
      .from('scores_daily')
      .upsert({
        user_id: userId,
        workspace_id: workspaceId,
        date: today,
        global_score: Math.round(globalScore * 100) / 100,
        habits_score: Math.round(habitScore * 100) / 100,
        tasks_score: Math.round(taskScore * 100) / 100,
        finance_score: Math.round(financeScore * 100) / 100,
        health_score: Math.round(healthScore * 100) / 100,
        momentum_index: Math.round(momentumIndex * 100) / 100,
        burnout_index: Math.round(burnoutIndex * 100) / 100,
        consistency_factor: Math.round(consistency * 100) / 100,
        computed_at: new Date().toISOString(),
      }, { onConflict: 'user_id,date' });

    if (scoreError) {
      console.error('Score upsert error:', scoreError);
    }

    // Upsert into daily_stats (for BI dashboards)
    const { error: statsError } = await supabase
      .from('daily_stats')
      .upsert({
        user_id: userId,
        workspace_id: workspaceId,
        date: today,
        habits_completed: completedLogs,
        habits_total: totalHabits,
        tasks_completed: completedTasks,
        tasks_planned: totalTasks,
        focus_minutes: focusMinutes,
        clarity_score: globalScore,
        overload_index: burnoutIndex / 100,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,date' });

    if (statsError) {
      console.error('Daily stats upsert error:', statsError);
    }

    return new Response(JSON.stringify({
      success: true,
      score: globalScore,
      breakdown: {
        habits_score: Math.round(habitScore),
        tasks_score: Math.round(taskScore),
        finance_score: Math.round(financeScore),
        health_score: Math.round(healthScore),
      },
      metrics: {
        habits: { completed: completedLogs, total: totalHabits, expected: expectedLogs },
        tasks: { completed: completedTasks, total: totalTasks },
        focus_minutes: focusMinutes,
      },
      momentum_index: Math.round(momentumIndex),
      burnout_index: Math.round(burnoutIndex),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Compute score error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
