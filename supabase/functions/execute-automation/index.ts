import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * AUTOMATION EXECUTOR
 * 
 * Processes system events and fires matching automation rules.
 * 
 * Actions:
 * - process_event: Check if any rules match and execute them
 * - trigger_rule: Manually trigger a specific rule
 * - test_rule: Test a rule without executing actions
 */

interface AutomationRequest {
  action: string;
  user_id: string;
  payload?: Record<string, unknown>;
}

async function executeAction(
  supabase: any,
  userId: string,
  actionType: string,
  actionPayload: any
): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    switch (actionType) {
      case "create_task":
        const { data: task, error: taskError } = await supabase
          .from("tasks")
          .insert({
            user_id: userId,
            title: actionPayload.title || "Tâche automatique",
            description: actionPayload.description,
            priority: actionPayload.priority || "medium",
            status: "todo",
            source: "automation"
          })
          .select()
          .single();
        
        if (taskError) throw taskError;
        return { success: true, result: { task } };

      case "send_notification":
        const { data: notif, error: notifError } = await supabase
          .from("notifications")
          .insert({
            user_id: userId,
            type: actionPayload.type || "info",
            title: actionPayload.title || "Notification automatique",
            message: actionPayload.message,
            source: "automation"
          })
          .select()
          .single();
        
        if (notifError) throw notifError;
        return { success: true, result: { notification: notif } };

      case "ai_proposal":
        // Call AI Coach to generate proposal
        const { data: proposal, error: proposalError } = await supabase
          .from("ai_proposals")
          .insert({
            user_id: userId,
            type: actionPayload.proposal_type || "general",
            title: actionPayload.title || "Suggestion automatique",
            description: actionPayload.description,
            proposed_actions: actionPayload.actions || [],
            reasoning: "Déclenché par règle d'automatisation",
            confidence_score: 0.7,
            priority: actionPayload.priority || "medium",
            status: "pending",
            source: "automation"
          })
          .select()
          .single();
        
        if (proposalError) throw proposalError;
        return { success: true, result: { proposal } };

      case "update_stat":
        // Update a daily stat
        const today = new Date().toISOString().split("T")[0];
        const { error: statError } = await supabase
          .from("daily_stats")
          .upsert({
            user_id: userId,
            date: today,
            ...actionPayload.stats
          }, { onConflict: "user_id,date" });
        
        if (statError) throw statError;
        return { success: true, result: { updated: true } };

      case "reward_prompt":
        // Create celebration notification + journal prompt
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "success",
          title: "🎉 Félicitations !",
          message: actionPayload.message || "Vous avez atteint un objectif !",
          source: "automation"
        });
        return { success: true, result: { celebrated: true } };

      default:
        return { success: false, error: `Unknown action type: ${actionType}` };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Action failed";
    return { success: false, error: message };
  }
}

async function processEvent(
  supabase: any,
  userId: string,
  eventType: string,
  eventPayload: any
): Promise<{ matched: number; executed: number; results: any[] }> {
  // Find matching rules
  const { data: rules, error: rulesError } = await supabase
    .from("automation_rules")
    .select("*")
    .eq("user_id", userId)
    .eq("trigger_event", eventType)
    .eq("is_active", true)
    .order("priority", { ascending: false });

  if (rulesError) throw rulesError;

  const results = [];
  let executed = 0;

  for (const rule of rules || []) {
    // Check conditions (simplified - just check if payload matches)
    let conditionsMet = true;
    const conditions = rule.trigger_conditions || {};
    
    for (const [key, value] of Object.entries(conditions)) {
      if (eventPayload[key] !== value) {
        conditionsMet = false;
        break;
      }
    }

    if (!conditionsMet) continue;

    // Execute action
    const actionResult = await executeAction(
      supabase,
      userId,
      rule.action_type,
      rule.action_payload
    );

    // Log automation event
    await supabase.from("automation_events").insert({
      user_id: userId,
      rule_id: rule.id,
      event_type: eventType,
      entity: eventPayload.entity || null,
      entity_id: eventPayload.entity_id || null,
      payload: eventPayload,
      result: actionResult,
      status: actionResult.success ? "success" : "failed",
      processed_at: new Date().toISOString()
    });

    // Update rule stats
    await supabase
      .from("automation_rules")
      .update({
        trigger_count: (rule.trigger_count || 0) + 1,
        last_triggered_at: new Date().toISOString()
      })
      .eq("id", rule.id);

    results.push({
      rule_id: rule.id,
      rule_name: rule.name,
      ...actionResult
    });

    if (actionResult.success) executed++;
  }

  return {
    matched: rules?.length || 0,
    executed,
    results
  };
}

async function triggerRule(
  supabase: any,
  userId: string,
  ruleId: string
): Promise<{ success: boolean; result?: any; error?: string }> {
  // Get rule
  const { data: rule, error: ruleError } = await supabase
    .from("automation_rules")
    .select("*")
    .eq("id", ruleId)
    .eq("user_id", userId)
    .single();

  if (ruleError || !rule) {
    return { success: false, error: "Règle non trouvée" };
  }

  // Execute action
  const actionResult = await executeAction(
    supabase,
    userId,
    rule.action_type,
    rule.action_payload
  );

  // Log event
  await supabase.from("automation_events").insert({
    user_id: userId,
    rule_id: rule.id,
    event_type: "manual_trigger",
    payload: { triggered_manually: true },
    result: actionResult,
    status: actionResult.success ? "success" : "failed",
    processed_at: new Date().toISOString()
  });

  // Update stats
  await supabase
    .from("automation_rules")
    .update({
      trigger_count: (rule.trigger_count || 0) + 1,
      last_triggered_at: new Date().toISOString()
    })
    .eq("id", rule.id);

  // Emit system event
  await supabase.from("system_events").insert({
    user_id: userId,
    event_type: "automation.rule_triggered",
    entity: "automation_rules",
    entity_id: rule.id,
    source: "automation",
    payload: { manual: true }
  });

  return {
    success: actionResult.success,
    result: {
      rule_name: rule.name,
      action_type: rule.action_type,
      ...actionResult
    },
    error: actionResult.error
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, user_id, payload }: AutomationRequest = await req.json();

    if (!action || !user_id) {
      throw new Error("action and user_id are required");
    }

    let result;

    switch (action) {
      case "process_event":
        result = await processEvent(
          supabase,
          user_id,
          payload?.event_type as string,
          payload?.event_payload || {}
        );
        break;

      case "trigger_rule":
        result = await triggerRule(supabase, user_id, payload?.rule_id as string);
        break;

      default:
        result = { success: false, error: `Unknown action: ${action}` };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Automation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
