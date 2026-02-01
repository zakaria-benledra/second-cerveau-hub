import { supabase } from '@/integrations/supabase/client';

export interface UserContext {
  // Métriques temps réel
  metrics: {
    habits_rate_7d: number;
    habits_variance_30d: number;
    task_overdue_ratio: number;
    task_completion_rate: number;
    journal_sentiment_avg: number;
    burnout_risk: number;
    momentum_index: number;
    financial_health: number;
  };
  
  // Temporel
  temporal: {
    hour_of_day: number;
    day_of_week: number;
    is_weekend: boolean;
    days_since_last_activity: number;
  };
  
  // État actuel
  current: {
    pending_tasks: number;
    due_today: number;
    habits_done_today: number;
    habits_total_today: number;
    current_streak: number;
    last_journal_mood: number;
  };
  
  // Qualité des données
  data_quality: number; // 0-1
}

interface HabitStats {
  completed: number;
  expected: number;
  total: number;
  dailyRates: number[];
}

interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  due_today: number;
  due_today_minutes: number;
}

interface TodayScore {
  habits_done: number;
  habits_total: number;
}

interface StreakData {
  current: number;
  max: number;
}

interface JournalData {
  mood: number;
  mood_trend: number;
  sentiment: number;
}

interface FinanceHealth {
  hasData: boolean;
  health: number;
}

// Fetch habit stats for a given period
async function fetchHabitStats(userId: string, since: Date): Promise<HabitStats> {
  const sinceStr = since.toISOString().split('T')[0];
  
  const [habitsResult, logsResult] = await Promise.all([
    supabase
      .from('habits')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .is('deleted_at', null),
    supabase
      .from('habit_logs')
      .select('habit_id, date, completed')
      .eq('user_id', userId)
      .gte('date', sinceStr)
  ]);

  const habits = habitsResult.data || [];
  const logs = logsResult.data || [];
  
  const totalHabits = habits.length;
  const completedLogs = logs.filter(l => l.completed);
  
  // Calculate days in period
  const now = new Date();
  const daysDiff = Math.ceil((now.getTime() - since.getTime()) / (1000 * 60 * 60 * 24));
  const expected = totalHabits * daysDiff;
  
  // Calculate daily rates
  const dailyRates: number[] = [];
  for (let i = 0; i < daysDiff; i++) {
    const date = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const dayLogs = logs.filter(l => l.date === dateStr);
    const dayCompleted = dayLogs.filter(l => l.completed).length;
    dailyRates.push(totalHabits > 0 ? dayCompleted / totalHabits : 0);
  }

  return {
    completed: completedLogs.length,
    expected,
    total: totalHabits,
    dailyRates,
  };
}

// Fetch task statistics
async function fetchTaskStats(userId: string): Promise<TaskStats> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, status, due_date, estimate_min')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .is('archived_at', null);

  const allTasks = tasks || [];
  const completed = allTasks.filter(t => t.status === 'done');
  const pending = allTasks.filter(t => t.status !== 'done');
  const overdue = pending.filter(t => t.due_date && t.due_date < today);
  const dueToday = pending.filter(t => t.due_date === today);
  const dueTodayMinutes = dueToday.reduce((sum, t) => sum + (t.estimate_min || 30), 0);

  return {
    total: allTasks.length,
    completed: completed.length,
    pending: pending.length,
    overdue: overdue.length,
    due_today: dueToday.length,
    due_today_minutes: dueTodayMinutes,
  };
}

// Fetch today's score
async function fetchTodayScore(userId: string): Promise<TodayScore | null> {
  const today = new Date().toISOString().split('T')[0];
  
  const [habitsResult, logsResult] = await Promise.all([
    supabase
      .from('habits')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .is('deleted_at', null),
    supabase
      .from('habit_logs')
      .select('completed')
      .eq('user_id', userId)
      .eq('date', today)
  ]);

  const habits = habitsResult.data || [];
  const logs = logsResult.data || [];
  const completed = logs.filter(l => l.completed).length;

  return {
    habits_done: completed,
    habits_total: habits.length,
  };
}

// Fetch streak data
async function fetchStreak(userId: string): Promise<StreakData> {
  const { data: streaks } = await supabase
    .from('streaks')
    .select('current_streak, max_streak')
    .eq('user_id', userId)
    .order('current_streak', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    current: streaks?.current_streak || 0,
    max: streaks?.max_streak || 0,
  };
}

// Fetch last journal entry
async function fetchLastJournal(userId: string): Promise<JournalData | null> {
  const { data: journal } = await supabase
    .from('journal_entries')
    .select('mood, energy_level')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!journal) return null;

  // Simple sentiment estimation based on mood
  const moodValue = typeof journal.mood === 'number' ? journal.mood : 3;
  const sentiment = moodValue / 5; // Normalize to 0-1

  return {
    mood: moodValue,
    mood_trend: sentiment, // Simplified trend
    sentiment,
  };
}

// Fetch financial health
async function fetchFinanceHealth(userId: string): Promise<FinanceHealth> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data: transactions } = await supabase
    .from('finance_transactions')
    .select('amount, type')
    .eq('user_id', userId)
    .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

  if (!transactions || transactions.length === 0) {
    return { hasData: false, health: 0.5 };
  }

  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Health = savings rate capped at 0-1
  const savingsRate = income > 0 ? Math.max(0, (income - expenses) / income) : 0;
  
  return {
    hasData: true,
    health: Math.min(1, savingsRate + 0.3), // Base health + savings bonus
  };
}

