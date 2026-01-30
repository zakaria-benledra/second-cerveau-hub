import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { startJobRun, completeJobRun, failJobRun, type JobContext } from '../_shared/job-tracker.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChurnSignals {
  habit_consistency_drop: boolean
  finance_inactivity: boolean
  ai_rejection_streak: boolean
  task_overload: boolean
  days_since_activity: number
  habit_completion_rate_7d: number
  ai_acceptance_rate: number
  task_completion_rate: number
}

function calculateRiskLevel(score: number): string {
  if (score >= 80) return 'critical'
  if (score >= 60) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const jobCtx = await startJobRun(supabase, 'compute-churn-risk')

  try {
    // Get all users with their workspace
    const { data: memberships, error: memberError } = await supabase
      .from('memberships')
      .select('user_id, workspace_id')

    if (memberError) throw memberError

    const today = new Date()
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    let processed = 0
    let failed = 0

    for (const membership of memberships || []) {
      try {
        const { user_id, workspace_id } = membership

        // Get last activity
        const { data: lastEvent } = await supabase
          .from('user_journey_events')
          .select('created_at')
          .eq('user_id', user_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        const lastActivity = lastEvent?.created_at ? new Date(lastEvent.created_at) : null
        const daysSinceActivity = lastActivity 
          ? Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
          : 30

        // Get habit completion rate (7d)
        const { data: habitLogs } = await supabase
          .from('habit_logs')
          .select('completed')
          .eq('user_id', user_id)
          .gte('date', sevenDaysAgo.toISOString().split('T')[0])

        const habitCompletionRate = habitLogs?.length 
          ? (habitLogs.filter(h => h.completed).length / habitLogs.length) * 100
          : 0

        // Get AI action acceptance rate
        const { data: aiActions } = await supabase
          .from('agent_actions')
          .select('status')
          .eq('user_id', user_id)
          .gte('created_at', sevenDaysAgo.toISOString())

        const aiTotal = aiActions?.length || 0
        const aiAccepted = aiActions?.filter(a => a.status === 'approved').length || 0
        const aiAcceptanceRate = aiTotal > 0 ? (aiAccepted / aiTotal) * 100 : 50

        // Get task completion rate
        const { data: tasks } = await supabase
          .from('tasks')
          .select('status')
          .eq('user_id', user_id)
          .gte('created_at', sevenDaysAgo.toISOString())

        const taskTotal = tasks?.length || 0
        const taskCompleted = tasks?.filter(t => t.status === 'done').length || 0
        const taskCompletionRate = taskTotal > 0 ? (taskCompleted / taskTotal) * 100 : 50

        // Check finance activity
        const { data: financeEvents } = await supabase
          .from('user_journey_events')
          .select('id')
          .eq('user_id', user_id)
          .eq('event_type', 'finance_transaction_added')
          .gte('created_at', sevenDaysAgo.toISOString())
          .limit(1)

        const financeInactive = (financeEvents?.length || 0) === 0

        // Calculate signals
        const signals: ChurnSignals = {
          habit_consistency_drop: habitCompletionRate < 30,
          finance_inactivity: financeInactive,
          ai_rejection_streak: aiAcceptanceRate < 20 && aiTotal >= 3,
          task_overload: taskCompletionRate < 20 && taskTotal > 10,
          days_since_activity: daysSinceActivity,
          habit_completion_rate_7d: habitCompletionRate,
          ai_acceptance_rate: aiAcceptanceRate,
          task_completion_rate: taskCompletionRate,
        }

        // Calculate risk score (0-100)
        let riskScore = 0
        
        // Inactivity weight (max 40 points)
        riskScore += Math.min(daysSinceActivity * 5, 40)
        
        // Habit consistency (max 20 points)
        if (signals.habit_consistency_drop) riskScore += 20
        
        // AI rejection (max 15 points)
        if (signals.ai_rejection_streak) riskScore += 15
        
        // Task overload (max 15 points)
        if (signals.task_overload) riskScore += 15
        
        // Finance inactivity (max 10 points)
        if (signals.finance_inactivity) riskScore += 10

        riskScore = Math.min(riskScore, 100)
        const riskLevel = calculateRiskLevel(riskScore)

        // Upsert churn risk
        const { error: upsertError } = await supabase
          .from('churn_risk_scores')
          .upsert({
            user_id,
            workspace_id,
            risk_score: riskScore,
            risk_level: riskLevel,
            signals,
            last_activity_at: lastActivity?.toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })

        if (upsertError) throw upsertError

        // Create alert for critical users
        if (riskLevel === 'critical') {
          await supabase.from('system_events').insert({
            user_id,
            workspace_id,
            event_type: 'churn_risk_critical',
            entity: 'user',
            entity_id: user_id,
            payload: { risk_score: riskScore, signals }
          })
        }

        processed++
      } catch (err) {
        console.error(`Error processing user ${membership.user_id}:`, err)
        failed++
      }
    }

    await completeJobRun(jobCtx, processed, failed)

    return new Response(JSON.stringify({ 
      success: true,
      users_processed: processed,
      users_failed: failed
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    const error = err as Error
    console.error('Error computing churn risk:', error)
    await failJobRun(jobCtx, error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
