import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Compute Monthly Stats - BI Contract Compliance
 * 
 * Aggregates weekly_stats into monthly_stats for dashboard consumption.
 * Dashboards MUST read from monthly_stats, NOT from core tables.
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

    // Create job run record
    const { data: jobRun } = await supabase
      .from('job_runs')
      .insert({
        job_name: 'compute-monthly-stats',
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single()
    
    jobRunId = jobRun?.id

    // Calculate current month start
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthStartStr = monthStart.toISOString().split('T')[0]

    // Get all daily stats for the current month
    const { data: dailyStats, error: statsError } = await supabase
      .from('daily_stats')
      .select('*')
      .gte('date', monthStartStr)

    if (statsError) throw statsError

    // Group by user
    interface UserMonthlyData {
      user_id: string;
      workspace_id: string | null;
      days: typeof dailyStats;
    }
    
    const userStats = new Map<string, UserMonthlyData>()

    for (const stat of dailyStats || []) {
      const existing = userStats.get(stat.user_id)
      if (existing) {
        existing.days = [...(existing.days || []), stat]
      } else {
        userStats.set(stat.user_id, {
          user_id: stat.user_id,
          workspace_id: stat.workspace_id,
          days: [stat]
        })
      }
    }

    let processed = 0
    let failed = 0

    // Compute monthly aggregates
    for (const [userId, userData] of userStats) {
      try {
        const days = userData.days
        const numDays = days.length

        // Aggregate metrics
        const totalTasksPlanned = days.reduce((sum, d) => sum + (d.tasks_planned || 0), 0)
        const totalTasksCompleted = days.reduce((sum, d) => sum + (d.tasks_completed || 0), 0)
        const totalFocusMinutes = days.reduce((sum, d) => sum + (d.focus_minutes || 0), 0)
        
        // Calculate rates
        const completionRate = totalTasksPlanned > 0 
          ? (totalTasksCompleted / totalTasksPlanned) * 100 
          : 0

        const totalHabitsCompleted = days.reduce((sum, d) => sum + (d.habits_completed || 0), 0)
        const totalHabitsTotal = days.reduce((sum, d) => sum + (d.habits_total || 0), 0)
        const habitAdherence = totalHabitsTotal > 0 
          ? (totalHabitsCompleted / totalHabitsTotal) * 100 
          : 0

        const avgOverloadIndex = numDays > 0
          ? days.reduce((sum, d) => sum + (d.overload_index || 0), 0) / numDays
          : 0

        // Build summary object
        const summary = {
          total_tasks_planned: totalTasksPlanned,
          total_tasks_completed: totalTasksCompleted,
          completion_rate: Math.round(completionRate * 100) / 100,
          total_focus_minutes: totalFocusMinutes,
          avg_overload_index: Math.round(avgOverloadIndex * 100) / 100,
          habit_adherence: Math.round(habitAdherence * 100) / 100,
          days_tracked: numDays,
          top_projects: [] // Would need to aggregate from tasks
        }

        // Upsert monthly stats (idempotent)
        await supabase
          .from('monthly_stats')
          .upsert({
            user_id: userId,
            workspace_id: userData.workspace_id,
            month: monthStartStr,
            summary: summary,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,month' })

        processed++
      } catch (userError) {
        console.error(`Error processing user ${userId}:`, userError)
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
      metadata: { month: monthStartStr, users_processed: processed }
    }).eq('id', jobRunId)

    // Update system health
    await supabase.from('system_health').upsert({
      service: 'compute-monthly-stats',
      status: failed === 0 ? 'healthy' : 'degraded',
      message: `Processed ${processed} users, ${failed} failed`,
      last_check: new Date().toISOString()
    }, { onConflict: 'service' })

    return new Response(JSON.stringify({
      success: true,
      month: monthStartStr,
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
