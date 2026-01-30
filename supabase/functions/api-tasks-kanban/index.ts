import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getRequiredWorkspaceId } from '../_shared/workspace.ts'
import { generateIdempotencyKey, isEventProcessed } from '../_shared/idempotency.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============= VALIDATION (inline for edge function) =============

const KANBAN_STATUS = ['backlog', 'todo', 'doing', 'done'] as const;
type KanbanStatus = typeof KANBAN_STATUS[number];

function isUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

function isValidStatus(status: unknown): status is KanbanStatus {
  return typeof status === 'string' && KANBAN_STATUS.includes(status as KanbanStatus);
}

// ============= MAIN HANDLER =============

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

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

    // ========== MULTI-TENANT: Get required workspace_id (never null) ==========
    const workspaceId = await getRequiredWorkspaceId(supabase, user.id)

    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    // GET - Fetch tasks grouped by kanban status
    if (req.method === 'GET') {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true })

      if (error) throw error

      const columns = {
        backlog: tasks?.filter(t => t.kanban_status === 'backlog' || !t.kanban_status) || [],
        todo: tasks?.filter(t => t.kanban_status === 'todo') || [],
        doing: tasks?.filter(t => t.kanban_status === 'doing') || [],
        done: tasks?.filter(t => t.kanban_status === 'done') || []
      }

      return new Response(JSON.stringify({ columns }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST - Move task to new column/position
    if (req.method === 'POST' && action === 'move') {
      const body = await req.json()
      
      // ========== STRONG VALIDATION ==========
      const { taskId, newStatus, newSortOrder, previousTaskId } = body

      if (!isUUID(taskId)) {
        return new Response(JSON.stringify({ 
          error: 'Validation failed', 
          details: 'taskId must be a valid UUID' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (!isValidStatus(newStatus)) {
        return new Response(JSON.stringify({ 
          error: 'Validation failed', 
          details: `newStatus must be one of: ${KANBAN_STATUS.join(', ')}` 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // ========== IDEMPOTENCY CHECK (hash-based via _shared) ==========
      const eventId = await generateIdempotencyKey(
        'tasks',
        taskId,
        `move_${newStatus}`,
        user.id,
        workspaceId,
        { from: body.previousTaskId, to: newStatus, sortOrder: newSortOrder }
      )
      
      // Check if this exact event already processed
      const alreadyProcessed = await isEventProcessed(supabase, 'task_events', eventId)

      if (alreadyProcessed) {
        // Return success but skip duplicate processing
        console.log(`Idempotent skip: ${eventId}`)
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Event already processed (idempotent)',
          event_id: eventId 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Get old task for audit (with user_id check for security)
      const { data: oldTask } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .eq('user_id', user.id)
        .single()

      if (!oldTask) {
        return new Response(JSON.stringify({ error: 'Task not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Calculate new sort order
      let sortOrder = newSortOrder
      if (sortOrder === undefined && previousTaskId) {
        const { data: prevTask } = await supabase
          .from('tasks')
          .select('sort_order')
          .eq('id', previousTaskId)
          .single()
        sortOrder = (prevTask?.sort_order || 0) + 1
      } else if (sortOrder === undefined) {
        const { data: maxTask } = await supabase
          .from('tasks')
          .select('sort_order')
          .eq('user_id', user.id)
          .eq('kanban_status', newStatus)
          .order('sort_order', { ascending: false })
          .limit(1)
          .single()
        sortOrder = (maxTask?.sort_order || 0) + 1
      }

      // Update task
      const updates: Record<string, unknown> = {
        kanban_status: newStatus,
        sort_order: sortOrder,
        updated_at: new Date().toISOString()
      }

      // Auto-complete when moving to done
      if (newStatus === 'done' && oldTask.status !== 'done') {
        updates.status = 'done'
        updates.completed_at = new Date().toISOString()
      } else if (newStatus !== 'done' && oldTask.status === 'done') {
        updates.status = 'in_progress'
        updates.completed_at = null
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      // ========== MULTI-TENANT INSERTS (user_id + workspace_id) ==========

      // Log to audit_log
      await supabase.from('audit_log').insert({
        user_id: user.id,
        action: 'KANBAN_MOVE',
        entity: 'tasks',
        entity_id: taskId,
        old_value: { kanban_status: oldTask.kanban_status, sort_order: oldTask.sort_order },
        new_value: { kanban_status: newStatus, sort_order: sortOrder }
      })

      // Write to task_events with event_id for idempotency
      await supabase.from('task_events').insert({
        user_id: user.id,
        workspace_id: workspaceId, // MULTI-TENANT
        task_id: taskId,
        event_id: eventId, // IDEMPOTENCY (hash-based)
        event_type: newStatus === 'done' ? 'completed' : 'status_changed',
        payload: { 
          from_status: oldTask.kanban_status, 
          to_status: newStatus,
          from_sort: oldTask.sort_order,
          to_sort: sortOrder
        }
      })

      // Write to undo_stack with hash-based event_id for idempotency
      const undoEventId = await generateIdempotencyKey(
        'undo',
        taskId,
        `kanban_${newStatus}`,
        user.id,
        workspaceId,
        { from: oldTask.kanban_status, to: newStatus }
      )

      // Check if undo entry already exists
      const undoExists = await isEventProcessed(supabase, 'undo_stack', undoEventId)
      if (!undoExists) {
        await supabase.from('undo_stack').insert({
          user_id: user.id,
          workspace_id: workspaceId, // MULTI-TENANT
          event_id: undoEventId, // IDEMPOTENCY
          action_id: crypto.randomUUID(),
          entity: 'tasks',
          entity_id: taskId,
          operation: 'KANBAN_MOVE',
          previous_state: { kanban_status: oldTask.kanban_status, sort_order: oldTask.sort_order, status: oldTask.status },
          current_state: { kanban_status: newStatus, sort_order: sortOrder, status: updates.status || oldTask.status },
          revert_payload: { taskId, newStatus: oldTask.kanban_status, newSortOrder: oldTask.sort_order },
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
      }

      return new Response(JSON.stringify({ 
        success: true, 
        task: data,
        event_id: eventId 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST - Reorder tasks within column
    if (req.method === 'POST' && action === 'reorder') {
      const body = await req.json()
      const { taskIds, status } = body

      if (!taskIds || !Array.isArray(taskIds)) {
        return new Response(JSON.stringify({ 
          error: 'Validation failed',
          details: 'taskIds must be an array of UUIDs' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Validate all taskIds
      for (const id of taskIds) {
        if (!isUUID(id)) {
          return new Response(JSON.stringify({ 
            error: 'Validation failed',
            details: `Invalid UUID in taskIds: ${id}` 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      }

      if (status && !isValidStatus(status)) {
        return new Response(JSON.stringify({ 
          error: 'Validation failed',
          details: `status must be one of: ${KANBAN_STATUS.join(', ')}` 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Update sort orders
      for (let i = 0; i < taskIds.length; i++) {
        await supabase
          .from('tasks')
          .update({ sort_order: i, kanban_status: status })
          .eq('id', taskIds[i])
          .eq('user_id', user.id)
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    const error = err as Error
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