// Calculate days since last activity
async function calculateDaysSinceLastActivity(userId: string): Promise<number> {
  const [tasksResult, habitsResult, journalResult] = await Promise.all([
    supabase
      .from('tasks')
      .select('updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('habit_logs')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('journal_entries')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const dates = [
    tasksResult.data?.updated_at,
    habitsResult.data?.created_at,
    journalResult.data?.created_at,
  ].filter(Boolean).map(d => new Date(d as string));

  if (dates.length === 0) return 30; // No activity found

  const lastActivity = new Date(Math.max(...dates.map(d => d.getTime())));
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

// Calculate variance of an array
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  
  // Normalize variance to 0-1 (assuming max reasonable variance is 0.25)
  return Math.min(1, variance / 0.25);
}

export async function buildContext(userId: string): Promise<UserContext> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Fetch parallèle pour performance
  const [
    habits7d,
    habits30d,
    tasks,
    todayScore,
    streak,
    lastJournal,
    finances,
    daysSinceActivity
  ] = await Promise.all([
    fetchHabitStats(userId, sevenDaysAgo),
    fetchHabitStats(userId, thirtyDaysAgo),
    fetchTaskStats(userId),
    fetchTodayScore(userId),
    fetchStreak(userId),
    fetchLastJournal(userId),
    fetchFinanceHealth(userId),
    calculateDaysSinceLastActivity(userId),
  ]);

  // Calcul des métriques
  const habitsRate7d = habits7d.completed / Math.max(habits7d.expected, 1);
  const habitsVariance = calculateVariance(habits30d.dailyRates);
  const taskOverdueRatio = tasks.overdue / Math.max(tasks.total, 1);
  
  // Calcul du risque de burnout
  const burnoutRisk = calculateBurnoutRisk({
    overloadIndex: tasks.due_today_minutes / 480, // 8h capacity
    streakPressure: streak.current > 14 ? 0.3 : 0,
    taskStress: taskOverdueRatio,
    moodTrend: lastJournal?.mood_trend || 0.5,
  });

  // Calcul du momentum
  const momentum = calculateMomentum(habits7d.dailyRates);

  // Qualité des données (combien de sources sont disponibles)
  const dataQuality = calculateDataQuality({
    hasHabits: habits7d.total > 0,
    hasTasks: tasks.total > 0,
    hasJournal: !!lastJournal,
    hasFinance: finances.hasData,
    hasStreak: streak.current > 0,
  });

  return {
    metrics: {
      habits_rate_7d: habitsRate7d,
      habits_variance_30d: habitsVariance,
      task_overdue_ratio: taskOverdueRatio,
      task_completion_rate: tasks.completed / Math.max(tasks.total, 1),
      journal_sentiment_avg: lastJournal?.sentiment || 0.5,
      burnout_risk: burnoutRisk,
      momentum_index: momentum,
      financial_health: finances.health,
    },
    temporal: {
      hour_of_day: now.getHours(),
      day_of_week: now.getDay(),
      is_weekend: now.getDay() === 0 || now.getDay() === 6,
      days_since_last_activity: daysSinceActivity,
    },
    current: {
      pending_tasks: tasks.pending,
      due_today: tasks.due_today,
      habits_done_today: todayScore?.habits_done || 0,
      habits_total_today: todayScore?.habits_total || 0,
      current_streak: streak.current,
      last_journal_mood: lastJournal?.mood || 3,
    },
    data_quality: dataQuality,
  };
}

// Normalise le contexte en vecteur numérique [0-1] pour le Policy Engine
export function contextToVector(ctx: UserContext): number[] {
  return [
    ctx.metrics.habits_rate_7d,
    ctx.metrics.habits_variance_30d,
    ctx.metrics.task_overdue_ratio,
    ctx.metrics.task_completion_rate,
    ctx.metrics.journal_sentiment_avg,
    ctx.metrics.burnout_risk,
    ctx.metrics.momentum_index,
    ctx.metrics.financial_health,
    ctx.temporal.hour_of_day / 24,
    ctx.temporal.day_of_week / 7,
    ctx.temporal.is_weekend ? 1 : 0,
    Math.min(ctx.temporal.days_since_last_activity / 7, 1),
    Math.min(ctx.current.pending_tasks / 20, 1),
    Math.min(ctx.current.due_today / 10, 1),
    ctx.current.habits_done_today / Math.max(ctx.current.habits_total_today, 1),
    Math.min(ctx.current.current_streak / 30, 1),
    ctx.current.last_journal_mood / 5,
    ctx.data_quality,
  ];
}

// Helper functions
function calculateBurnoutRisk(factors: {
  overloadIndex: number;
  streakPressure: number;
  taskStress: number;
  moodTrend: number;
}): number {
  const weights = {
    overload: 0.35,
    streak: 0.15,
    task: 0.25,
    mood: 0.25,
  };
  
  return Math.min(1, Math.max(0,
    factors.overloadIndex * weights.overload +
    factors.streakPressure * weights.streak +
    factors.taskStress * weights.task +
    (1 - factors.moodTrend) * weights.mood
  ));
}

function calculateMomentum(dailyRates: number[]): number {
  if (dailyRates.length < 3) return 0.5;
  
  const recent = dailyRates.slice(-3);
  const older = dailyRates.slice(0, -3);
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.length > 0 
    ? older.reduce((a, b) => a + b, 0) / older.length 
    : recentAvg;
  
  // Momentum = 0.5 stable, > 0.5 improving, < 0.5 declining
  return Math.min(1, Math.max(0, 0.5 + (recentAvg - olderAvg)));
}

function calculateDataQuality(sources: Record<string, boolean>): number {
  const total = Object.keys(sources).length;
  const available = Object.values(sources).filter(Boolean).length;
  return available / total;
}
