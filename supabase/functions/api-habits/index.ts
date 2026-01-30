import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getRequiredWorkspaceId } from '../_shared/workspace.ts'
import { generateIdempotencyKey, isEventProcessed } from '../_shared/idempotency.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============= VALIDATION =============

function isUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

function isString(value: unknown, minLength = 0, maxLength = 10000): value is string {
  return typeof value === 'string' && value.length >= minLength && value.length <= maxLength;
}

function isDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
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
    const habitId = url.searchParams.get('id')
    const action = url.searchParams.get('action')

    // POST - Create habit
    if (req.method === 'POST' && !action) {
      const body = await req.json()
      
      // ========== STRONG VALIDATION ==========
      if (!isString(body.name, 1, 255)) {
        return new Response(JSON.stringify({ 
          error: 'Validation failed',
          details: 'name must be a string between 1-255 characters' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          workspace_id: workspaceId, // MULTI-TENANT
          name: body.name,
          description: isString(body.description) ? body.description : null,
          target_frequency: isString(body.target_frequency) ? body.target_frequency : 'daily',
          icon: isString(body.icon, 0, 10) ? body.icon : null,
          color: isString(body.color, 0, 50) ? body.color : null,
          source: 'api',
        })
        .select()
        .single()

      if (error) throw error

      // Create streak record with workspace_id
      await supabase.from('streaks').insert({
        user_id: user.id,
        workspace_id: workspaceId, // MULTI-TENANT
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
    if (req.method === 'POST' && action === 'log') {
      // ========== STRONG VALIDATION ==========
      if (!isUUID(habitId)) {
        return new Response(JSON.stringify({ 
          error: 'Validation failed',
          details: 'habitId (id query param) must be a valid UUID' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const body = await req.json()
      const date = isDate(body.date) ? body.date : new Date().toISOString().split('T')[0]

      // ========== HASH-BASED IDEMPOTENCY (not time-bucket) ==========
      const eventId = await generateIdempotencyKey(
        'habits',
        habitId,
        `log_${date}`,
        user.id,
        workspaceId,
        { date }
      )
      
      // Check if log exists for this habit+date (idempotent toggle)
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
        // Create new log with workspace_id
        const { data, error } = await supabase
          .from('habit_logs')
          .insert({
            user_id: user.id,
            workspace_id: workspaceId, // MULTI-TENANT
            habit_id: habitId,
            date,
            completed: true,
            source: 'api',
          })
          .select()
          .single()
        if (error) throw error
        logData = data
      }

      // Update streak if completed
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

      // Write to system_events for automation triggers
      await supabase.from('system_events').insert({
        user_id: user.id,
        workspace_id: workspaceId, // MULTI-TENANT
        event_type: logData.completed ? 'habit.completed' : 'habit.unchecked',
        entity: 'habits',
        entity_id: habitId,
        payload: { date, completed: logData.completed, event_id: eventId },
        source: 'api',
      })

      // Write to undo_stack for reversibility
      const undoEventId = await generateIdempotencyKey(
        'undo',
        habitId,
        `habit_log_${date}`,
        user.id,
        workspaceId,
        { completed: logData.completed }
      )

      // Check for duplicate undo entry
      const undoExists = await isEventProcessed(supabase, 'undo_stack', undoEventId)
      if (!undoExists) {
        await supabase.from('undo_stack').insert({
          user_id: user.id,
          workspace_id: workspaceId, // MULTI-TENANT
          event_id: undoEventId, // IDEMPOTENCY
          entity: 'habit_logs',
          entity_id: logData.id,
          operation: logData.completed ? 'complete' : 'uncomplete',
          previous_state: existingLog ? { completed: existingLog.completed } : null,
          current_state: { completed: logData.completed },
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
      }

      return new Response(JSON.stringify(logData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // DELETE - Delete habit
    if (req.method === 'DELETE') {
      if (!isUUID(habitId)) {
        return new Response(JSON.stringify({ 
          error: 'Validation failed',
          details: 'habitId (id query param) must be a valid UUID' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

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
