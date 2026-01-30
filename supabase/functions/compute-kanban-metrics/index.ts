import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const today = new Date().toISOString().split('T')[0]
    const startOfDay = `${today}T00:00:00Z`
    const endOfDay = `${today}T23:59:59Z`

    // Get all workspaces
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id')

    if (!workspaces) {
      return new Response(JSON.stringify({ success: true, message: 'No workspaces' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let processed = 0

    for (const workspace of workspaces) {
      // Get all users in workspace
      const { data: members } = await supabase
        .from('memberships')
        .select('user_id')
        .eq('workspace_id', workspace.id)

      if (!members) continue

      for (const member of members) {
        const userId = member.user_id

        // Count tasks created today
        const { count: tasksCreated } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', startOfDay)
          .lte('created_at', endOfDay)

        // Count tasks completed today
        const { count: tasksCompleted } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'done')
          .gte('completed_at', startOfDay)
          .lte('completed_at', endOfDay)

        // Count task moves (status changes) today
        const { count: tasksMoved } = await supabase
          .from('task_events')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('event_type', 'status_changed')
          .gte('created_at', startOfDay)
          .lte('created_at', endOfDay)

        // Calculate avg time in each column from task_events
        const { data: statusEvents } = await supabase
          .from('task_events')
          .select('task_id, new_value, created_at')
          .eq('user_id', userId)
          .eq('event_type', 'status_changed')
          .order('created_at', { ascending: true })

        // Group by task and calculate durations
        const taskDurations: Record<string, Record<string, number>> = {}
        const lastStatus: Record<string, { status: string; time: Date }> = {}

        for (const event of statusEvents || []) {
          const taskId = event.task_id
          const newStatus = (event.new_value as Record<string, string>)?.status || 'unknown'
          const eventTime = new Date(event.created_at)

          if (lastStatus[taskId]) {
            const duration = eventTime.getTime() - lastStatus[taskId].time.getTime()
            const prevStatus = lastStatus[taskId].status
            
            if (!taskDurations[prevStatus]) {
              taskDurations[prevStatus] = { total: 0, count: 0 }
            }
            taskDurations[prevStatus].total += duration
            taskDurations[prevStatus].count += 1
          }

          lastStatus[taskId] = { status: newStatus, time: eventTime }
        }

        // Calculate averages
        const avgTimeInColumn: Record<string, number> = {}
        for (const [status, data] of Object.entries(taskDurations)) {
          if (data.count > 0) {
            avgTimeInColumn[status] = Math.round((data.total / data.count) / (1000 * 60)) // in minutes
          }
        }

        // Calculate productivity score (0-100)
        const completionRate = (tasksCreated || 0) > 0 
          ? ((tasksCompleted || 0) / (tasksCreated || 1)) * 100 
          : 0
        const activityScore = Math.min((tasksMoved || 0) * 10, 50)
        const productivityScore = Math.min(completionRate + activityScore, 100)

        // Upsert metrics
        await supabase
          .from('kanban_metrics_daily')
          .upsert({
            user_id: userId,
            workspace_id: workspace.id,
            date: today,
            tasks_created: tasksCreated || 0,
            tasks_completed: tasksCompleted || 0,
            tasks_moved: tasksMoved || 0,
            avg_time_in_column: avgTimeInColumn,
            productivity_score: productivityScore
          }, {
            onConflict: 'user_id,workspace_id,date'
          })

        processed++
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed,
      date: today
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    const error = err as Error
    console.error('Compute Kanban Metrics error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
