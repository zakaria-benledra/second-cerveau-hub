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
    .maybeSingle();

  if (error) throw error;
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
// Uses Kanban statuses and includes archived tasks for accurate metrics
export async function calculateTodayStats(): Promise<DailyStats> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const today = new Date().toISOString().split('T')[0];

  // Get today's tasks from Kanban (using kanban_status, includes archived)
  // Tasks planned = tasks with due_date or start_date today (all kanban statuses)
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .or(`due_date.eq.${today},start_date.eq.${today}`);

  // Count tasks by kanban_status (done column) - includes archived tasks
  const tasksPlanned = tasks?.length || 0;
  // A task is completed if kanban_status is 'done' (Kanban board) or status is 'done'
  const tasksCompleted = tasks?.filter(t => 
    t.kanban_status === 'done' || t.status === 'done'
  ).length || 0;

  // Also count archived tasks completed today for historical accuracy
  const { data: archivedTasks } = await supabase
    .from('tasks')
    .select('*')
    .not('archived_at', 'is', null)
    .eq('status', 'done')
    .or(`due_date.eq.${today},start_date.eq.${today},completed_at.gte.${today}T00:00:00`);
  
  // Add archived completed tasks to the count (avoiding duplicates)
  const archivedIds = new Set(archivedTasks?.map(t => t.id) || []);
  const existingIds = new Set(tasks?.map(t => t.id) || []);
  const additionalArchivedCompleted = archivedTasks?.filter(t => !existingIds.has(t.id)).length || 0;
  
  const totalCompleted = tasksCompleted + additionalArchivedCompleted;
  const totalPlanned = tasksPlanned + additionalArchivedCompleted;

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

  // Get user's daily capacity (best effort - use default if not found)
  const { data: preferences } = await supabase
    .from('preferences')
    .select('daily_capacity_min')
    .maybeSingle();

  const dailyCapacity = preferences?.daily_capacity_min || 480;

  // Calculate overload index (use all tasks including active kanban items)
  const allActiveTasks = tasks?.filter(t => 
    t.kanban_status !== 'done' && t.status !== 'done' && !t.archived_at
  ) || [];
  const totalEstimate = allActiveTasks.reduce((sum, t) => sum + (t.estimate_min || 30), 0);
  const overloadIndex = Math.min(2, totalEstimate / dailyCapacity);

  // Calculate clarity score (tasks with estimate + due_date)
  const clearTasks = tasks?.filter(t => t.estimate_min && t.due_date).length || 0;
  const clarityScore = totalPlanned > 0 ? clearTasks / totalPlanned : 0;

  // Upsert daily stats with Kanban-aware metrics
  const { data, error } = await supabase
    .from('daily_stats')
    .upsert({
      user_id: user.id,
      date: today,
      tasks_planned: totalPlanned,
      tasks_completed: totalCompleted,
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
