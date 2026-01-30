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

    // Calculate week start (Monday)
    const today = new Date()
    const dayOfWeek = today.getDay()
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - diff - 7) // Previous week
    const weekStartStr = weekStart.toISOString().split('T')[0]
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    const weekEndStr = weekEnd.toISOString().split('T')[0]

    // Create job run record
    const { data: jobRun } = await supabase
      .from('job_runs')
      .insert({
        job_name: 'weekly-review',
        status: 'running',
        started_at: new Date().toISOString(),
        metadata: { week_start: weekStartStr, week_end: weekEndStr },
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

        // Get daily stats for the week
        const { data: dailyStats } = await supabase
          .from('daily_stats')
          .select('*')
          .eq('user_id', userId)
          .gte('date', weekStartStr)
          .lte('date', weekEndStr)
          .order('date', { ascending: true })

        if (!dailyStats || dailyStats.length === 0) {
          continue
        }

        // Calculate weekly aggregates
        const summary = {
          week_start: weekStartStr,
          week_end: weekEndStr,
          days_tracked: dailyStats.length,
          total_tasks_planned: dailyStats.reduce((sum, d) => sum + d.tasks_planned, 0),
          total_tasks_completed: dailyStats.reduce((sum, d) => sum + d.tasks_completed, 0),
          total_habits_completed: dailyStats.reduce((sum, d) => sum + d.habits_completed, 0),
          total_focus_minutes: dailyStats.reduce((sum, d) => sum + d.focus_minutes, 0),
          avg_completion_rate: dailyStats.reduce((sum, d) => {
            const rate = d.tasks_planned > 0 ? d.tasks_completed / d.tasks_planned : 1
            return sum + rate
          }, 0) / dailyStats.length,
          avg_overload_index: dailyStats.reduce((sum, d) => sum + (d.overload_index || 0), 0) / dailyStats.length,
          avg_clarity_score: dailyStats.reduce((sum, d) => sum + (d.clarity_score || 0), 0) / dailyStats.length,
          best_day: dailyStats.reduce((best, d) => {
            const score = d.tasks_completed + d.habits_completed
            return score > (best?.score || 0) ? { date: d.date, score } : best
          }, { date: '', score: 0 }),
          trends: {
            completion: dailyStats.map(d => ({
              date: d.date,
              rate: d.tasks_planned > 0 ? d.tasks_completed / d.tasks_planned : 1
            })),
            focus: dailyStats.map(d => ({
              date: d.date,
              minutes: d.focus_minutes
            })),
          },
        }

        // Upsert weekly stats (idempotent)
        await supabase
          .from('weekly_stats')
          .upsert({
            user_id: userId,
            week_start: weekStartStr,
            summary,
          }, { onConflict: 'user_id,week_start' })

        // Create notification for user
        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'info',
          title: 'Revue hebdomadaire disponible',
          message: `Vous avez complété ${summary.total_tasks_completed} tâches et ${summary.total_habits_completed} habitudes cette semaine.`,
          payload: { week_start: weekStartStr },
          source: 'cron',
        })

        // Check for achievement triggers
        if (summary.avg_completion_rate >= 0.9) {
          await supabase.from('system_events').insert({
            user_id: userId,
            event_type: 'achievement.weekly_completion',
            entity: 'weekly_stats',
            payload: { completion_rate: summary.avg_completion_rate, week_start: weekStartStr },
            source: 'cron',
          })
        }

        // Check for inactivity
        if (dailyStats.length < 3) {
          await supabase.from('system_events').insert({
            user_id: userId,
            event_type: 'inactivity.detected',
            entity: 'weekly_stats',
            payload: { days_tracked: dailyStats.length, week_start: weekStartStr },
            source: 'cron',
          })
        }

        results.push({ userId, summary })
        processed++
      } catch (userError) {
        console.error(`Error processing user ${profile.user_id}:`, userError)
        failed++
      }
    }

    // Update system health
    await supabase.from('system_health').upsert({
      service: 'weekly-review',
      status: failed === 0 ? 'healthy' : 'degraded',
      message: `Generated weekly review for ${processed} users, ${failed} failed`,
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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    await supabase.from('system_health').upsert({
      service: 'weekly-review',
      status: 'error',
      message: error.message,
      last_check: new Date().toISOString(),
    }, { onConflict: 'service' })

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
