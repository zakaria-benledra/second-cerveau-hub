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

    // Get auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const url = new URL(req.url)
    const taskId = url.searchParams.get('id')

    // POST - Create task
    if (req.method === 'POST') {
      const body = await req.json()
      
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: body.title,
          description: body.description,
          priority: body.priority || 'medium',
          due_date: body.due_date,
          start_date: body.start_date,
          estimate_min: body.estimate_min,
          energy_level: body.energy_level,
          project_id: body.project_id,
          goal_id: body.goal_id,
        })
        .select()
        .single()

      if (error) throw error

      // Log to audit
      await supabase.from('audit_log').insert({
        user_id: user.id,
        action: 'CREATE',
        entity: 'tasks',
        entity_id: data.id,
        new_value: data,
      })

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // PATCH - Update task
    if (req.method === 'PATCH' && taskId) {
      const body = await req.json()
      
      // Get old value for audit
      const { data: oldTask } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .eq('user_id', user.id)
        .single()

      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...body,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      // Log to audit
      await supabase.from('audit_log').insert({
        user_id: user.id,
        action: 'UPDATE',
        entity: 'tasks',
        entity_id: taskId,
        old_value: oldTask,
        new_value: data,
      })

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // DELETE - Delete task
    if (req.method === 'DELETE' && taskId) {
      // Get old value for audit
      const { data: oldTask } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .eq('user_id', user.id)
        .single()

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id)

      if (error) throw error

      // Log to audit
      await supabase.from('audit_log').insert({
        user_id: user.id,
        action: 'DELETE',
        entity: 'tasks',
        entity_id: taskId,
        old_value: oldTask,
      })

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
