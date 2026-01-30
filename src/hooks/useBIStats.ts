/**
 * BI Contract Hooks
 * 
 * CRITICAL: These hooks read ONLY from aggregated stats tables.
 * Dashboards MUST use these hooks - never query core tables directly.
 * 
 * Allowed tables: daily_stats, weekly_stats, monthly_stats, scores_daily, scores_weekly, scores_monthly
 * Forbidden: tasks, habits, habit_logs, finance_transactions, etc.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, subWeeks, startOfWeek } from 'date-fns';

// ============================================================
// Daily Stats Hook (BI Compliant)
// ============================================================
export interface DailyStatsRecord {
  id: string;
  user_id: string;
  workspace_id: string | null;
  date: string;
  tasks_planned: number;
  tasks_completed: number;
  habits_completed: number;
  habits_total: number;
  focus_minutes: number;
  overload_index: number | null;
  clarity_score: number | null;
  created_at: string;
  updated_at: string;
}

export function useDailyStats(days: number = 30) {
  return useQuery({
    queryKey: ['bi', 'daily-stats', days],
    queryFn: async (): Promise<DailyStatsRecord[]> => {
      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('daily_stats')
        .select('*')
        .gte('date', startDate)
        .order('date', { ascending: true });
      
      if (error) throw error;
      return (data || []) as DailyStatsRecord[];
    },
  });
}

export function useTodayStats() {
  return useQuery({
    queryKey: ['bi', 'today-stats'],
    queryFn: async (): Promise<DailyStatsRecord | null> => {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('daily_stats')
        .select('*')
        .eq('date', today)
        .maybeSingle();
      
      if (error) throw error;
      return data as DailyStatsRecord | null;
    },
  });
}

// ============================================================
// Weekly Stats Hook (BI Compliant)
// ============================================================
export interface WeeklyStatsRecord {
  id: string;
  user_id: string;
  workspace_id: string | null;
  week_start: string;
  summary: {
    tasks_completed?: number;
    tasks_planned?: number;
    habits_completion_rate?: number;
    focus_minutes?: number;
    avg_daily_score?: number;
    momentum_trend?: number;
    [key: string]: unknown;
  };
  created_at: string;
  updated_at: string;
}

export function useWeeklyStats(weeks: number = 12) {
  return useQuery({
    queryKey: ['bi', 'weekly-stats', weeks],
    queryFn: async (): Promise<WeeklyStatsRecord[]> => {
      const startDate = format(subWeeks(new Date(), weeks), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('weekly_stats')
        .select('*')
        .gte('week_start', startDate)
        .order('week_start', { ascending: true });
      
      if (error) throw error;
      return (data || []) as WeeklyStatsRecord[];
    },
  });
}

// ============================================================
// Monthly Stats Hook (BI Compliant)
// ============================================================
export interface MonthlyStatsRecord {
  id: string;
  user_id: string;
  workspace_id: string | null;
  month: string;
  summary: {
    total_tasks_planned?: number;
    total_tasks_completed?: number;
    completion_rate?: number;
    total_focus_minutes?: number;
    avg_overload_index?: number;
    habit_adherence?: number;
    top_projects?: string[];
    [key: string]: unknown;
  };
  created_at: string;
  updated_at: string;
}

export function useMonthlyStats(months: number = 12) {
  return useQuery({
    queryKey: ['bi', 'monthly-stats', months],
    queryFn: async (): Promise<MonthlyStatsRecord[]> => {
      const { data, error } = await supabase
        .from('monthly_stats')
        .select('*')
        .order('month', { ascending: false })
        .limit(months);
      
      if (error) throw error;
      return (data || []) as MonthlyStatsRecord[];
    },
  });
}

// ============================================================
// Scores Hooks (BI Compliant)
// ============================================================
export interface ScoreDailyRecord {
  id: string;
  user_id: string;
  workspace_id: string | null;
  date: string;
  global_score: number;
  habits_score: number;
  tasks_score: number;
  finance_score: number;
  health_score: number;
  momentum_index: number;
  burnout_index: number;
  consistency_factor: number;
  metadata: Record<string, unknown> | null;
  computed_at: string;
  created_at: string;
}

export function useScoresDailyBI(days: number = 30) {
  return useQuery({
    queryKey: ['bi', 'scores-daily', days],
    queryFn: async (): Promise<ScoreDailyRecord[]> => {
      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('scores_daily')
        .select('*')
        .gte('date', startDate)
        .order('date', { ascending: true });
      
      if (error) throw error;
      return (data || []) as ScoreDailyRecord[];
    },
  });
}

export interface ScoreWeeklyRecord {
  id: string;
  user_id: string;
  workspace_id: string | null;
  week_start: string;
  global_score: number;
  habits_score: number;
  tasks_score: number;
  finance_score: number;
  health_score: number;
  trend_direction: string | null;
  week_over_week_change: number | null;
  metadata: Record<string, unknown> | null;
  computed_at: string;
  created_at: string;
}

export function useScoresWeeklyBI(weeks: number = 12) {
  return useQuery({
    queryKey: ['bi', 'scores-weekly', weeks],
    queryFn: async (): Promise<ScoreWeeklyRecord[]> => {
      const startDate = format(subWeeks(new Date(), weeks), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('scores_weekly')
        .select('*')
        .gte('week_start', startDate)
        .order('week_start', { ascending: true });
      
      if (error) throw error;
      return (data || []) as ScoreWeeklyRecord[];
    },
  });
}

// ============================================================
// Derived KPI Calculations (from stats only)
// ============================================================
export function useExecutiveKPIs() {
  const { data: dailyStats = [], isLoading: dailyLoading } = useDailyStats(7);
  const { data: scores = [], isLoading: scoresLoading } = useScoresDailyBI(7);
  
  const isLoading = dailyLoading || scoresLoading;
  
  // Calculate KPIs from stats tables only
  const kpis = {
    // Task completion rate (7-day avg)
    taskCompletionRate: dailyStats.length > 0
      ? Math.round(
          dailyStats.reduce((sum, d) => {
            if (d.tasks_planned > 0) {
              return sum + (d.tasks_completed / d.tasks_planned) * 100;
            }
            return sum;
          }, 0) / dailyStats.filter(d => d.tasks_planned > 0).length || 0
        )
      : 0,
    
    // Habit adherence (7-day avg)
    habitAdherence: dailyStats.length > 0
      ? Math.round(
          dailyStats.reduce((sum, d) => {
            if (d.habits_total > 0) {
              return sum + (d.habits_completed / d.habits_total) * 100;
            }
            return sum;
          }, 0) / dailyStats.filter(d => d.habits_total > 0).length || 0
        )
      : 0,
    
    // Total focus minutes (7-day)
    totalFocusMinutes: dailyStats.reduce((sum, d) => sum + d.focus_minutes, 0),
    
    // Average focus per day
    avgFocusPerDay: dailyStats.length > 0
      ? Math.round(dailyStats.reduce((sum, d) => sum + d.focus_minutes, 0) / dailyStats.length)
      : 0,
    
    // Average overload index
    avgOverloadIndex: dailyStats.length > 0
      ? dailyStats.reduce((sum, d) => sum + (d.overload_index || 0), 0) / dailyStats.length
      : 0,
    
    // Latest global score
    latestGlobalScore: scores.length > 0 ? scores[scores.length - 1].global_score : 0,
    
    // Score trend (comparing last 3 days vs previous 3)
    scoreTrend: scores.length >= 6
      ? Math.round(
          (scores.slice(-3).reduce((sum, s) => sum + s.global_score, 0) / 3) -
          (scores.slice(-6, -3).reduce((sum, s) => sum + s.global_score, 0) / 3)
        )
      : 0,
    
    // Burnout risk (latest)
    burnoutRisk: scores.length > 0 ? scores[scores.length - 1].burnout_index : 0,
    
    // Momentum (latest)
    momentum: scores.length > 0 ? scores[scores.length - 1].momentum_index : 50,
  };
  
  return { kpis, isLoading };
}

// ============================================================
// Habit Stats from Daily Stats (BI Compliant)
// ============================================================
export function useHabitStatsBI(days: number = 7) {
  const { data: dailyStats = [], isLoading } = useDailyStats(days);
  
  const stats = {
    // Total habits completed over period
    totalCompleted: dailyStats.reduce((sum, d) => sum + d.habits_completed, 0),
    
    // Total habit opportunities
    totalOpportunities: dailyStats.reduce((sum, d) => sum + d.habits_total, 0),
    
    // Completion rate
    completionRate: dailyStats.reduce((sum, d) => sum + d.habits_total, 0) > 0
      ? Math.round(
          (dailyStats.reduce((sum, d) => sum + d.habits_completed, 0) /
           dailyStats.reduce((sum, d) => sum + d.habits_total, 0)) * 100
        )
      : 0,
    
    // Daily breakdown for charts
    dailyBreakdown: dailyStats.map(d => ({
      date: d.date,
      completed: d.habits_completed,
      total: d.habits_total,
      rate: d.habits_total > 0 ? Math.round((d.habits_completed / d.habits_total) * 100) : 0,
    })),
    
    // Best day
    bestDay: dailyStats.reduce((best, d) => {
      const rate = d.habits_total > 0 ? d.habits_completed / d.habits_total : 0;
      const bestRate = best.habits_total > 0 ? best.habits_completed / best.habits_total : 0;
      return rate > bestRate ? d : best;
    }, dailyStats[0] || null),
    
    // Active habit count (from latest day)
    activeHabitCount: dailyStats.length > 0 
      ? dailyStats[dailyStats.length - 1].habits_total 
      : 0,
  };
  
  return { stats, isLoading };
}

// ============================================================
// Finance Stats from Monthly Stats (BI Compliant)
// ============================================================
export function useFinanceStatsBI(months: number = 6) {
  const { data: monthlyStats = [], isLoading: monthlyLoading } = useMonthlyStats(months);
  const { data: scores = [], isLoading: scoresLoading } = useScoresDailyBI(30);
  
  const isLoading = monthlyLoading || scoresLoading;
  
  // Finance score trend from scores_daily
  const financeScores = scores.map(s => ({
    date: s.date,
    score: s.finance_score,
  }));
  
  const avgFinanceScore = scores.length > 0
    ? Math.round(scores.reduce((sum, s) => sum + s.finance_score, 0) / scores.length)
    : 0;
  
  const financeTrend = scores.length >= 14
    ? Math.round(
        (scores.slice(-7).reduce((sum, s) => sum + s.finance_score, 0) / 7) -
        (scores.slice(-14, -7).reduce((sum, s) => sum + s.finance_score, 0) / 7)
      )
    : 0;
  
  return {
    financeScores,
    avgFinanceScore,
    financeTrend,
    monthlyStats,
    isLoading,
  };
}

// ============================================================
// Combined BI Stats Hook for Dashboard
// ============================================================
export function useBIStats(days: number = 7) {
  const { data: daily = [], isLoading: dailyLoading } = useDailyStats(days);
  const { data: weekly = [], isLoading: weeklyLoading } = useWeeklyStats(Math.ceil(days / 7));
  const { data: monthly = [], isLoading: monthlyLoading } = useMonthlyStats(Math.ceil(days / 30));
  
  return {
    daily,
    weekly,
    monthly,
    isLoading: dailyLoading || weeklyLoading || monthlyLoading,
  };
}
