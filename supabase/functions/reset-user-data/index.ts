import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { userId, confirmReset } = await req.json();

    if (!userId || confirmReset !== 'RESET_ALL_DATA') {
      throw new Error('Invalid reset request. Confirmation required.');
    }

    console.log(`[Reset] Starting data reset for user ${userId}`);

    // TABLES À RESET (dans l'ordre pour respecter les foreign keys)
    const tablesToReset = [
      // D'abord les tables avec foreign keys
      'habit_logs',
      'program_created_items',
      'user_program_progress',
      'user_challenges',
      'user_badges',
      'challenge_logs',
      'routine_logs',
      // Ensuite les tables principales
      'habits',
      'tasks',
      'goals',
      'journal_entries',
      'finance_transactions',
      'budgets',
      'scores_daily',
      'scores_weekly',
      'scores_monthly',
      'daily_stats',
      'focus_sessions',
      'notes',
      'routines',
      'inbox_items',
      'user_programs',
      'challenges',
      'wins',
      'streaks',
    ];

    const results: Record<string, number> = {};

    for (const table of tablesToReset) {
      try {
        const { data, error } = await supabase
          .from(table)
          .delete()
          .eq('user_id', userId)
          .select('id');
        
        const count = data?.length || 0;
        results[table] = count;
        console.log(`[Reset] Deleted from ${table}: ${count} rows`);
        console.log(`[Reset] Deleted from ${table}: ${count || 0} rows`);
      } catch (e) {
        console.log(`[Reset] Table ${table} might not exist or error: ${e}`);
      }
    }

    // RESET gamification_profiles (ne pas supprimer, juste remettre à zéro)
    const { error: gamificationError } = await supabase
      .from('gamification_profiles')
      .update({
        total_xp: 0,
        current_level: 1,
        xp_to_next_level: 50,
        lifetime_habits_completed: 0,
        lifetime_tasks_completed: 0,
        current_streak: 0,
        longest_streak: 0,
        last_activity_date: null,
      })
      .eq('id', userId);

    if (!gamificationError) {
      console.log('[Reset] Reset gamification profile to zero');
    }

    // ARCHIVER pour l'AI (créer une entrée d'archive reset)
    await supabase.from('program_archives').insert({
      user_id: userId,
      program_id: null,
      final_status: 'reset',
      days_completed: 0,
      total_xp_earned: 0,
      completion_rate: 0,
      performance_data: {
        reset_at: new Date().toISOString(),
        reason: 'user_requested_reset',
      },
      ai_analysis: {
        type: 'full_reset',
        tables_cleared: Object.keys(results),
        total_items_deleted: Object.values(results).reduce((a, b) => a + b, 0),
      },
    });

    // NE PAS TOUCHER (préservé pour AI learning) :
    // - user_learning_profile
    // - suggestion_feedback
    // - sage_feedback
    // - ai_metrics
    // - ai_interventions
    // - program_archives (on ajoute, on ne supprime pas)
    // - user_profiles (préférences)
    // - preferences (personnalisation)

    const totalDeleted = Object.values(results).reduce((a, b) => a + b, 0);

    console.log(`[Reset] Completed! Total items deleted: ${totalDeleted}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Données réinitialisées avec succès',
        details: results,
        totalDeleted,
        preserved: [
          'user_learning_profile',
          'suggestion_feedback',
          'sage_feedback',
          'ai_metrics',
          'program_archives',
          'user_profiles',
          'preferences',
        ],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Reset] Error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
