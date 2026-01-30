import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AlertRule {
  signalType: string
  threshold: number
  urgency: 'low' | 'normal' | 'high' | 'critical'
  titleTemplate: string
  messageTemplate: string
}

const alertRules: AlertRule[] = [
  {
    signalType: 'relapse_risk',
    threshold: 0.7,
    urgency: 'critical',
    titleTemplate: '⚠️ Risque de décrochage détecté',
    messageTemplate: 'Tu montres des signes de désengagement. Une action simple aujourd\'hui peut tout changer.'
  },
  {
    signalType: 'overload',
    threshold: 0.6,
    urgency: 'high',
    titleTemplate: '🔥 Surcharge détectée',
    messageTemplate: 'Trop de tâches en retard. Concentre-toi sur l\'essentiel.'
  },
  {
    signalType: 'fatigue',
    threshold: 0.5,
    urgency: 'normal',
    titleTemplate: '😴 Signal de fatigue',
    messageTemplate: 'Ta cohérence baisse. Prends soin de toi et recommence petit.'
  },
  {
    signalType: 'momentum',
    threshold: 0.8,
    urgency: 'low',
    titleTemplate: '🔥 Tu es en feu !',
    messageTemplate: 'Excellente dynamique ! Continue sur cette lancée.'
  },
  {
    signalType: 'streak_break',
    threshold: 0.5,
    urgency: 'high',
    titleTemplate: '💔 Streak en danger',
    messageTemplate: 'Tu risques de perdre ta série. Une seule action peut la sauver !'
  }
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // Get recent behavior signals that haven't been alerted
    const { data: recentSignals } = await supabase
      .from('behavior_signals')
      .select('*')
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false })

    if (!recentSignals || recentSignals.length === 0) {
      return new Response(JSON.stringify({ success: true, alerts_created: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Group signals by user
    const userSignals: Record<string, typeof recentSignals> = {}
    for (const signal of recentSignals) {
      if (!userSignals[signal.user_id]) {
        userSignals[signal.user_id] = []
      }
      userSignals[signal.user_id].push(signal)
    }

    let alertsCreated = 0

    for (const [userId, signals] of Object.entries(userSignals)) {
      // Get highest priority signal for this user
      const workspaceId = signals[0]?.workspace_id

      for (const rule of alertRules) {
        const matchingSignal = signals.find(
          s => s.signal_type === rule.signalType && s.score >= rule.threshold
        )

        if (matchingSignal) {
          // Check if alert already exists for this type in last 24h
          const { data: existingAlert } = await supabase
            .from('ai_notifications')
            .select('id')
            .eq('user_id', userId)
            .eq('notification_type', matchingSignal.signal_type)
            .gte('created_at', oneDayAgo)
            .limit(1)

          if (!existingAlert || existingAlert.length === 0) {
            // Create alert
            await supabase.from('ai_notifications').insert({
              user_id: userId,
              workspace_id: workspaceId,
              title: rule.titleTemplate,
              message: rule.messageTemplate,
              urgency: rule.urgency,
              notification_type: matchingSignal.signal_type,
              delivered: false,
              action_url: rule.signalType === 'overload' ? '/kanban' : '/today'
            })

            alertsCreated++
            break // Only one alert per user per run
          }
        }
      }
    }

    // Also check for streak achievements
    const { data: habitsKpi } = await supabase
      .from('habits_kpi')
      .select('user_id, workspace_id, streak_at_date')
      .eq('date', new Date().toISOString().split('T')[0])
      .gte('streak_at_date', 7)

    for (const kpi of habitsKpi || []) {
      const streakMilestones = [7, 14, 21, 30, 60, 90, 100, 365]
      const milestone = streakMilestones.find(m => kpi.streak_at_date === m)

      if (milestone) {
        // Check if milestone alert exists
        const { data: existingMilestone } = await supabase
          .from('ai_notifications')
          .select('id')
          .eq('user_id', kpi.user_id)
          .eq('notification_type', 'streak_milestone')
          .ilike('message', `%${milestone}%`)
          .limit(1)

        if (!existingMilestone || existingMilestone.length === 0) {
          await supabase.from('ai_notifications').insert({
            user_id: kpi.user_id,
            workspace_id: kpi.workspace_id,
            title: '🏆 Milestone atteint !',
            message: `Incroyable ! ${milestone} jours de suite. Tu construis une vraie discipline.`,
            urgency: 'low',
            notification_type: 'streak_milestone',
            delivered: false,
            action_url: '/habits'
          })
          alertsCreated++
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      alerts_created: alertsCreated
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    const error = err as Error
    console.error('Push Behavior Alerts error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
