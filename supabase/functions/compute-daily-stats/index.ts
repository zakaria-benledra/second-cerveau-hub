import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getRequiredWorkspaceId } from '../_shared/workspace.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Compute Daily Stats - BI Contract Compliance
 * 
 * Aggregates operational data into daily_stats for dashboard consumption.
 * Dashboards MUST read from daily_stats, NOT from core tables.
 * 
 * This function can be triggered:
 * - By user (for recalculation)
 * - By nightly cron job
 */

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

    // Parse request body
    const body = await req.json().catch(() => ({}))
    const targetDate = body.date || new Date().toISOString().split('T')[0]
    const userId = body.user_id

    // Create job run record
    const { data: jobRun } = await supabase
      .from('job_runs')
      .insert({
        job_name: 'compute-daily-stats',
        status: 'running',
        started_at: new Date().toISOString(),
        metadata: { target_date: targetDate, user_id: userId || 'all' }
      })
      .select()
      .single()
    
    jobRunId = jobRun?.id

    // Build user filter
    let userFilter: string[] = []
    if (userId) {
      userFilter = [userId]
    } else {
      // Get all users who have data today
      const { data: activeUsers } = await supabase
        .from('profiles')
        .select('user_id')
      userFilter = (activeUsers || []).map(u => u.user_id)
    }

    let processed = 0
    let failed = 0

    for (const uid of userFilter) {
      try {
        // Get user's workspace
        const { data: membership } = await supabase
          .from('memberships')
          .select('workspace_id')
          .eq('user_id', uid)
          .limit(1)
          .single()

        const workspaceId = membership?.workspace_id

        // Get tasks for today
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id, status, estimate_min, due_date')
          .eq('user_id', uid)
          .or(`due_date.eq.${targetDate},start_date.eq.${targetDate}`)

        const tasksPlanned = tasks?.length || 0
        const tasksCompleted = tasks?.filter(t => t.status === 'done').length || 0

        // Get habits for today
        const { data: habits } = await supabase
          .from('habits')
          .select('id')
          .eq('user_id', uid)
          .eq('is_active', true)

        const { data: habitLogs } = await supabase
          .from('habit_logs')
          .select('id')
          .eq('user_id', uid)
          .eq('date', targetDate)
          .eq('completed', true)

        const habitsTotal = habits?.length || 0
        const habitsCompleted = habitLogs?.length || 0

        // Get focus sessions for today
        const { data: focusSessions } = await supabase
          .from('focus_sessions')
          .select('duration_min')
          .eq('user_id', uid)
          .gte('start_time', `${targetDate}T00:00:00`)
          .lte('start_time', `${targetDate}T23:59:59`)

        const focusMinutes = focusSessions?.reduce((sum, s) => sum + (s.duration_min || 0), 0) || 0

        // Get user's daily capacity
        const { data: preferences } = await supabase
          .from('preferences')
          .select('daily_capacity_min')
          .eq('user_id', uid)
          .single()

        const dailyCapacity = preferences?.daily_capacity_min || 480

        // Calculate overload index
        const totalEstimate = tasks?.reduce((sum, t) => sum + (t.estimate_min || 30), 0) || 0
        const overloadIndex = Math.min(2, totalEstimate / dailyCapacity)

        // Calculate clarity score (tasks with estimate + due_date)
        const clearTasks = tasks?.filter(t => t.estimate_min && t.due_date).length || 0
        const clarityScore = tasksPlanned > 0 ? clearTasks / tasksPlanned : 0

        // Upsert daily stats (idempotent)
        await supabase
          .from('daily_stats')
          .upsert({
            user_id: uid,
            workspace_id: workspaceId,
            date: targetDate,
            tasks_planned: tasksPlanned,
            tasks_completed: tasksCompleted,
            habits_completed: habitsCompleted,
            habits_total: habitsTotal,
            focus_minutes: focusMinutes,
            overload_index: Number(overloadIndex.toFixed(2)),
            clarity_score: Number(clarityScore.toFixed(2)),
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,date' })

        processed++
      } catch (userError) {
        console.error(`Error processing user ${uid}:`, userError)
        failed++
      }
    }

    // Update job run
    await supabase.from('job_runs').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      records_processed: processed,
      records_failed: failed,
      metadata: { target_date: targetDate, users_processed: processed }
    }).eq('id', jobRunId)

    // Update system health
    await supabase.from('system_health').upsert({
      service: 'compute-daily-stats',
      status: failed === 0 ? 'healthy' : 'degraded',
      message: `Processed ${processed} users, ${failed} failed`,
      last_check: new Date().toISOString()
    }, { onConflict: 'service' })

    return new Response(JSON.stringify({
      success: true,
      date: targetDate,
      processed,
      failed
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    const error = err as Error
    console.error('Error:', error)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (jobRunId) {
      await supabase.from('job_runs').update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        error_message: error.message
      }).eq('id', jobRunId)
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
