import { supabase } from '@/integrations/supabase/client';

export interface DailyScore {
  id: string;
  user_id: string;
  date: string;
  global_score: number;
  habits_score: number;
  tasks_score: number;
  finance_score: number;
  health_score: number;
  momentum_index: number;
  burnout_index: number;
  consistency_factor: number;
  metadata: Record<string, unknown>;
  computed_at: string;
}

export interface WeeklyScore {
  id: string;
  user_id: string;
  week_start: string;
  global_score: number;
  habits_score: number;
  tasks_score: number;
  finance_score: number;
  health_score: number;
  trend_direction: string;
  week_over_week_change: number;
}

export async function fetchTodayScore(): Promise<DailyScore | null> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('scores_daily')
    .select('*')
    .eq('date', today)
    .maybeSingle();

  if (error) throw error;
  return data as DailyScore | null;
}

export async function fetchScoreHistory(days: number = 30): Promise<DailyScore[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const { data, error } = await supabase
    .from('scores_daily')
    .select('*')
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: true });

  if (error) throw error;
  return (data || []) as DailyScore[];
}

export async function fetchWeeklyScores(weeks: number = 12): Promise<WeeklyScore[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (weeks * 7));
  
  const { data, error } = await supabase
    .from('scores_weekly')
    .select('*')
    .gte('week_start', startDate.toISOString().split('T')[0])
    .order('week_start', { ascending: true });

  if (error) throw error;
  return (data || []) as WeeklyScore[];
}

export async function recomputeScore(date?: string): Promise<DailyScore> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  const targetDate = date || new Date().toISOString().split('T')[0];

  const { data, error } = await supabase.functions.invoke('compute-scores', {
    body: { user_id: userData.user.id, date: targetDate },
  });

  if (error) throw error;
  return data.score as DailyScore;
}
