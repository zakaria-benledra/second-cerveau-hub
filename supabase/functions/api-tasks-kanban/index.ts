import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

      // Group by status
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
      const { taskId, newStatus, newSortOrder, previousTaskId } = body

      if (!taskId || !newStatus) {
        return new Response(JSON.stringify({ error: 'taskId and newStatus required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Validate status
      const validStatuses = ['backlog', 'todo', 'doing', 'done']
      if (!validStatuses.includes(newStatus)) {
        return new Response(JSON.stringify({ error: 'Invalid status' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Get old task for audit
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
        // Get max sort order in target column
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

      // Log to audit
      await supabase.from('audit_log').insert({
        user_id: user.id,
        action: 'KANBAN_MOVE',
        entity: 'tasks',
        entity_id: taskId,
        old_value: { kanban_status: oldTask.kanban_status, sort_order: oldTask.sort_order },
        new_value: { kanban_status: newStatus, sort_order: sortOrder }
      })

      return new Response(JSON.stringify({ success: true, task: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST - Reorder tasks within column
    if (req.method === 'POST' && action === 'reorder') {
      const body = await req.json()
      const { taskIds, status } = body

      if (!taskIds || !Array.isArray(taskIds)) {
        return new Response(JSON.stringify({ error: 'taskIds array required' }), {
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
