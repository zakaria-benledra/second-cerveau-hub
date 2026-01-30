import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getRequiredWorkspaceId } from '../_shared/workspace.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Apply AI Intervention - Execute real actions based on intervention type
 * 
 * Supported actions:
 * - overload: Postpone low-priority tasks
 * - restructure: Move WIP tasks back to todo
 * - habit_fatigue: Create minimal habit reminder
 * - relapse_risk: Create commitment marker
 */

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

    const workspaceId = await getRequiredWorkspaceId(supabase, user.id)
    const { interventionId } = await req.json()

    if (!interventionId) {
      return new Response(JSON.stringify({ error: 'interventionId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get the intervention
    const { data: intervention, error: fetchError } = await supabase
      .from('ai_interventions')
      .select('*')
      .eq('id', interventionId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !intervention) {
      return new Response(JSON.stringify({ error: 'Intervention not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const context = intervention.context as Record<string, any> || {}
    const actionResults: any[] = []
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Execute action based on intervention type
    switch (intervention.intervention_type) {
      case 'warning':
      case 'restructure': {
        // Move low-priority tasks from 'doing' back to 'todo' to reduce WIP
        const { data: wipTasks, error: wipError } = await supabase
          .from('tasks')
          .select('id, title')
          .eq('user_id', user.id)
          .eq('kanban_status', 'doing')
          .in('priority', ['low', 'medium'])
          .limit(3)

        if (!wipError && wipTasks?.length > 0) {
          const taskIds = wipTasks.map(t => t.id)
          await supabase
            .from('tasks')
            .update({ kanban_status: 'todo' })
            .in('id', taskIds)

          // Record task events
          for (const task of wipTasks) {
            await supabase.from('task_events').insert({
              task_id: task.id,
              user_id: user.id,
              workspace_id: workspaceId,
              event_type: 'status_changed',
              payload: { old_status: 'doing', new_status: 'todo', reason: 'ai_intervention' }
            })
          }

          actionResults.push({
            action: 'tasks_moved_to_todo',
            count: wipTasks.length,
            tasks: wipTasks.map(t => t.title)
          })
        }
        break
      }

      case 'motivation': {
        // Postpone non-urgent tasks to tomorrow
        const { data: todayTasks, error: taskError } = await supabase
          .from('tasks')
          .select('id, title')
          .eq('user_id', user.id)
          .eq('due_date', today)
          .neq('priority', 'urgent')
          .neq('priority', 'high')
          .neq('status', 'done')
          .limit(3)

        if (!taskError && todayTasks?.length > 0) {
          const taskIds = todayTasks.map(t => t.id)
          await supabase
            .from('tasks')
            .update({ due_date: tomorrow })
            .in('id', taskIds)

          actionResults.push({
            action: 'tasks_postponed',
            count: todayTasks.length,
            tasks: todayTasks.map(t => t.title)
          })
        }
        break
      }

      case 'challenge': {
        // Create a micro-commitment for today
        const { data: newTask, error: createError } = await supabase
          .from('tasks')
          .insert({
            user_id: user.id,
            workspace_id: workspaceId,
            title: '🎯 Micro-défi du jour',
            description: 'Complète une seule action concrète pour reprendre le momentum.',
            priority: 'high',
            due_date: today,
            status: 'todo',
            kanban_status: 'todo',
            source: 'ai'
          })
          .select()
          .single()

        if (!createError && newTask) {
          actionResults.push({
            action: 'micro_challenge_created',
            task: newTask.title
          })
        }
        break
      }

      case 'praise': {
        // Record the positive moment as a behavior signal
        await supabase.from('behavior_signals').insert({
          user_id: user.id,
          workspace_id: workspaceId,
          signal_type: 'momentum',
          score: 0.8,
          source: 'ai_praise',
          metadata: { intervention_id: interventionId }
        })

        actionResults.push({
          action: 'momentum_signal_recorded',
          type: 'positive'
        })
        break
      }

      default: {
        // Generic acknowledgment - just log the action
        await supabase.from('behavior_signals').insert({
          user_id: user.id,
          workspace_id: workspaceId,
          signal_type: 'acknowledgment',
          score: 0.5,
          source: 'ai_intervention',
          metadata: { intervention_id: interventionId, type: intervention.intervention_type }
        })

        actionResults.push({
          action: 'intervention_acknowledged',
          type: intervention.intervention_type
        })
      }
    }

    // Update intervention status
    await supabase
      .from('ai_interventions')
      .update({ 
        user_action: 'accepted',
        responded_at: new Date().toISOString(),
        context: { ...context, applied_actions: actionResults }
      })
      .eq('id', interventionId)

    // Record in audit log
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'AI_INTERVENTION_APPLIED',
      entity: 'ai_interventions',
      entity_id: interventionId,
      new_value: { results: actionResults }
    })

    // Track as product event
    await supabase.from('user_journey_events').insert({
      user_id: user.id,
      workspace_id: workspaceId,
      event_type: 'ai_intervention_applied',
      entity: 'ai_interventions',
      entity_id: interventionId,
      metadata: { 
        intervention_type: intervention.intervention_type,
        actions_count: actionResults.length,
        actions: actionResults
      }
    })

    return new Response(JSON.stringify({
      success: true,
      message: 'Intervention appliquée avec succès',
      actions: actionResults
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    const error = err as Error
    console.error('Apply intervention error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})