import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * NIGHTLY SCORING JOB
 * 
 * Runs automatically via pg_cron to compute daily scores for all active users.
 * Also triggers automation rules based on score thresholds.
 */

interface ScoreResult {
  user_id: string;
  success: boolean;
  score?: number;
  error?: string;
}

async function computeUserScore(supabase: any, userId: string, date: string): Promise<ScoreResult> {
  try {
    // Get active habits
    const { data: habits } = await supabase
      .from("habits")
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true);

    // Get habit logs for today
    const { data: logs } = await supabase
      .from("habit_logs")
      .select("habit_id, completed")
      .eq("user_id", userId)
      .eq("date", date);

    const habitsCompleted = logs?.filter((l: any) => l.completed).length || 0;
    const habitsExpected = habits?.length || 0;

    // Get consistency factor from last 7 days
    const weekAgo = new Date(date);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { data: weekLogs } = await supabase
      .from("habit_logs")
      .select("completed")
      .eq("user_id", userId)
      .gte("date", weekAgo.toISOString().split("T")[0])
      .lte("date", date);

    const weekCompleted = weekLogs?.filter((l: any) => l.completed).length || 0;
    const weekExpected = habitsExpected * 7;
    const consistency = weekExpected > 0 ? weekCompleted / weekExpected : 1;

    const habitsScore = habitsExpected > 0 
      ? Math.min(100, (habitsCompleted / habitsExpected) * consistency * 100) 
      : 100;

    // Get tasks for today
    const { data: tasks } = await supabase
      .from("tasks")
      .select("id, status, priority")
      .eq("user_id", userId)
      .or(`due_date.eq.${date},start_date.eq.${date}`)
      .neq("status", "cancelled");

    const priorityWeight: Record<string, number> = {
      urgent: 1.5, high: 1.25, medium: 1, low: 0.75
    };

    let totalWeight = 0;
    let completedWeight = 0;

    for (const task of tasks || []) {
      const weight = priorityWeight[task.priority] || 1;
      totalWeight += weight;
      if (task.status === "done") {
        completedWeight += weight;
      }
    }

    const tasksScore = totalWeight > 0 
      ? Math.min(100, (completedWeight / totalWeight) * 100) 
      : 100;

    // Finance score
    const monthStart = date.substring(0, 7) + "-01";
    
    const { data: budgets } = await supabase
      .from("budgets")
      .select("monthly_limit")
      .eq("user_id", userId);

    const totalBudget = budgets?.reduce((sum: number, b: any) => sum + Number(b.monthly_limit), 0) || 0;

    const { data: transactions } = await supabase
      .from("finance_transactions")
      .select("amount, type")
      .eq("user_id", userId)
      .eq("type", "expense")
      .gte("date", monthStart)
      .lte("date", date);

    const totalSpent = transactions?.reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;
    const financeScore = totalBudget > 0 
      ? Math.min(100, Math.max(0, (1 - (totalSpent / totalBudget)) * 100))
      : 100;

    // Health score (focus sessions)
    const dateStart = `${date}T00:00:00`;
    const dateEnd = `${date}T23:59:59`;
    
    const { data: sessions } = await supabase
      .from("focus_sessions")
      .select("duration_min")
      .eq("user_id", userId)
      .gte("start_time", dateStart)
      .lte("start_time", dateEnd);

    const totalMinutes = sessions?.reduce((sum: number, s: any) => sum + (s.duration_min || 0), 0) || 0;
    const healthScore = Math.min(100, (totalMinutes / 120) * 100);

    // Global score
    const globalScore = 
      (habitsScore * 0.35) +
      (tasksScore * 0.25) +
      (financeScore * 0.20) +
      (healthScore * 0.20);

    // Get recent scores for momentum/burnout
    const { data: recentScores } = await supabase
      .from("scores_daily")
      .select("global_score")
      .eq("user_id", userId)
      .gte("date", weekAgo.toISOString().split("T")[0])
      .order("date", { ascending: true });

    const recentValues = recentScores?.map((s: any) => Number(s.global_score)) || [];
    
    // Momentum calculation
    let momentumIndex = 50;
    if (recentValues.length >= 2) {
      const recent = [...recentValues, globalScore].slice(-7);
      const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
      const secondHalf = recent.slice(Math.floor(recent.length / 2));
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      momentumIndex = Math.min(100, Math.max(0, 50 + (secondAvg - firstAvg)));
    }

    // Burnout calculation
    const avgRecent = recentValues.length > 0 
      ? recentValues.reduce((a: number, b: number) => a + b, 0) / recentValues.length 
      : 50;
    const burnoutIndex = Math.min(100, Math.max(0,
      ((100 - tasksScore) * 0.4) + 
      ((100 - habitsScore) * 0.3) + 
      ((100 - avgRecent) * 0.3)
    ));

    // Upsert score
    const { data: scoreData, error } = await supabase
      .from("scores_daily")
      .upsert({
        user_id: userId,
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

    // Update daily stats
    await supabase
      .from("daily_stats")
      .upsert({
        user_id: userId,
        date,
        tasks_planned: tasks?.length || 0,
        tasks_completed: tasks?.filter((t: any) => t.status === "done").length || 0,
        habits_completed: habitsCompleted,
        habits_total: habitsExpected,
        focus_minutes: totalMinutes,
        clarity_score: globalScore,
        overload_index: burnoutIndex,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id,date" });

    // Trigger automations for high-risk scores
    if (burnoutIndex > 70) {
      await supabase.from("system_events").insert({
        user_id: userId,
        event_type: "burnout.critical",
        entity: "scores_daily",
        source: "automation",
        payload: { burnout_index: burnoutIndex, date }
      });
    }

    if (financeScore < 30) {
      await supabase.from("system_events").insert({
        user_id: userId,
        event_type: "budget.threshold_reached",
        entity: "scores_daily",
        source: "automation",
        payload: { finance_score: financeScore, date }
      });
    }

    return {
      user_id: userId,
      success: true,
      score: globalScore
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      user_id: userId,
      success: false,
      error: message
    };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const date = body.date || new Date().toISOString().split("T")[0];
    const specificUserId = body.user_id;

    let users: { id: string }[] = [];

    if (specificUserId) {
      users = [{ id: specificUserId }];
    } else {
      // Get all users with recent activity
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id")
        .limit(1000);
      
      users = profiles?.map((p: any) => ({ id: p.user_id })) || [];
    }

    console.log(`Processing ${users.length} users for date ${date}`);

    const results: ScoreResult[] = [];

    for (const user of users) {
      const result = await computeUserScore(supabase, user.id, date);
      results.push(result);
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    // Log job completion
    await supabase.from("system_health").upsert({
      service: "nightly_scoring",
      status: failed === 0 ? "healthy" : "degraded",
      message: `Processed ${successful}/${users.length} users. ${failed} failures.`,
      last_check: new Date().toISOString()
    }, { onConflict: "service" });

    return new Response(JSON.stringify({
      success: true,
      date,
      processed: users.length,
      successful,
      failed,
      results: specificUserId ? results : undefined
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Nightly scoring error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
