import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * EVENT EMITTER
 * 
 * Centralized event emission for the automation engine.
 * Every state change in the system should call this to trigger automations.
 * 
 * Supported event types:
 * - task.created, task.completed, task.updated, task.deleted
 * - habit.completed, habit.missed, habit.streak_broken
 * - goal.achieved, goal.progress_updated
 * - budget.threshold_reached, budget.exceeded
 * - overload.detected
 * - inactivity.detected
 * - journal.created
 * - focus.completed
 */

interface EmitEventRequest {
  user_id: string;
  workspace_id?: string;
  event_type: string;
  entity?: string;
  entity_id?: string;
  payload?: Record<string, unknown>;
  source?: 'ui' | 'api' | 'automation' | 'ai' | 'cron';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: EmitEventRequest = await req.json();
    const { 
      user_id, 
      workspace_id, 
      event_type, 
      entity, 
      entity_id, 
      payload = {},
      source = 'api'
    } = body;

    if (!user_id || !event_type) {
      throw new Error("user_id and event_type are required");
    }

    // 1. Insert the system event
    const { data: event, error: eventError } = await supabase
      .from("system_events")
      .insert({
        user_id,
        workspace_id,
        event_type,
        entity,
        entity_id,
        payload,
        source,
        processed: false,
      })
      .select()
      .single();

    if (eventError) throw eventError;

    // 2. Find matching automation rules
    const { data: rules, error: rulesError } = await supabase
      .from("automation_rules")
      .select("*")
      .eq("user_id", user_id)
      .eq("trigger_event", event_type)
      .eq("is_active", true)
      .order("priority", { ascending: false });

    if (rulesError) throw rulesError;

    const executedRules = [];
    const failedRules = [];

    // 3. Execute each matching rule
    for (const rule of rules || []) {
      try {
        // Check trigger conditions
        const conditions = rule.trigger_conditions || {};
        let conditionsMet = true;
        
        for (const [key, value] of Object.entries(conditions)) {
          if (payload[key] !== value) {
            conditionsMet = false;
            break;
          }
        }

        if (!conditionsMet) continue;

        // Execute the action
        const actionResult = await executeAction(supabase, user_id, workspace_id, rule);

        // Log the automation event
        await supabase.from("automation_events").insert({
          user_id,
          workspace_id,
          rule_id: rule.id,
          event_type,
          entity,
          entity_id,
          payload,
          result: actionResult,
          status: actionResult.success ? "success" : "failed",
          processed_at: new Date().toISOString(),
        });

        // Update rule stats
        await supabase
          .from("automation_rules")
          .update({
            trigger_count: (rule.trigger_count || 0) + 1,
            last_triggered_at: new Date().toISOString(),
          })
          .eq("id", rule.id);

        if (actionResult.success) {
          executedRules.push({
            rule_id: rule.id,
            rule_name: rule.name,
            action_type: rule.action_type,
          });
        } else {
          failedRules.push({
            rule_id: rule.id,
            rule_name: rule.name,
            error: actionResult.error,
          });
        }
      } catch (ruleError) {
        const errorMessage = ruleError instanceof Error ? ruleError.message : "Unknown error";
        failedRules.push({
          rule_id: rule.id,
          rule_name: rule.name,
          error: errorMessage,
        });
      }
    }

    // 4. Mark event as processed
    await supabase
      .from("system_events")
      .update({ processed: true })
      .eq("id", event.id);

    return new Response(
      JSON.stringify({
        success: true,
        event_id: event.id,
        event_type,
        rules_matched: rules?.length || 0,
        rules_executed: executedRules.length,
        rules_failed: failedRules.length,
        executed: executedRules,
        failed: failedRules,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Emit event error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function executeAction(
  supabase: any,
  userId: string,
  workspaceId: string | undefined,
  rule: any
): Promise<{ success: boolean; result?: any; error?: string }> {
  const actionPayload = rule.action_payload || {};

  try {
    switch (rule.action_type) {
      case "create_task": {
        const { data, error } = await supabase
          .from("tasks")
          .insert({
            user_id: userId,
            workspace_id: workspaceId,
            title: actionPayload.title || "Tâche automatique",
            description: actionPayload.description,
            priority: actionPayload.priority || "medium",
            status: "todo",
            source: "automation",
          })
          .select()
          .single();
        if (error) throw error;
        return { success: true, result: { task_id: data.id } };
      }

      case "send_notification": {
        const { data, error } = await supabase
          .from("notifications")
          .insert({
            user_id: userId,
            workspace_id: workspaceId,
            type: actionPayload.type || "info",
            title: actionPayload.title || "Notification",
            message: actionPayload.message,
            source: "automation",
          })
          .select()
          .single();
        if (error) throw error;
        return { success: true, result: { notification_id: data.id } };
      }

      case "create_ai_proposal": {
        const { data, error } = await supabase
          .from("ai_proposals")
          .insert({
            user_id: userId,
            workspace_id: workspaceId,
            type: actionPayload.proposal_type || "suggestion",
            title: actionPayload.title || "Suggestion automatique",
            description: actionPayload.description,
            proposed_actions: actionPayload.actions || [],
            reasoning: actionPayload.reasoning || "Déclenché par règle d'automatisation",
            confidence_score: actionPayload.confidence || 0.7,
            priority: actionPayload.priority || "medium",
            status: "pending",
            source: "automation",
          })
          .select()
          .single();
        if (error) throw error;
        return { success: true, result: { proposal_id: data.id } };
      }

      case "update_streak": {
        // Reset or update streak for habit
        const { error } = await supabase
          .from("streaks")
          .upsert({
            user_id: userId,
            workspace_id: workspaceId,
            habit_id: actionPayload.habit_id,
            current_streak: actionPayload.reset ? 0 : (actionPayload.increment || 1),
            last_completed_date: new Date().toISOString().split("T")[0],
          }, { onConflict: "user_id,habit_id" });
        if (error) throw error;
        return { success: true, result: { updated: true } };
      }

      case "trigger_celebration": {
        // Create a success notification with celebration
        await supabase.from("notifications").insert({
          user_id: userId,
          workspace_id: workspaceId,
          type: "success",
          title: actionPayload.title || "🎉 Félicitations !",
          message: actionPayload.message || "Vous avez atteint un objectif !",
          payload: { celebration: true, ...actionPayload },
          source: "automation",
        });
        return { success: true, result: { celebrated: true } };
      }

      case "suggest_reschedule": {
        // Create AI proposal for rescheduling overloaded tasks
        await supabase.from("ai_proposals").insert({
          user_id: userId,
          workspace_id: workspaceId,
          type: "reschedule",
          title: "Suggestion de report",
          description: actionPayload.description || "Votre journée semble chargée. Voulez-vous reporter certaines tâches ?",
          proposed_actions: actionPayload.tasks_to_reschedule || [],
          reasoning: "Indice de surcharge détecté",
          confidence_score: 0.8,
          priority: "high",
          status: "pending",
          source: "automation",
        });
        return { success: true, result: { suggested: true } };
      }

      case "prompt_reflection": {
        // Create journal prompt for reflection
        await supabase.from("notifications").insert({
          user_id: userId,
          workspace_id: workspaceId,
          type: "action",
          title: "📝 Moment de réflexion",
          message: actionPayload.message || "Prenez un moment pour réfléchir à vos accomplissements.",
          payload: { action: "open_journal", ...actionPayload },
          source: "automation",
        });
        return { success: true, result: { prompted: true } };
      }

      default:
        return { success: false, error: `Unknown action type: ${rule.action_type}` };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Action failed";
    return { success: false, error: message };
  }
}
