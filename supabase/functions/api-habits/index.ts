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
    const habitId = url.searchParams.get('id')
    const action = url.searchParams.get('action')

    // POST - Create habit
    if (req.method === 'POST' && !action) {
      const body = await req.json()
      
      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          name: body.name,
          description: body.description,
          target_frequency: body.target_frequency || 'daily',
          icon: body.icon,
          color: body.color,
        })
        .select()
        .single()

      if (error) throw error

      // Create streak record
      await supabase.from('streaks').insert({
        user_id: user.id,
        habit_id: data.id,
        current_streak: 0,
        max_streak: 0,
      })

      await supabase.from('audit_log').insert({
        user_id: user.id,
        action: 'CREATE',
        entity: 'habits',
        entity_id: data.id,
        new_value: data,
      })

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST - Log habit completion
    if (req.method === 'POST' && action === 'log' && habitId) {
      const body = await req.json()
      const date = body.date || new Date().toISOString().split('T')[0]
      
      // Check if log exists
      const { data: existingLog } = await supabase
        .from('habit_logs')
        .select('id, completed')
        .eq('habit_id', habitId)
        .eq('date', date)
        .eq('user_id', user.id)
        .maybeSingle()

      let logData
      if (existingLog) {
        // Toggle completion
        const { data, error } = await supabase
          .from('habit_logs')
          .update({ completed: !existingLog.completed })
          .eq('id', existingLog.id)
          .select()
          .single()
        if (error) throw error
        logData = data
      } else {
        // Create new log
        const { data, error } = await supabase
          .from('habit_logs')
          .insert({
            user_id: user.id,
            habit_id: habitId,
            date,
            completed: true,
          })
          .select()
          .single()
        if (error) throw error
        logData = data
      }

      // Update streak
      if (logData.completed) {
        const { data: streak } = await supabase
          .from('streaks')
          .select('*')
          .eq('habit_id', habitId)
          .eq('user_id', user.id)
          .single()

        if (streak) {
          const lastCompleted = streak.last_completed_date
          const today = new Date().toISOString().split('T')[0]
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
          
          let newStreak = 1
          if (lastCompleted === yesterday) {
            newStreak = streak.current_streak + 1
          } else if (lastCompleted === today) {
            newStreak = streak.current_streak
          }

          await supabase
            .from('streaks')
            .update({
              current_streak: newStreak,
              max_streak: Math.max(newStreak, streak.max_streak),
              last_completed_date: date,
            })
            .eq('id', streak.id)
        }
      }

      return new Response(JSON.stringify(logData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // DELETE - Delete habit
    if (req.method === 'DELETE' && habitId) {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId)
        .eq('user_id', user.id)

      if (error) throw error

      await supabase.from('audit_log').insert({
        user_id: user.id,
        action: 'DELETE',
        entity: 'habits',
        entity_id: habitId,
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
