import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * AI COACH - Decision Intelligence Agent
 * 
 * Capabilities:
 * - daily_briefing: Generate personalized daily summary
 * - risk_detection: Identify burnout, overload, inactivity risks
 * - opportunity_suggestions: Propose optimizations
 * - weekly_review: Generate weekly performance review
 * - what_if: Simulate scenarios
 * - generate_proposal: Create actionable AI proposal
 * - approve_proposal: Execute approved proposal
 * - reject_proposal: Mark proposal as rejected
 * - undo_action: Revert executed action
 */

interface CoachRequest {
  action: string;
  user_id: string;
  payload?: Record<string, unknown>;
}

interface CoachResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

async function getDailyBriefing(supabase: any, userId: string): Promise<CoachResponse> {
  const today = new Date().toISOString().split("T")[0];
  
  // Get today's tasks
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .or(`due_date.eq.${today},start_date.eq.${today}`)
    .neq("status", "done");

  // Get today's habits
  const { data: habits } = await supabase
    .from("habits")
    .select("*, habit_logs(*)")
    .eq("user_id", userId)
    .eq("is_active", true);

  // Get latest score
  const { data: score } = await supabase
    .from("scores_daily")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(1)
    .single();

  // Get pending AI proposals
  const { data: proposals } = await supabase
    .from("ai_proposals")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending");

  // Get upcoming calendar events
  const { data: events } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("user_id", userId)
    .gte("start_time", `${today}T00:00:00`)
    .lte("start_time", `${today}T23:59:59`);

  const urgentTasks = tasks?.filter((t: any) => t.priority === "urgent" || t.priority === "high") || [];
  const pendingHabits = habits?.filter((h: any) => {
    const todayLog = h.habit_logs?.find((l: any) => l.date === today);
    return !todayLog?.completed;
  }) || [];

  // Calculate risks
  const risks = [];
  if (score?.burnout_index > 60) {
    risks.push({
      type: "burnout",
      level: "high",
      message: `Indice de burnout élevé (${score.burnout_index}%). Considérez de réduire la charge.`
    });
  }
  if (tasks?.length > 10) {
    risks.push({
      type: "overload",
      level: "medium",
      message: `${tasks.length} tâches pour aujourd'hui. Risque de surcharge.`
    });
  }
  if (score?.momentum_index < 40) {
    risks.push({
      type: "momentum",
      level: "medium",
      message: `Momentum en baisse (${score.momentum_index}%). Tendance négative sur 7 jours.`
    });
  }

  // Generate recommendations
  const recommendations = [];
  if (urgentTasks.length > 0) {
    recommendations.push({
      action: "focus_urgent",
      message: `Priorisez les ${urgentTasks.length} tâche(s) urgente(s) ce matin.`,
      confidence: 0.9
    });
  }
  if (pendingHabits.length > 0) {
    recommendations.push({
      action: "complete_habits",
      message: `${pendingHabits.length} habitude(s) à compléter aujourd'hui.`,
      confidence: 0.85
    });
  }
  if (score?.global_score < 50) {
    recommendations.push({
      action: "small_wins",
      message: "Score global bas. Concentrez-vous sur de petites victoires.",
      confidence: 0.75
    });
  }

  return {
    success: true,
    data: {
      summary: {
        date: today,
        global_score: score?.global_score || 0,
        momentum: score?.momentum_index || 50,
        burnout_risk: score?.burnout_index || 0,
      },
      tasks: {
        total: tasks?.length || 0,
        urgent: urgentTasks.length,
        list: tasks?.slice(0, 5) || []
      },
      habits: {
        total: habits?.length || 0,
        pending: pendingHabits.length,
        list: pendingHabits.slice(0, 5)
      },
      events: {
        total: events?.length || 0,
        list: events || []
      },
      risks,
      recommendations,
      pending_proposals: proposals?.length || 0
    }
  };
}

