import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { startJobRun, completeJobRun, failJobRun, type JobContext } from '../_shared/job-tracker.ts'

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

  const jobCtx = await startJobRun(supabase, 'compute-funnel-daily')

  try {
    const body = await req.json().catch(() => ({}))
    const targetDate = body.date || new Date().toISOString().split('T')[0]

    // Get all workspaces
    const { data: workspaces, error: wsError } = await supabase
      .from('workspaces')
      .select('id')

    if (wsError) throw wsError

    let processed = 0
    let failed = 0

    for (const workspace of workspaces || []) {
      try {
        // Get journey events for the day
        const { data: events } = await supabase
          .from('user_journey_events')
          .select('event_type, user_id')
          .eq('workspace_id', workspace.id)
          .gte('created_at', `${targetDate}T00:00:00Z`)
          .lt('created_at', `${targetDate}T23:59:59Z`)

        // Calculate metrics
        const signups = new Set(events?.filter(e => e.event_type === 'signup').map(e => e.user_id)).size
        const logins = new Set(events?.filter(e => e.event_type === 'login').map(e => e.user_id)).size
        
        // Activation = completed at least 1 habit OR 1 task
        const activatedUsers = new Set(
          events?.filter(e => 
            ['habit_completed', 'task_completed', 'finance_imported'].includes(e.event_type)
          ).map(e => e.user_id)
        ).size

        // AI engaged = accepted at least 1 AI action
        const aiEngaged = new Set(
          events?.filter(e => e.event_type === 'ai_action_accepted').map(e => e.user_id)
        ).size

        // Finance connected = imported finance data
        const financeConnected = new Set(
          events?.filter(e => e.event_type === 'finance_imported').map(e => e.user_id)
        ).size

        // Calculate retained (users active today who were active D-7)
        const sevenDaysAgo = new Date(targetDate)
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

        const { data: retainedEvents } = await supabase
          .from('user_journey_events')
          .select('user_id')
          .eq('workspace_id', workspace.id)
          .gte('created_at', `${sevenDaysAgoStr}T00:00:00Z`)
          .lt('created_at', `${sevenDaysAgoStr}T23:59:59Z`)

        const retainedUserIds = new Set(retainedEvents?.map(e => e.user_id) || [])
        const todayUserIds = new Set(events?.map(e => e.user_id) || [])
        const retainedCount = [...todayUserIds].filter(id => retainedUserIds.has(id)).length

        // Calculate rates
        const activationRate = logins > 0 ? (activatedUsers / logins) * 100 : 0
        const retentionRate = retainedUserIds.size > 0 ? (retainedCount / retainedUserIds.size) * 100 : 0

        // Upsert funnel data
        const { error: upsertError } = await supabase
          .from('funnel_daily')
          .upsert({
            date: targetDate,
            workspace_id: workspace.id,
            visits: logins,
            signups,
            activated_users: activatedUsers,
            retained_users: retainedCount,
            churned_users: 0, // Calculated separately
            ai_engaged_users: aiEngaged,
            finance_connected_users: financeConnected,
            activation_rate: activationRate,
            retention_rate: retentionRate,
          }, { onConflict: 'date,workspace_id' })

        if (upsertError) throw upsertError

        // Check for alerts
        if (activationRate < 20 && signups > 0) {
          await supabase.from('system_events').insert({
            user_id: null,
            workspace_id: workspace.id,
            event_type: 'low_activation_alert',
            entity: 'funnel',
            payload: { date: targetDate, activation_rate: activationRate, signups }
          })
        }

      processed++
      } catch (err) {
        console.error(`Error processing workspace ${workspace.id}:`, err)
        failed++
      }
    }

    await completeJobRun(jobCtx, processed, failed)

    return new Response(JSON.stringify({ 
      success: true, 
      date: targetDate,
      workspaces_processed: processed,
      workspaces_failed: failed
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    const error = err as Error
    console.error('Error computing funnel:', error)
    await failJobRun(jobCtx, error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
