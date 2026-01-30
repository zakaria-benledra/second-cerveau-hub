import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Compute Weekly Stats - BI Contract Compliance
 * 
 * Aggregates daily_stats into weekly_stats for dashboard consumption.
 * Dashboards MUST read from weekly_stats, NOT from core tables.
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
        job_name: 'compute-weekly-stats',
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single()
    
    jobRunId = jobRun?.id

    // Calculate current week start (Monday)
    const now = new Date()
    const dayOfWeek = now.getDay()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    weekStart.setHours(0, 0, 0, 0)
    const weekStartStr = weekStart.toISOString().split('T')[0]

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    const weekEndStr = weekEnd.toISOString().split('T')[0]

    // Get all users with daily stats this week
    const { data: dailyStats, error: statsError } = await supabase
      .from('daily_stats')
      .select('*')
      .gte('date', weekStartStr)
      .lte('date', weekEndStr)

    if (statsError) throw statsError

    // Group by user
    interface UserStatsEntry {
      user_id: string;
      workspace_id: string | null;
      days: typeof dailyStats;
    }
    
    const userStats = new Map<string, UserStatsEntry>()

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

    // Compute weekly aggregates
    for (const [userId, userData] of userStats) {
      try {
        const days = userData.days
        const numDays = days.length

        // Aggregate metrics
        const tasksCompleted = days.reduce((sum, d) => sum + (d.tasks_completed || 0), 0)
        const tasksPlanned = days.reduce((sum, d) => sum + (d.tasks_planned || 0), 0)
        const focusMinutes = days.reduce((sum, d) => sum + (d.focus_minutes || 0), 0)
        
        // Calculate habits completion rate
        const totalHabitsCompleted = days.reduce((sum, d) => sum + (d.habits_completed || 0), 0)
        const totalHabitsTotal = days.reduce((sum, d) => sum + (d.habits_total || 0), 0)
        const habitsCompletionRate = totalHabitsTotal > 0 
          ? (totalHabitsCompleted / totalHabitsTotal) * 100 
          : 0

        // Calculate average daily score (using clarity_score as proxy)
        const avgDailyScore = numDays > 0
          ? days.reduce((sum, d) => sum + (d.clarity_score || 50), 0) / numDays
          : 50

        // Calculate momentum trend (compare first half vs second half of week)
        const firstHalf = days.slice(0, Math.ceil(numDays / 2))
        const secondHalf = days.slice(Math.ceil(numDays / 2))
        const firstAvg = firstHalf.length > 0 
          ? firstHalf.reduce((sum, d) => sum + (d.clarity_score || 50), 0) / firstHalf.length 
          : 50
        const secondAvg = secondHalf.length > 0 
          ? secondHalf.reduce((sum, d) => sum + (d.clarity_score || 50), 0) / secondHalf.length 
          : 50
        const momentumTrend = secondAvg - firstAvg

        // Upsert weekly stats (idempotent)
        await supabase
          .from('weekly_stats')
          .upsert({
            user_id: userId,
            workspace_id: userData.workspace_id,
            week_start: weekStartStr,
            tasks_completed: tasksCompleted,
            tasks_planned: tasksPlanned,
            habits_completion_rate: Math.round(habitsCompletionRate * 100) / 100,
            focus_minutes: focusMinutes,
            avg_daily_score: Math.round(avgDailyScore * 100) / 100,
            momentum_trend: Math.round(momentumTrend * 100) / 100,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,week_start' })

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
      metadata: { week_start: weekStartStr, users_processed: processed }
    }).eq('id', jobRunId)

    // Update system health
    await supabase.from('system_health').upsert({
      service: 'compute-weekly-stats',
      status: failed === 0 ? 'healthy' : 'degraded',
      message: `Processed ${processed} users, ${failed} failed`,
      last_check: new Date().toISOString()
    }, { onConflict: 'service' })

    return new Response(JSON.stringify({
      success: true,
      week_start: weekStartStr,
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
