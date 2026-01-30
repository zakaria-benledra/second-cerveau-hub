import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * UNDO ACTION
 * 
 * Reverses AI-executed actions using the undo_stack.
 * This is critical for the PROPOSE → APPROVE → EXECUTE → AUDIT → UNDO cycle.
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

    const { user_id, action_id, undo_id }: UndoRequest = await req.json();

    if (!user_id || (!action_id && !undo_id)) {
      throw new Error("user_id and either action_id or undo_id are required");
    }

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

    const { data: undoRecords, error: undoError } = await query.order("created_at", { ascending: false }).limit(1);

    if (undoError) throw undoError;
    if (!undoRecords || undoRecords.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No undoable action found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const undoRecord = undoRecords[0];

    // Perform the undo based on operation type
    let undoResult;
    switch (undoRecord.operation) {
      case "create":
        // Delete the created entity
        undoResult = await supabase
          .from(undoRecord.entity)
          .delete()
          .eq("id", undoRecord.entity_id)
          .eq("user_id", user_id);
        break;

      case "update":
        // Restore to previous state
        if (undoRecord.previous_state) {
          const { id, created_at, ...restoreData } = undoRecord.previous_state;
          undoResult = await supabase
            .from(undoRecord.entity)
            .update(restoreData)
            .eq("id", undoRecord.entity_id)
            .eq("user_id", user_id);
        }
        break;

      case "delete":
        // Re-insert the deleted entity
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
