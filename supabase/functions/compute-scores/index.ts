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
 * SCORING ENGINE with Multi-Tenant Support
 * 
 * Formula:
 * GLOBAL_SCORE = (HABITS × 0.35) + (TASKS × 0.25) + (FINANCE × 0.20) + (HEALTH × 0.20)
 */

async function computeHabitsScore(supabase: any, userId: string, date: string): Promise<{ score: number; consistency: number }> {
  const { data: habits } = await supabase
    .from("habits")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (!habits?.length) return { score: 100, consistency: 1 };

  const { data: logs } = await supabase
    .from("habit_logs")
    .select("habit_id, completed")
    .eq("user_id", userId)
    .eq("date", date);

  const completed = logs?.filter((l: any) => l.completed).length || 0;
  const expected = habits.length;

  // 7-day consistency
  const weekAgo = new Date(date);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const { data: weekLogs } = await supabase
    .from("habit_logs")
    .select("completed")
    .eq("user_id", userId)
    .gte("date", weekAgo.toISOString().split("T")[0])
    .lte("date", date);

  const weekCompleted = weekLogs?.filter((l: any) => l.completed).length || 0;
  const weekExpected = expected * 7;
  const consistency = weekExpected > 0 ? weekCompleted / weekExpected : 1;

  const score = expected > 0 ? (completed / expected) * consistency * 100 : 100;
  
  return { score: Math.min(100, Math.max(0, score)), consistency };
}

async function computeTasksScore(supabase: any, userId: string, date: string): Promise<number> {
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, status, priority")
    .eq("user_id", userId)
    .or(`due_date.eq.${date},start_date.eq.${date}`)
    .neq("status", "cancelled");

  if (!tasks?.length) return 100;

  const priorityWeight: Record<string, number> = {
    urgent: 1.5,
    high: 1.25,
    medium: 1,
    low: 0.75,
  };

  let totalWeight = 0;
  let completedWeight = 0;

  for (const task of tasks) {
    const weight = priorityWeight[task.priority] || 1;
    totalWeight += weight;
    if (task.status === "done") {
      completedWeight += weight;
    }
  }

  const score = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 100;
  return Math.min(100, Math.max(0, score));
}

async function computeFinanceScore(supabase: any, userId: string, date: string): Promise<number> {
  const monthStart = date.substring(0, 7) + "-01";
  
  const { data: budgets } = await supabase
    .from("budgets")
    .select("monthly_limit")
    .eq("user_id", userId);

  const totalBudget = budgets?.reduce((sum: number, b: any) => sum + Number(b.monthly_limit), 0) || 0;
  
  if (totalBudget === 0) return 100;

  const { data: transactions } = await supabase
    .from("finance_transactions")
    .select("amount, type")
    .eq("user_id", userId)
    .eq("type", "expense")
    .gte("date", monthStart)
    .lte("date", date);

  const totalSpent = transactions?.reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;
  
  const score = (1 - (totalSpent / totalBudget)) * 100;
  return Math.min(100, Math.max(0, score));
}

async function computeHealthScore(supabase: any, userId: string, date: string): Promise<number> {
  const dateStart = `${date}T00:00:00`;
  const dateEnd = `${date}T23:59:59`;
  
  const { data: sessions } = await supabase
    .from("focus_sessions")
    .select("duration_min")
    .eq("user_id", userId)
    .gte("start_time", dateStart)
    .lte("start_time", dateEnd);

  const totalMinutes = sessions?.reduce((sum: number, s: any) => sum + (s.duration_min || 0), 0) || 0;
  const targetMinutes = 120;
  const score = (totalMinutes / targetMinutes) * 100;
  
  return Math.min(100, Math.max(0, score));
}

function computeMomentum(scores: number[]): number {
  if (scores.length < 2) return 50;
  
  const recent = scores.slice(-7);
  const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
  const secondHalf = recent.slice(Math.floor(recent.length / 2));
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const momentum = 50 + (secondAvg - firstAvg);
  return Math.min(100, Math.max(0, momentum));
}

function computeBurnoutIndex(taskScore: number, habitsScore: number, recentScores: number[]): number {
  const avgRecent = recentScores.length > 0 
    ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length 
    : 50;
  
  const taskStress = 100 - taskScore;
  const habitStress = 100 - habitsScore;
  const trendStress = 100 - avgRecent;
  
  const burnout = (taskStress * 0.4 + habitStress * 0.3 + trendStress * 0.3);
  return Math.min(100, Math.max(0, burnout));
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
        JSON.stringify({ error: "user_id must be a valid UUID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isDate(body.date)) {
      return new Response(
        JSON.stringify({ error: "date must be in YYYY-MM-DD format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { user_id, date } = body;

    // Get user's workspace_id for multi-tenant upsert
    const workspaceId = await getUserWorkspaceId(supabase, user_id);

    // Compute all subscores
    const { score: habitsScore, consistency } = await computeHabitsScore(supabase, user_id, date);
    const tasksScore = await computeTasksScore(supabase, user_id, date);
    const financeScore = await computeFinanceScore(supabase, user_id, date);
    const healthScore = await computeHealthScore(supabase, user_id, date);

    // Global score with weights
    const globalScore = 
      (habitsScore * 0.35) +
      (tasksScore * 0.25) +
      (financeScore * 0.20) +
      (healthScore * 0.20);

    // Get recent scores for momentum/burnout
    const weekAgo = new Date(date);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { data: recentScores } = await supabase
      .from("scores_daily")
      .select("global_score")
      .eq("user_id", user_id)
      .gte("date", weekAgo.toISOString().split("T")[0])
      .order("date", { ascending: true });

    const recentValues = recentScores?.map((s: any) => Number(s.global_score)) || [];
    
    const momentumIndex = computeMomentum([...recentValues, globalScore]);
    const burnoutIndex = computeBurnoutIndex(tasksScore, habitsScore, recentValues);

    // ========== MULTI-TENANT UPSERT ==========
    const { data: scoreData, error } = await supabase
      .from("scores_daily")
      .upsert({
        user_id,
        workspace_id: workspaceId, // MULTI-TENANT
        date,
        global_score: Math.round(globalScore * 100) / 100,
        habits_score: Math.round(habitsScore * 100) / 100,
        tasks_score: Math.round(tasksScore * 100) / 100,
        finance_score: Math.round(financeScore * 100) / 100,
        health_score: Math.round(healthScore * 100) / 100,
        momentum_index: Math.round(momentumIndex * 100) / 100,
        burnout_index: Math.round(burnoutIndex * 100) / 100,
        consistency_factor: Math.round(consistency * 100) / 100,
        computed_at: new Date().toISOString(),
      }, { onConflict: "user_id,date" })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, score: scoreData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Scoring error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