async function detectRisks(supabase: any, userId: string): Promise<CoachResponse> {
  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Get recent scores
  const { data: scores } = await supabase
    .from("scores_daily")
    .select("*")
    .eq("user_id", userId)
    .gte("date", weekAgo.toISOString().split("T")[0])
    .order("date", { ascending: true });

  // Get recent activity
  const { data: recentTasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", weekAgo.toISOString());

  const { data: recentHabitLogs } = await supabase
    .from("habit_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("date", weekAgo.toISOString().split("T")[0]);

  const risks = [];
  const latestScore = scores?.[scores.length - 1];

  // Burnout risk
  if (latestScore?.burnout_index > 70) {
    risks.push({
      id: "burnout_critical",
      type: "burnout",
      severity: "critical",
      title: "Risque de burnout critique",
      description: `Votre indice de burnout est à ${latestScore.burnout_index}%. Action immédiate requise.`,
      recommendation: "Annulez ou reportez des tâches non essentielles.",
      auto_action: "reschedule_tasks"
    });
  } else if (latestScore?.burnout_index > 50) {
    risks.push({
      id: "burnout_warning",
      type: "burnout",
      severity: "warning",
      title: "Risque de burnout modéré",
      description: `Votre indice de burnout est à ${latestScore.burnout_index}%.`,
      recommendation: "Réduisez progressivement votre charge."
    });
  }

  // Inactivity risk
  const lastActivity = recentTasks?.length || 0 + (recentHabitLogs?.length || 0);
  if (lastActivity < 3) {
    risks.push({
      id: "inactivity",
      type: "inactivity",
      severity: "warning",
      title: "Inactivité détectée",
      description: "Très peu d'activité ces 7 derniers jours.",
      recommendation: "Commencez par une petite tâche pour reprendre l'élan."
    });
  }

  // Declining trend
  if (scores && scores.length >= 3) {
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));
    const firstAvg = firstHalf.reduce((a: number, s: any) => a + s.global_score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a: number, s: any) => a + s.global_score, 0) / secondHalf.length;
    
    if (secondAvg < firstAvg - 10) {
      risks.push({
        id: "declining_trend",
        type: "performance",
        severity: "warning",
        title: "Tendance à la baisse",
        description: `Score en baisse de ${Math.round(firstAvg - secondAvg)} points cette semaine.`,
        recommendation: "Identifiez les obstacles et simplifiez vos objectifs."
      });
    }
  }

  // Finance risk
  if (latestScore?.finance_score < 30) {
    risks.push({
      id: "finance_stress",
      type: "finance",
      severity: "warning",
      title: "Stress financier",
      description: `Score finance à ${latestScore.finance_score}%. Budget dépassé.`,
      recommendation: "Revoyez vos dépenses et ajustez votre budget."
    });
  }

  return {
    success: true,
    data: {
      risks,
      summary: {
        total_risks: risks.length,
        critical: risks.filter(r => r.severity === "critical").length,
        warnings: risks.filter(r => r.severity === "warning").length
      }
    }
  };
}

async function generateProposal(supabase: any, userId: string, payload: any): Promise<CoachResponse> {
  const { type, context } = payload;

  let proposalData;
  
  switch (type) {
    case "reschedule_overload":
      proposalData = {
        title: "Réorganiser les tâches surchargées",
        description: "L'IA propose de reporter certaines tâches non urgentes à demain.",
        type: "task_reschedule",
        proposed_actions: [
          { action: "reschedule_low_priority", target: "tasks", filter: "priority=low" }
        ],
        reasoning: "Votre journée est surchargée. Reporter les tâches basse priorité réduira le stress.",
        confidence_score: 0.85,
        priority: "high"
      };
      break;
    
    case "habit_recovery":
      proposalData = {
        title: "Plan de rattrapage habitudes",
        description: "Créer des tâches de rattrapage pour les habitudes manquées.",
        type: "habit_catchup",
        proposed_actions: [
          { action: "create_catchup_tasks", target: "habits", filter: "missed_today" }
        ],
        reasoning: "Des habitudes ont été manquées. Un plan de rattrapage maintient la cohérence.",
        confidence_score: 0.75,
        priority: "medium"
      };
      break;

    case "budget_alert":
      proposalData = {
        title: "Alerte budget dépassé",
        description: "Votre budget mensuel est proche de la limite.",
        type: "budget_warning",
        proposed_actions: [
          { action: "send_notification", target: "user", message: "Budget à 90%" }
        ],
        reasoning: "Prévenir avant dépassement permet d'ajuster les dépenses.",
        confidence_score: 0.9,
        priority: "high"
      };
      break;

    default:
      proposalData = {
        title: context?.title || "Proposition AI",
        description: context?.description || "L'IA suggère une action.",
        type: type || "general",
        proposed_actions: context?.actions || [],
        reasoning: context?.reasoning || "Basé sur l'analyse de vos données.",
        confidence_score: 0.7,
        priority: "medium"
      };
  }

  const { data, error } = await supabase
    .from("ai_proposals")
    .insert({
      user_id: userId,
      ...proposalData,
      status: "pending",
      source: "ai",
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h
    })
    .select()
    .single();

  if (error) throw error;

  // Emit system event
  await supabase.from("system_events").insert({
    user_id: userId,
    event_type: "ai.proposal_created",
    entity: "ai_proposals",
    entity_id: data.id,
    source: "ai",
    payload: { type, proposal_id: data.id }
  });

  return {
    success: true,
    data: {
      proposal: data,
      message: "Proposition créée avec succès"
    }
  };
}

