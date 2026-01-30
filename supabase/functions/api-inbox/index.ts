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
    const inboxId = url.searchParams.get('id')
    const action = url.searchParams.get('action')

    // POST - Create inbox item (capture)
    if (req.method === 'POST' && !action) {
      const body = await req.json()
      
      const { data, error } = await supabase
        .from('inbox_items')
        .insert({
          user_id: user.id,
          title: body.title,
          content: body.content,
          source: body.source || 'capture',
        })
        .select()
        .single()

      if (error) throw error

      await supabase.from('audit_log').insert({
        user_id: user.id,
        action: 'CREATE',
        entity: 'inbox_items',
        entity_id: data.id,
        new_value: data,
      })

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST - Convert to task
    if (req.method === 'POST' && action === 'convert' && inboxId) {
      // Get inbox item
      const { data: inboxItem, error: fetchError } = await supabase
        .from('inbox_items')
        .select('*')
        .eq('id', inboxId)
        .eq('user_id', user.id)
        .single()

      if (fetchError) throw fetchError

      // Create task
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: inboxItem.title,
          description: inboxItem.content,
          priority: 'medium',
        })
        .select()
        .single()

      if (taskError) throw taskError

      // Update inbox item
      const { error: updateError } = await supabase
        .from('inbox_items')
        .update({
          status: 'processed',
          converted_task_id: task.id,
        })
        .eq('id', inboxId)

      if (updateError) throw updateError

      await supabase.from('audit_log').insert({
        user_id: user.id,
        action: 'CONVERT',
        entity: 'inbox_items',
        entity_id: inboxId,
        new_value: { task_id: task.id },
      })

      return new Response(JSON.stringify({ success: true, task }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // PATCH - Archive inbox item
    if (req.method === 'PATCH' && action === 'archive' && inboxId) {
      const { error } = await supabase
        .from('inbox_items')
        .update({ status: 'archived' })
        .eq('id', inboxId)
        .eq('user_id', user.id)

      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // DELETE - Delete inbox item
    if (req.method === 'DELETE' && inboxId) {
      const { error } = await supabase
        .from('inbox_items')
        .delete()
        .eq('id', inboxId)
        .eq('user_id', user.id)

      if (error) throw error

      await supabase.from('audit_log').insert({
        user_id: user.id,
        action: 'DELETE',
        entity: 'inbox_items',
        entity_id: inboxId,
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
