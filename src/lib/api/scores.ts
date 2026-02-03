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
  // Financial discipline metrics
  financial_discipline_score: number;
  budget_adherence: number;
  impulsive_spending: number;
  savings_rate: number;
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
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('scores_daily')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .maybeSingle();

  if (error) throw error;
  
  // Si pas de score pour aujourd'hui, créer une entrée par défaut
  if (!data) {
    const { data: newScore, error: insertError } = await supabase
      .from('scores_daily')
      .insert({
        user_id: user.id,
        date: today,
        global_score: 0,
        habits_score: 0,
        tasks_score: 0,
        finance_score: 0,
        health_score: 0,
        momentum_index: 0,
        burnout_index: 0,
        consistency_factor: 1,
        financial_discipline_score: 0,
        budget_adherence: 0,
        impulsive_spending: 0,
        savings_rate: 0,
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating default score:', insertError);
      return null;
    }
    
    return newScore as DailyScore;
  }

  return data as DailyScore;
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