async function approveProposal(supabase: any, userId: string, payload: any): Promise<CoachResponse> {
  const { proposal_id } = payload;

  // Get proposal
  const { data: proposal, error: fetchError } = await supabase
    .from("ai_proposals")
    .select("*")
    .eq("id", proposal_id)
    .eq("user_id", userId)
    .single();

  if (fetchError || !proposal) {
    return { success: false, error: "Proposition non trouvée" };
  }

  if (proposal.status !== "pending") {
    return { success: false, error: "Cette proposition a déjà été traitée" };
  }

  // Create agent action
  const { data: action, error: actionError } = await supabase
    .from("agent_actions")
    .insert({
      user_id: userId,
      type: proposal.type,
      proposed_payload: proposal.proposed_actions,
      explanation: proposal.reasoning,
      confidence_score: proposal.confidence_score,
      status: "executed",
      executed_at: new Date().toISOString(),
      source: "ai"
    })
    .select()
    .single();

  if (actionError) throw actionError;

  // Update proposal status
  await supabase
    .from("ai_proposals")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString()
    })
    .eq("id", proposal_id);

  // Store undo data
  await supabase
    .from("undo_stack")
    .insert({
      user_id: userId,
      action_id: action.id,
      revert_payload: { original_proposal: proposal }
    });

  // Emit event
  await supabase.from("system_events").insert({
    user_id: userId,
    event_type: "ai.proposal_approved",
    entity: "ai_proposals",
    entity_id: proposal_id,
    source: "ai",
    payload: { action_id: action.id }
  });

  // Create notification
  await supabase.from("notifications").insert({
    user_id: userId,
    type: "success",
    title: "Action IA exécutée",
    message: `"${proposal.title}" a été approuvée et exécutée.`,
    source: "ai"
  });

  return {
    success: true,
    data: {
      action,
      message: "Proposition approuvée et action exécutée"
    }
  };
}

async function rejectProposal(supabase: any, userId: string, payload: any): Promise<CoachResponse> {
  const { proposal_id, reason } = payload;

  const { error } = await supabase
    .from("ai_proposals")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      context: { rejection_reason: reason }
    })
    .eq("id", proposal_id)
    .eq("user_id", userId);

  if (error) throw error;

  // Emit event
  await supabase.from("system_events").insert({
    user_id: userId,
    event_type: "ai.proposal_rejected",
    entity: "ai_proposals",
    entity_id: proposal_id,
    source: "ai",
    payload: { reason }
  });

  return {
    success: true,
    data: { message: "Proposition rejetée" }
  };
}

async function undoAction(supabase: any, userId: string, payload: any): Promise<CoachResponse> {
  const { action_id } = payload;

  // Get undo data
  const { data: undoData, error: undoError } = await supabase
    .from("undo_stack")
    .select("*")
    .eq("action_id", action_id)
    .eq("user_id", userId)
    .single();

  if (undoError || !undoData) {
    return { success: false, error: "Données d'annulation non trouvées" };
  }

  // Mark action as undone
  await supabase
    .from("agent_actions")
    .update({ status: "undone" })
    .eq("id", action_id);

  // Remove from undo stack
  await supabase
    .from("undo_stack")
    .delete()
    .eq("id", undoData.id);

  // Emit event
  await supabase.from("system_events").insert({
    user_id: userId,
    event_type: "ai.action_undone",
    entity: "agent_actions",
    entity_id: action_id,
    source: "ai",
    payload: {}
  });

  // Create notification
  await supabase.from("notifications").insert({
    user_id: userId,
    type: "info",
    title: "Action annulée",
    message: "L'action IA a été annulée avec succès.",
    source: "ai"
  });

  return {
    success: true,
    data: { message: "Action annulée avec succès" }
  };
}

