import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()
  let jobRunId: string | null = null

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const today = new Date().toISOString().split('T')[0]
    
    // Create job run record
    const { data: jobRun } = await supabase
      .from('job_runs')
      .insert({
        job_name: 'nightly-stats',
        status: 'running',
        started_at: new Date().toISOString(),
        metadata: { date: today },
      })
      .select()
      .single()
    
    jobRunId = jobRun?.id

    // Get all users
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id')

    if (!profiles) {
      await updateJobRun(supabase, jobRunId, 'completed', 0, 0, Date.now() - startTime, 'No users found')
      return new Response(JSON.stringify({ message: 'No users found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const results = []
    let processed = 0
    let failed = 0

    for (const profile of profiles) {
      try {
        const userId = profile.user_id

        // Calculate tasks planned (due today or start today)
        const { count: tasksPlanned } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .or(`due_date.eq.${today},start_date.eq.${today}`)

        // Calculate tasks completed today
        const { count: tasksCompleted } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'done')
          .gte('completed_at', `${today}T00:00:00`)
          .lte('completed_at', `${today}T23:59:59`)

        // Calculate habits completed today
        const { count: habitsCompleted } = await supabase
          .from('habit_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('date', today)
          .eq('completed', true)

        // Count total active habits
        const { count: habitsTotal } = await supabase
          .from('habits')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_active', true)

        // Calculate focus minutes
        const { data: focusSessions } = await supabase
          .from('focus_sessions')
          .select('duration_min')
          .eq('user_id', userId)
          .gte('start_time', `${today}T00:00:00`)
          .lte('start_time', `${today}T23:59:59`)
          .not('duration_min', 'is', null)

        const focusMinutes = focusSessions?.reduce((sum, s) => sum + (s.duration_min || 0), 0) || 0

        // Calculate overload index
        const { data: todayTasks } = await supabase
          .from('tasks')
          .select('estimate_min')
          .eq('user_id', userId)
          .or(`due_date.eq.${today},start_date.eq.${today}`)
          .neq('status', 'done')

        const totalEstimate = todayTasks?.reduce((sum, t) => sum + (t.estimate_min || 30), 0) || 0
        
        // Get user preference for daily capacity (default 480 = 8 hours)
        const { data: preferences } = await supabase
          .from('preferences')
          .select('daily_capacity_min')
          .eq('user_id', userId)
          .single()

        const dailyCapacity = preferences?.daily_capacity_min || 480
        const overloadIndex = dailyCapacity > 0 ? (totalEstimate / dailyCapacity) : 0

        // Calculate clarity score (tasks with estimate + due date / total)
        const { count: totalTasks } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .neq('status', 'done')

        const { count: clarifiedTasks } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .neq('status', 'done')
          .not('estimate_min', 'is', null)
          .not('due_date', 'is', null)

        const clarityScore = (totalTasks || 0) > 0 
          ? ((clarifiedTasks || 0) / (totalTasks || 1)) 
          : 1

        // Upsert daily stats (idempotent)
        const statsData = {
          user_id: userId,
          date: today,
          tasks_planned: tasksPlanned || 0,
          tasks_completed: tasksCompleted || 0,
          habits_completed: habitsCompleted || 0,
          habits_total: habitsTotal || 0,
          focus_minutes: focusMinutes,
          overload_index: Math.round(overloadIndex * 100) / 100,
          clarity_score: Math.round(clarityScore * 100) / 100,
        }

        await supabase
          .from('daily_stats')
          .upsert(statsData, { onConflict: 'user_id,date' })

        // Emit events for automation triggers
        if (overloadIndex > 1.2) {
          await supabase.from('system_events').insert({
            user_id: userId,
            event_type: 'overload.detected',
            entity: 'daily_stats',
            payload: { overload_index: overloadIndex, date: today },
            source: 'cron',
          })
        }

        // Check for habit streaks that might be broken
        const { data: activeHabits } = await supabase
          .from('habits')
          .select('id')
          .eq('user_id', userId)
          .eq('is_active', true)
          .eq('target_frequency', 'daily')

        if (activeHabits) {
          for (const habit of activeHabits) {
            const { data: todayLog } = await supabase
              .from('habit_logs')
              .select('completed')
              .eq('habit_id', habit.id)
              .eq('date', today)
              .single()

            if (!todayLog || !todayLog.completed) {
              await supabase.from('system_events').insert({
                user_id: userId,
                event_type: 'habit.missed',
                entity: 'habits',
                entity_id: habit.id,
                payload: { date: today },
                source: 'cron',
              })
            }
          }
        }

        results.push({ userId, ...statsData })
        processed++
      } catch (userError) {
        console.error(`Error processing user ${profile.user_id}:`, userError)
        failed++
      }
    }

    // Update system health
    await supabase.from('system_health').upsert({
      service: 'nightly-stats',
      status: failed === 0 ? 'healthy' : 'degraded',
      message: `Processed ${processed} users, ${failed} failed`,
      last_check: new Date().toISOString(),
    }, { onConflict: 'service' })

    // Update job run
    await updateJobRun(supabase, jobRunId, 'completed', processed, failed, Date.now() - startTime)

    return new Response(JSON.stringify({ 
      success: true, 
      processed,
      failed,
      results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    const error = err as Error
    console.error('Error:', error)

    // Update system health with error
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    await supabase.from('system_health').upsert({
      service: 'nightly-stats',
      status: 'error',
      message: error.message,
      last_check: new Date().toISOString(),
    }, { onConflict: 'service' })

    // Update job run with error
    if (jobRunId) {
      await updateJobRun(supabase, jobRunId, 'failed', 0, 0, Date.now() - startTime, error.message)
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function updateJobRun(
  supabase: any, 
  jobRunId: string | null, 
  status: string, 
  processed: number, 
  failed: number, 
  durationMs: number,
  errorMessage?: string
) {
  if (!jobRunId) return
  
  await supabase
    .from('job_runs')
    .update({
      status,
      records_processed: processed,
      records_failed: failed,
      duration_ms: durationMs,
      completed_at: new Date().toISOString(),
      error_message: errorMessage,
    })
    .eq('id', jobRunId)
}
