import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============= VALIDATION =============

function isUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

function isDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function generateEventId(entity: string, entityId: string, eventType: string): string {
  const bucket = Math.floor(Date.now() / 1000);
  return `${entity}_${entityId}_${eventType}_${bucket}`;
}

async function getUserWorkspaceId(supabase: any, userId: string): Promise<string | null> {
  const { data: membership } = await supabase
    .from('memberships')
    .select('workspace_id')
    .eq('user_id', userId)
    .limit(1)
    .single();
  return membership?.workspace_id || null;
}

/**
 * UNDO ACTION
 * 
 * Reverses AI-executed actions using the undo_stack.
 * Supports: KANBAN_MOVE, create, update, delete operations
 */

interface UndoRequest {
  user_id: string;
  action_id?: string;
  undo_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    
    // ========== STRONG VALIDATION ==========
    if (!isUUID(body.user_id)) {
      return new Response(
        JSON.stringify({ success: false, error: "user_id must be a valid UUID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.action_id && !body.undo_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Either action_id or undo_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (body.action_id && !isUUID(body.action_id)) {
      return new Response(
        JSON.stringify({ success: false, error: "action_id must be a valid UUID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (body.undo_id && !isUUID(body.undo_id)) {
      return new Response(
        JSON.stringify({ success: false, error: "undo_id must be a valid UUID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { user_id, action_id, undo_id }: UndoRequest = body;

    // Get user's workspace_id
    const workspaceId = await getUserWorkspaceId(supabase, user_id);

    // Find the undo record
    let query = supabase
      .from("undo_stack")
      .select("*")
      .eq("user_id", user_id)
      .eq("is_undone", false);

    if (undo_id) {
      query = query.eq("id", undo_id);
    } else if (action_id) {
      query = query.eq("action_id", action_id);
    }

    const { data: undoRecords, error: undoError } = await query
      .order("created_at", { ascending: false })
      .limit(1);

    if (undoError) throw undoError;
    if (!undoRecords || undoRecords.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No undoable action found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const undoRecord = undoRecords[0];

    // ========== IDEMPOTENCY CHECK ==========
    const eventId = generateEventId('undo', undoRecord.id, 'revert');
    const { data: existingEvent } = await supabase
      .from('task_events')
      .select('id')
      .eq('event_id', eventId)
      .single();

    if (existingEvent) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Undo already processed (idempotent)",
          event_id: eventId 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Perform the undo based on operation type
    let undoResult;
    switch (undoRecord.operation) {
      case "create":
        undoResult = await supabase
          .from(undoRecord.entity)
          .delete()
          .eq("id", undoRecord.entity_id)
          .eq("user_id", user_id);
        break;

      case "update":
      case "KANBAN_MOVE":
        if (undoRecord.previous_state) {
          const { id, created_at, user_id: _, workspace_id: __, ...restoreData } = undoRecord.previous_state;
          undoResult = await supabase
            .from(undoRecord.entity)
            .update(restoreData)
            .eq("id", undoRecord.entity_id)
            .eq("user_id", user_id);
        }
        break;

      case "delete":
        if (undoRecord.previous_state) {
          const { id, ...insertData } = undoRecord.previous_state;
          undoResult = await supabase
            .from(undoRecord.entity)
            .insert({ id: undoRecord.entity_id, ...insertData });
        }
        break;

      default:
        throw new Error(`Unknown operation: ${undoRecord.operation}`);
    }

    if (undoResult?.error) {
      throw undoResult.error;
    }

    // Mark the undo record as undone
    await supabase
      .from("undo_stack")
      .update({
        is_undone: true,
        undone_at: new Date().toISOString(),
      })
      .eq("id", undoRecord.id);

    // Update the original action status if it exists
    if (undoRecord.action_id) {
      await supabase
        .from("agent_actions")
        .update({
          status: "reverted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", undoRecord.action_id);
    }

    // Log revert event to task_events (with idempotency)
    if (undoRecord.entity === 'tasks') {
      await supabase.from("task_events").insert({
        user_id,
        workspace_id: workspaceId, // MULTI-TENANT
        task_id: undoRecord.entity_id,
        event_id: eventId, // IDEMPOTENCY
        event_type: 'reverted',
        payload: {
          undo_id: undoRecord.id,
          restored_state: undoRecord.previous_state
        }
      });
    }

    // Log to audit
    await supabase.from("audit_log").insert({
      user_id,
      action: "undo",
      entity: undoRecord.entity,
      entity_id: undoRecord.entity_id,
      old_value: undoRecord.current_state,
      new_value: undoRecord.previous_state,
    });

    // Emit undo event
    await supabase.from("system_events").insert({
      user_id,
      workspace_id: workspaceId, // MULTI-TENANT
      event_type: "action.undone",
      entity: undoRecord.entity,
      entity_id: undoRecord.entity_id,
      payload: {
        undo_id: undoRecord.id,
        action_id: undoRecord.action_id,
        operation: undoRecord.operation,
      },
      source: "api",
    });

    return new Response(
      JSON.stringify({
        success: true,
        undo_id: undoRecord.id,
        entity: undoRecord.entity,
        entity_id: undoRecord.entity_id,
        operation: undoRecord.operation,
        event_id: eventId,
        message: `Successfully undone ${undoRecord.operation} on ${undoRecord.entity}`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Undo action error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
