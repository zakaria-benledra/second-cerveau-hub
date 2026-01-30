import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * SCORING ENGINE
 * 
 * Formula:
 * GLOBAL_SCORE = (HABITS_SCORE × 0.35) + (TASKS_SCORE × 0.25) + (FINANCE_SCORE × 0.20) + (HEALTH_SCORE × 0.20)
 * 
 * Subscores:
 * - HABITS_SCORE = completed / expected × consistency_factor
 * - TASKS_SCORE = completed / planned × priority_weight
 * - FINANCE_SCORE = 1 - (spent / budget)
 * - HEALTH_SCORE = sessions / target_sessions
 */

interface ScoreData {
  habits_score: number;
  tasks_score: number;
  finance_score: number;
  health_score: number;
  global_score: number;
  momentum_index: number;
  burnout_index: number;
  consistency_factor: number;
}

async function computeHabitsScore(supabase: any, userId: string, date: string): Promise<{ score: number; consistency: number }> {
  // Get active habits
  const { data: habits } = await supabase
    .from("habits")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (!habits?.length) return { score: 100, consistency: 1 };

  // Get habit logs for today
  const { data: logs } = await supabase
    .from("habit_logs")
    .select("habit_id, completed")
    .eq("user_id", userId)
    .eq("date", date);

  const completed = logs?.filter((l: any) => l.completed).length || 0;
  const expected = habits.length;

  // Calculate consistency factor from last 7 days
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
  // Get tasks planned for today
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, status, priority")
    .eq("user_id", userId)
    .or(`due_date.eq.${date},start_date.eq.${date}`)
    .neq("status", "cancelled");

  if (!tasks?.length) return 100;

  // Priority weights
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
  
  // Get budgets
  const { data: budgets } = await supabase
    .from("budgets")
    .select("monthly_limit")
    .eq("user_id", userId);

  const totalBudget = budgets?.reduce((sum: number, b: any) => sum + Number(b.monthly_limit), 0) || 0;
  
  if (totalBudget === 0) return 100;

  // Get expenses this month
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
  // Get focus sessions for today (health proxy)
  const dateStart = `${date}T00:00:00`;
  const dateEnd = `${date}T23:59:59`;
  
  const { data: sessions } = await supabase
    .from("focus_sessions")
    .select("duration_min")
    .eq("user_id", userId)
    .gte("start_time", dateStart)
    .lte("start_time", dateEnd);

  const totalMinutes = sessions?.reduce((sum: number, s: any) => sum + (s.duration_min || 0), 0) || 0;
  
  // Target: 120 minutes of focused work
  const targetMinutes = 120;
  const score = (totalMinutes / targetMinutes) * 100;
  
  return Math.min(100, Math.max(0, score));
}

function computeMomentum(scores: number[]): number {
  if (scores.length < 2) return 50;
  
  // Calculate trend from recent scores
  const recent = scores.slice(-7);
  const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
  const secondHalf = recent.slice(Math.floor(recent.length / 2));
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  // Momentum: 50 = stable, >50 = improving, <50 = declining
  const momentum = 50 + (secondAvg - firstAvg);
  return Math.min(100, Math.max(0, momentum));
}

function computeBurnoutIndex(taskScore: number, habitsScore: number, recentScores: number[]): number {
  // High burnout indicators:
  // - Low task completion
  // - Low habit adherence
  // - Declining trend
  
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

    const { user_id, date } = await req.json();
    
    if (!user_id || !date) {
      throw new Error("user_id and date are required");
    }

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

    // Upsert daily score
    const { data: scoreData, error } = await supabase
      .from("scores_daily")
      .upsert({
        user_id,
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
