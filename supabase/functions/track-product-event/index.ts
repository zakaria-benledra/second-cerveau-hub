import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { generateIdempotencyKey } from '../_shared/idempotency.ts'
import { getWorkspaceContext } from '../_shared/workspace.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProductEvent {
  event_type: string
  entity?: string
  entity_id?: string
  payload?: Record<string, unknown>
}

const VALID_EVENT_TYPES = [
  'signup',
  'activation',
  'login',
  'habit_created',
  'habit_completed',
  'habit_streak_locked',
  'task_created',
  'task_completed',
  'finance_imported',
  'finance_transaction_added',
  'ai_action_proposed',
  'ai_action_accepted',
  'ai_action_rejected',
  'ai_intervention_accepted',
  'ai_intervention_rejected',
  'ai_intervention_reverted',
  'goal_created',
  'goal_completed',
  'focus_session_completed',
  'journal_entry_created',
  'feature_used',
  'page_view',
  'churn_risk_detected',
  'retention_signal',
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
    // Auth
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

    // Get workspace context
    const workspaceContext = await getWorkspaceContext(supabase, user.id)
    if (!workspaceContext.workspaceId) {
      return new Response(JSON.stringify({ error: 'No workspace found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body: ProductEvent = await req.json()
    const { event_type, entity, entity_id, payload = {} } = body

    // Validate event type
    if (!event_type || !VALID_EVENT_TYPES.includes(event_type)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid event_type', 
        valid_types: VALID_EVENT_TYPES 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Generate idempotency key
    const eventId = await generateIdempotencyKey(
      'user_journey',
      entity_id || user.id,
      event_type,
      user.id,
      workspaceContext.workspaceId,
      payload
    )

    // Check for duplicate
    const { data: existing } = await supabase
      .from('user_journey_events')
      .select('id')
      .eq('event_id', eventId)
      .maybeSingle()

    if (existing) {
      return new Response(JSON.stringify({ 
        success: true, 
        duplicate: true,
        event_id: eventId 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Insert event
    const { data: event, error: insertError } = await supabase
      .from('user_journey_events')
      .insert({
        user_id: user.id,
        workspace_id: workspaceContext.workspaceId,
        event_type,
        entity,
        entity_id,
        payload,
        event_id: eventId,
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Update churn risk signals on certain events
    if (['habit_completed', 'task_completed', 'ai_action_accepted', 'finance_transaction_added'].includes(event_type)) {
      await supabase
        .from('churn_risk_scores')
        .upsert({
          user_id: user.id,
          workspace_id: workspaceContext.workspaceId,
          last_activity_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
    }

    return new Response(JSON.stringify({ 
      success: true, 
      event_id: eventId,
      id: event.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    const error = err as Error
    console.error('Error tracking product event:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
