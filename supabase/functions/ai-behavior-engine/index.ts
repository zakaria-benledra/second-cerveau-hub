import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BehaviorContext {
  habits_consistency: number
  tasks_overdue: number
  streak_status: string
  last_activity_days: number
  churn_risk: number
  recent_completions: number
}

function detectSignals(context: BehaviorContext): Array<{ type: string; score: number; metadata: Record<string, unknown> }> {
  const signals: Array<{ type: string; score: number; metadata: Record<string, unknown> }> = []

  // Fatigue detection
  if (context.habits_consistency < 0.4 && context.recent_completions < 3) {
    signals.push({
      type: 'fatigue',
      score: 1 - context.habits_consistency,
      metadata: { consistency: context.habits_consistency, completions: context.recent_completions }
    })
  }

  // Overload detection
  if (context.tasks_overdue > 5) {
    signals.push({
      type: 'overload',
      score: Math.min(context.tasks_overdue / 10, 1),
      metadata: { overdue_count: context.tasks_overdue }
    })
  }

  // Disengagement detection
  if (context.last_activity_days > 3) {
    signals.push({
      type: 'disengagement',
      score: Math.min(context.last_activity_days / 7, 1),
      metadata: { days_inactive: context.last_activity_days }
    })
  }

  // Momentum detection (positive)
  if (context.habits_consistency > 0.8 && context.recent_completions > 5) {
    signals.push({
      type: 'momentum',
      score: context.habits_consistency,
      metadata: { streak: context.streak_status, completions: context.recent_completions }
    })
  }

  // Relapse risk
  if (context.churn_risk > 0.6) {
    signals.push({
      type: 'relapse_risk',
      score: context.churn_risk,
      metadata: { risk_level: context.churn_risk > 0.8 ? 'critical' : 'high' }
    })
  }

  return signals
}

function generateIntervention(signals: Array<{ type: string; score: number }>, context: BehaviorContext): { type: string; message: string } | null {
  // Priority: relapse_risk > overload > fatigue > disengagement > momentum (praise)
  const priorityOrder = ['relapse_risk', 'overload', 'fatigue', 'disengagement', 'momentum']
  
  const sortedSignals = signals.sort((a, b) => {
    const aIdx = priorityOrder.indexOf(a.type)
    const bIdx = priorityOrder.indexOf(b.type)
    return aIdx - bIdx
  })

  const primary = sortedSignals[0]
  if (!primary) return null

  switch (primary.type) {
    case 'relapse_risk':
      return {
        type: 'warning',
        message: `⚠️ J'ai détecté un risque de décrochage. Tu as fait ${context.recent_completions} actions cette semaine. Concentre-toi sur UNE seule habitude aujourd'hui. Laquelle choisis-tu ?`
      }
    case 'overload':
      return {
        type: 'restructure',
        message: `🔄 Tu as ${context.tasks_overdue} tâches en retard. C'est trop. Je te propose de reporter les moins urgentes et de te concentrer sur les 3 plus importantes. Veux-tu que je restructure ta liste ?`
      }
    case 'fatigue':
      return {
        type: 'motivation',
        message: `💪 Ta cohérence est à ${Math.round(context.habits_consistency * 100)}%. C'est normal de ralentir parfois. Une seule action aujourd'hui peut relancer ta dynamique. Qu'est-ce qui serait facile et satisfaisant ?`
      }
    case 'disengagement':
      return {
        type: 'challenge',
        message: `🎯 Ça fait ${context.last_activity_days} jours qu'on ne s'est pas vus. Petit défi : complète 1 habitude et 1 tâche aujourd'hui. Juste ça. Tu relèves ?`
      }
    case 'momentum':
      return {
        type: 'praise',
        message: `🔥 Incroyable ! ${context.recent_completions} actions complétées cette semaine avec ${Math.round(context.habits_consistency * 100)}% de cohérence. Tu construis quelque chose de puissant. Continue !`
      }
    default:
      return null
  }
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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get workspace
    const { data: membership } = await supabase
      .from('memberships')
      .select('workspace_id')
      .eq('user_id', user.id)
      .single()

    const workspaceId = membership?.workspace_id

    // Gather behavioral context
    const today = new Date().toISOString().split('T')[0]
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Get habits KPI
    const { data: habitsKpi } = await supabase
      .from('habits_kpi')
      .select('consistency_7d')
      .eq('user_id', user.id)
      .gte('date', sevenDaysAgo)
      .order('date', { ascending: false })
      .limit(1)

    // Get overdue tasks
    const { count: overdueTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'todo')
      .lt('due_date', today)
      .is('deleted_at', null)

    // Get recent completions
    const { count: recentCompletions } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'done')
      .gte('completed_at', sevenDaysAgo)

    // Get churn risk
    const { data: churnRisk } = await supabase
      .from('churn_risk_scores')
      .select('risk_score')
      .eq('user_id', user.id)
      .single()

    // Get last activity
    const { data: lastActivity } = await supabase
      .from('audit_log')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    const lastActivityDays = lastActivity?.[0]
      ? Math.floor((Date.now() - new Date(lastActivity[0].created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0

    const context: BehaviorContext = {
      habits_consistency: habitsKpi?.[0]?.consistency_7d || 0,
      tasks_overdue: overdueTasks || 0,
      streak_status: (habitsKpi?.[0]?.consistency_7d || 0) > 0.7 ? 'active' : 'broken',
      last_activity_days: lastActivityDays,
      churn_risk: churnRisk?.risk_score || 0,
      recent_completions: recentCompletions || 0
    }

    // Detect signals
    const signals = detectSignals(context)

    // Store signals
    if (signals.length > 0) {
      await supabase.from('behavior_signals').insert(
        signals.map(s => ({
          user_id: user.id,
          workspace_id: workspaceId,
          signal_type: s.type,
          score: s.score,
          source: 'ai-behavior-engine',
          metadata: s.metadata
        }))
      )
    }

    // Generate intervention
    const intervention = generateIntervention(signals, context)

    if (intervention) {
      // Check if similar intervention exists in last 24h
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: existingIntervention } = await supabase
        .from('ai_interventions')
        .select('id')
        .eq('user_id', user.id)
        .eq('intervention_type', intervention.type)
        .gte('created_at', oneDayAgo)
        .limit(1)

      if (!existingIntervention || existingIntervention.length === 0) {
        const { data: newIntervention, error: insertError } = await supabase
          .from('ai_interventions')
          .insert({
            user_id: user.id,
            workspace_id: workspaceId,
            intervention_type: intervention.type,
            context: context,
            ai_message: intervention.message,
            user_action: 'pending'
          })
          .select()
          .single()

        if (insertError) throw insertError

        return new Response(JSON.stringify({
          success: true,
          intervention: newIntervention,
          signals: signals,
          context: context
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // Return existing pending intervention if any
    const { data: pendingIntervention } = await supabase
      .from('ai_interventions')
      .select('*')
      .eq('user_id', user.id)
      .eq('user_action', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)

    return new Response(JSON.stringify({
      success: true,
      intervention: pendingIntervention?.[0] || null,
      signals: signals,
      context: context
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    const error = err as Error
    console.error('AI Behavior Engine error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
