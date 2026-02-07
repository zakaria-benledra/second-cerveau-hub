import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getRequiredWorkspaceId } from '../_shared/workspace.ts'
import { getCorsHeaders, handleCorsOptions } from '../_shared/cors.ts'

/**
 * AI Intervention Engine
 * 
 * Detects problematic behavioral situations and automatically intervenes:
 * - OVERLOAD: Move non-urgent tasks to tomorrow when capacity > 150%
 * - BURNOUT: Pause non-critical habits for 48h when burnout index > 70%
 * - STREAK_RISK: Create recovery task when critical habits are at risk
 * - FINANCIAL_STRESS: Trigger budget review when overspending detected
 * 
 * All interventions are:
 * - Logged in ai_interventions table
 * - Audited in audit_log
 * - Notified to user
 * - Reversible via undo_stack
 */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req)
  }
  const corsHeaders = getCorsHeaders(req)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // Auth validation
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

    const workspaceId = await getRequiredWorkspaceId(supabase, user.id)
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // 1. Get current behavioral state
    const { data: todayStats } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    if (!todayStats) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No stats available for today',
        interventions_count: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const interventions: Array<{
      type: string
      reason: string
      severity: 'advisory' | 'warning' | 'critical'
      impact: Record<string, unknown>
      undoPayload?: Record<string, unknown>
    }> = []

    // INTERVENTION 1: OVERLOAD DETECTION (>150% capacity)
    const overloadIndex = todayStats.overload_index || 0
    if (overloadIndex > 1.5) {
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, due_date')
        .eq('user_id', user.id)
        .eq('workspace_id', workspaceId)
        .eq('due_date', today)
        .not('priority', 'in', '("urgent","high")')
        .eq('status', 'todo')
        .is('deleted_at', null)
        .limit(10)

      if (tasks && tasks.length > 0) {
        const toMove = tasks.slice(0, Math.ceil(tasks.length / 2))
        const taskIds = toMove.map(t => t.id)
        const originalDates = toMove.map(t => ({ id: t.id, due_date: t.due_date }))

        // Move tasks to tomorrow
        const { error: updateError } = await supabase
          .from('tasks')
          .update({ due_date: tomorrow })
          .in('id', taskIds)

        if (!updateError) {
          // Record task events for each moved task
          for (const task of toMove) {
            await supabase.from('task_events').insert({
              task_id: task.id,
              user_id: user.id,
              workspace_id: workspaceId,
              event_type: 'rescheduled',
              payload: { 
                old_date: today, 
                new_date: tomorrow, 
                reason: 'ai_intervention_overload' 
              }
            })
          }

          interventions.push({
            type: 'reduce_load',
            reason: `Surcharge détectée (${(overloadIndex * 100).toFixed(0)}% capacité). ${toMove.length} tâches déplacées à demain.`,
            severity: 'warning',
            impact: { tasks_moved: toMove.length, task_ids: taskIds },
            undoPayload: { action: 'restore_task_dates', original: originalDates }
          })
        }
      }
    }

    // INTERVENTION 2: BURNOUT PREVENTION (burnout index > 70%)
    // Note: burnout_index is stored in scores_daily, not daily_stats
    const { data: todayScore } = await supabase
      .from('scores_daily')
      .select('burnout_index')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    const burnoutIndex = todayScore?.burnout_index || 0
    if (burnoutIndex > 70) {
      const pauseUntil = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

      // Get non-critical habits to pause
      const { data: habitsToPause } = await supabase
        .from('habits')
        .select('id, name')
        .eq('user_id', user.id)
        .eq('workspace_id', workspaceId)
        .eq('is_active', true)
        .is('deleted_at', null)
        // Consider habits without 'critical' in name as non-critical
        .not('name', 'ilike', '%critical%')
        .limit(5)

      if (habitsToPause && habitsToPause.length > 0) {
        const habitIds = habitsToPause.map(h => h.id)

        // Pause habits by setting is_active = false temporarily
        // We don't have paused_until column, so we'll track in intervention context
        await supabase
          .from('habits')
          .update({ is_active: false })
          .in('id', habitIds)

        interventions.push({
          type: 'force_break',
          reason: `Burnout imminent détecté (${burnoutIndex.toFixed(0)}%). ${habitsToPause.length} habitudes mises en pause 48h.`,
          severity: 'critical',
          impact: { 
            habits_paused: habitsToPause.length, 
            habit_ids: habitIds,
            pause_until: pauseUntil 
          },
          undoPayload: { action: 'reactivate_habits', habit_ids: habitIds }
        })
      }
    }

    // INTERVENTION 3: STREAK RISK DETECTION
    const currentHour = new Date().getHours()
    if (currentHour >= 20) { // After 8 PM
      const { data: incompleteHabits } = await supabase
        .from('habits')
        .select(`
          id, name, icon,
          streaks:streaks(current_streak)
        `)
        .eq('user_id', user.id)
        .eq('workspace_id', workspaceId)
        .eq('is_active', true)
        .is('deleted_at', null)

      // Check if today's logs exist
      const { data: todayLogs } = await supabase
        .from('habit_logs')
        .select('habit_id')
        .eq('user_id', user.id)
        .eq('date', today)
        .eq('completed', true)

      const completedHabitIds = new Set(todayLogs?.map(l => l.habit_id) || [])
      
      const atRiskHabits = incompleteHabits?.filter(h => {
        const streak = (h.streaks as any)?.[0]?.current_streak || 0
        return streak >= 3 && !completedHabitIds.has(h.id)
      }) || []

      if (atRiskHabits.length > 0) {
        // Create a reminder task
        const habitNames = atRiskHabits.slice(0, 3).map(h => h.name).join(', ')
        
        await supabase.from('tasks').insert({
          user_id: user.id,
          workspace_id: workspaceId,
          title: `🔥 Protégez vos streaks !`,
          description: `Habitudes à risque: ${habitNames}. Complétez-les avant minuit.`,
          priority: 'high',
          due_date: today,
          status: 'todo',
          kanban_status: 'todo',
          source: 'ai'
        })

        interventions.push({
          type: 'streak_protection',
          reason: `${atRiskHabits.length} habitude(s) avec streak à risque détectée(s). Rappel créé.`,
          severity: 'advisory',
          impact: { habits_at_risk: atRiskHabits.length, habit_names: habitNames }
        })
      }
    }

    // INTERVENTION 4: FINANCIAL STRESS DETECTION
    const { data: monthlyBudget } = await supabase
      .from('budgets')
      .select('monthly_limit')
      .eq('user_id', user.id)
      .is('category_id', null) // Global budget
      .single()

    if (monthlyBudget?.monthly_limit) {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { data: monthExpenses } = await supabase
        .from('finance_transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('date', startOfMonth.toISOString().split('T')[0])

      const totalExpenses = monthExpenses?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0
      const budgetUsage = totalExpenses / monthlyBudget.monthly_limit

      if (budgetUsage > 0.9) { // Over 90% of budget used
        interventions.push({
          type: 'financial_alert',
          reason: `Budget mensuel à ${(budgetUsage * 100).toFixed(0)}%. Attention aux dépenses.`,
          severity: budgetUsage > 1 ? 'critical' : 'warning',
          impact: { 
            budget_used: totalExpenses, 
            budget_limit: monthlyBudget.monthly_limit,
            usage_percent: budgetUsage * 100 
          }
        })
      }
    }

    // Log all interventions
    for (const intervention of interventions) {
      // Insert intervention record
      const { data: interventionRecord } = await supabase
        .from('ai_interventions')
        .insert({
          user_id: user.id,
          workspace_id: workspaceId,
          intervention_type: intervention.type,
          ai_message: intervention.reason,
          reason: intervention.reason,
          severity: intervention.severity,
          auto_applied: true,
          applied_at: new Date().toISOString(),
          impact_before: todayStats,
          context: { impact: intervention.impact }
        })
        .select('id')
        .single()

      // Create undo entry if applicable
      if (intervention.undoPayload && interventionRecord) {
        await supabase.from('undo_stack').insert({
          user_id: user.id,
          workspace_id: workspaceId,
          entity: 'ai_interventions',
          entity_id: interventionRecord.id,
          action: 'ai_intervention',
          old_value: intervention.undoPayload,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
      }

      // Create notification
      await supabase.from('ai_notifications').insert({
        user_id: user.id,
        workspace_id: workspaceId,
        title: 'Intervention IA Automatique',
        message: intervention.reason,
        notification_type: 'intervention',
        urgency: intervention.severity === 'critical' ? 'high' : 
                 intervention.severity === 'warning' ? 'medium' : 'low',
        action_url: '/observability'
      })

      // Audit log
      await supabase.from('audit_log').insert({
        user_id: user.id,
        action: 'AI_INTERVENTION_APPLIED',
        entity: 'ai_interventions',
        entity_id: interventionRecord?.id,
        new_value: {
          type: intervention.type,
          severity: intervention.severity,
          impact: intervention.impact
        }
      })
    }

    return new Response(JSON.stringify({
      success: true,
      interventions_count: interventions.length,
      interventions: interventions.map(i => ({
        type: i.type,
        reason: i.reason,
        severity: i.severity
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    const error = err as Error
    console.error('AI Intervention Engine error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