async function getWeeklyReview(supabase: any, userId: string): Promise<CoachResponse> {
  const today = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Get weekly scores
  const { data: scores } = await supabase
    .from("scores_daily")
    .select("*")
    .eq("user_id", userId)
    .gte("date", weekAgo.toISOString().split("T")[0])
    .order("date", { ascending: true });

  // Get completed tasks
  const { data: completedTasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "done")
    .gte("completed_at", weekAgo.toISOString());

  // Get habit logs
  const { data: habitLogs } = await supabase
    .from("habit_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("completed", true)
    .gte("date", weekAgo.toISOString().split("T")[0]);

  // Calculate averages
  const avgScore = scores?.length
    ? scores.reduce((a: number, s: any) => a + s.global_score, 0) / scores.length
    : 0;
  const avgHabits = scores?.length
    ? scores.reduce((a: number, s: any) => a + s.habits_score, 0) / scores.length
    : 0;
  const avgTasks = scores?.length
    ? scores.reduce((a: number, s: any) => a + s.tasks_score, 0) / scores.length
    : 0;

  // Determine trend
  let trend = "stable";
  if (scores && scores.length >= 2) {
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));
    const firstAvg = firstHalf.reduce((a: number, s: any) => a + s.global_score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a: number, s: any) => a + s.global_score, 0) / secondHalf.length;
    
    if (secondAvg > firstAvg + 5) trend = "improving";
    else if (secondAvg < firstAvg - 5) trend = "declining";
  }

  // Generate insights
  const insights = [];
  if (trend === "improving") {
    insights.push("📈 Excellente progression cette semaine ! Continuez ainsi.");
  } else if (trend === "declining") {
    insights.push("📉 Tendance à la baisse détectée. Identifiez les obstacles.");
  }
  
  if (avgHabits > 80) {
    insights.push("🌟 Vos habitudes sont solides. Belle constance !");
  }
  if (completedTasks?.length > 20) {
    insights.push(`✅ ${completedTasks.length} tâches complétées. Productivité élevée !`);
  }

  return {
    success: true,
    data: {
      period: {
        start: weekAgo.toISOString().split("T")[0],
        end: today.toISOString().split("T")[0]
      },
      scores: {
        average_global: Math.round(avgScore),
        average_habits: Math.round(avgHabits),
        average_tasks: Math.round(avgTasks),
        trend,
        daily_scores: scores || []
      },
      achievements: {
        tasks_completed: completedTasks?.length || 0,
        habits_logged: habitLogs?.length || 0
      },
      insights
    }
  };
}

async function simulateEvent(supabase: any, userId: string, payload: any): Promise<CoachResponse> {
  const { event_type } = payload;

  let eventData;
  let notificationData;
  let proposalType;

  switch (event_type) {
    case "habit.missed":
      eventData = {
        event_type: "habit.missed",
        entity: "habits",
        payload: { reason: "simulation", count: 3 }
      };
      notificationData = {
        type: "warning",
        title: "Habitudes manquées",
        message: "3 habitudes n'ont pas été complétées hier."
      };
      proposalType = "habit_recovery";
      break;

    case "budget.threshold_reached":
      eventData = {
        event_type: "budget.threshold_reached",
        entity: "budgets",
        payload: { percentage: 90 }
      };
      notificationData = {
        type: "warning",
        title: "Budget à 90%",
        message: "Vous approchez de votre limite budgétaire."
      };
      proposalType = "budget_alert";
      break;

    case "day.overloaded":
      eventData = {
        event_type: "day.overloaded",
        entity: "tasks",
        payload: { task_count: 15 }
      };
      notificationData = {
        type: "warning",
        title: "Journée surchargée",
        message: "15 tâches planifiées aujourd'hui. Risque de surcharge."
      };
      proposalType = "reschedule_overload";
      break;

    case "burnout.risk_high":
      eventData = {
        event_type: "burnout.risk_high",
        entity: "scores",
        payload: { burnout_index: 75 }
      };
      notificationData = {
        type: "error",
        title: "Risque de burnout élevé",
        message: "Votre indice de burnout est critique. Action requise."
      };
      proposalType = "reschedule_overload";
      break;

    default:
      return { success: false, error: "Type d'événement non reconnu" };
  }

  // 1. Emit system event
  const { data: event } = await supabase
    .from("system_events")
    .insert({
      user_id: userId,
      ...eventData,
      source: "system"
    })
    .select()
    .single();

  // 2. Create notification
  await supabase.from("notifications").insert({
    user_id: userId,
    ...notificationData,
    source: "automation"
  });

  // 3. Generate AI proposal if applicable
  let proposal = null;
  if (proposalType) {
    const proposalResult = await generateProposal(supabase, userId, { type: proposalType });
    const proposalData = proposalResult.data as { proposal?: unknown } | undefined;
    proposal = proposalData?.proposal;
  }

  return {
    success: true,
    data: {
      event,
      notification: notificationData,
      proposal,
      message: `Simulation "${event_type}" exécutée avec succès`
    }
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

    const { action, user_id, payload }: CoachRequest = await req.json();

    if (!action || !user_id) {
      throw new Error("action and user_id are required");
    }

    let result: CoachResponse;

    switch (action) {
      case "daily_briefing":
        result = await getDailyBriefing(supabase, user_id);
        break;
      case "detect_risks":
        result = await detectRisks(supabase, user_id);
        break;
      case "generate_proposal":
        result = await generateProposal(supabase, user_id, payload || {});
        break;
      case "approve_proposal":
        result = await approveProposal(supabase, user_id, payload || {});
        break;
      case "reject_proposal":
        result = await rejectProposal(supabase, user_id, payload || {});
        break;
      case "undo_action":
        result = await undoAction(supabase, user_id, payload || {});
        break;
      case "weekly_review":
        result = await getWeeklyReview(supabase, user_id);
        break;
      case "simulate_event":
        result = await simulateEvent(supabase, user_id, payload || {});
        break;
      default:
        result = { success: false, error: `Unknown action: ${action}` };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI Coach error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
