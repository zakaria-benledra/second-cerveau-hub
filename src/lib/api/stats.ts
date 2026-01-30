import { supabase } from '@/integrations/supabase/client';

export interface DailyStats {
  id: string;
  user_id: string;
  date: string;
  tasks_planned: number;
  tasks_completed: number;
  habits_completed: number;
  habits_total: number;
  focus_minutes: number;
  overload_index: number;
  clarity_score: number;
  created_at: string;
  updated_at: string;
}

export interface WeeklyStats {
  id: string;
  user_id: string;
  week_start: string;
  summary: {
    total_tasks_planned: number;
    total_tasks_completed: number;
    completion_rate: number;
    total_focus_minutes: number;
    avg_overload_index: number;
    habit_adherence: number;
  };
  created_at: string;
  updated_at: string;
}

export interface MonthlyStats {
  id: string;
  user_id: string;
  month: string;
  summary: {
    total_tasks_planned: number;
    total_tasks_completed: number;
    completion_rate: number;
    total_focus_minutes: number;
    avg_overload_index: number;
    habit_adherence: number;
    top_projects: string[];
  };
  created_at: string;
  updated_at: string;
}

// Fetch today's stats
export async function fetchTodayStats(): Promise<DailyStats | null> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('daily_stats')
    .select('*')
    .eq('date', today)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as DailyStats | null;
}

// Fetch week stats
export async function fetchWeekStats(): Promise<DailyStats[]> {
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from('daily_stats')
    .select('*')
    .gte('date', weekAgo.toISOString().split('T')[0])
    .lte('date', today.toISOString().split('T')[0])
    .order('date', { ascending: true });

  if (error) throw error;
  return data as DailyStats[];
}

// Fetch month stats
export async function fetchMonthStats(): Promise<DailyStats[]> {
  const today = new Date();
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from('daily_stats')
    .select('*')
    .gte('date', monthAgo.toISOString().split('T')[0])
    .lte('date', today.toISOString().split('T')[0])
    .order('date', { ascending: true });

  if (error) throw error;
  return data as DailyStats[];
}

// Calculate and upsert today's stats (called by edge function or manually)
export async function calculateTodayStats(): Promise<DailyStats> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const today = new Date().toISOString().split('T')[0];

  // Get today's tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .or(`due_date.eq.${today},start_date.eq.${today}`);

  const tasksPlanned = tasks?.length || 0;
  const tasksCompleted = tasks?.filter(t => t.status === 'done').length || 0;

  // Get today's habits
  const { data: habits } = await supabase
    .from('habits')
    .select('id')
    .eq('is_active', true);

  const { data: habitLogs } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('date', today)
    .eq('completed', true);

  const habitsTotal = habits?.length || 0;
  const habitsCompleted = habitLogs?.length || 0;

  // Get focus sessions
  const { data: focusSessions } = await supabase
    .from('focus_sessions')
    .select('duration_min')
    .gte('start_time', `${today}T00:00:00`)
    .lte('start_time', `${today}T23:59:59`);

  const focusMinutes = focusSessions?.reduce((sum, s) => sum + (s.duration_min || 0), 0) || 0;

  // Get user's daily capacity
  const { data: preferences } = await supabase
    .from('preferences')
    .select('daily_capacity_min')
    .single();

  const dailyCapacity = preferences?.daily_capacity_min || 480;

  // Calculate overload index
  const totalEstimate = tasks?.reduce((sum, t) => sum + (t.estimate_min || 30), 0) || 0;
  const overloadIndex = Math.min(2, totalEstimate / dailyCapacity);

  // Calculate clarity score (tasks with estimate + due_date)
  const clearTasks = tasks?.filter(t => t.estimate_min && t.due_date).length || 0;
  const clarityScore = tasksPlanned > 0 ? clearTasks / tasksPlanned : 0;

  // Upsert daily stats
  const { data, error } = await supabase
    .from('daily_stats')
    .upsert({
      user_id: user.id,
      date: today,
      tasks_planned: tasksPlanned,
      tasks_completed: tasksCompleted,
      habits_completed: habitsCompleted,
      habits_total: habitsTotal,
      focus_minutes: focusMinutes,
      overload_index: Number(overloadIndex.toFixed(2)),
      clarity_score: Number(clarityScore.toFixed(2)),
    }, {
      onConflict: 'user_id,date',
    })
    .select()
    .single();

  if (error) throw error;
  return data as DailyStats;
}
