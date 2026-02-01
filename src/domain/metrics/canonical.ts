// src/domain/metrics/canonical.ts
// SINGLE SOURCE OF TRUTH — v35
// Utilisé par: UI, BI, Policy Engine, exports RGPD

import { supabase } from '@/integrations/supabase/client';

export interface CanonicalMetrics {
  // Identité
  userId: string;
  timestamp: Date;
  version: 'v35';
  
  // Métriques comportementales (normalisées 0-1)
  habits_rate_7d: number;
  habits_variance_30d: number;
  task_overdue_ratio: number;
  task_completion_rate: number;
  momentum_index: number;
  burnout_risk: number;
  journal_sentiment_avg: number;
  financial_health: number;
  
  // État instantané
  pending_tasks: number;
  due_today: number;
  habits_done_today: number;
  habits_total_today: number;
  current_streak: number;
  last_journal_mood: number;
  
  // Temporel
  hour_of_day: number;
  day_of_week: number;
  is_weekend: boolean;
  days_since_last_activity: number;
  
  // Qualité des données
  data_quality: number;
  sources_available: string[];
}

/**
 * Récupère les métriques canoniques pour un utilisateur
 * @param userId - ID de l'utilisateur (requis)
 * @returns CanonicalMetrics normalisées
 */
export async function getCanonicalMetrics(userId: string): Promise<CanonicalMetrics> {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Fetch en parallèle pour performance
  const [
    habitsResult,
    habitLogs7d,
    habitLogs30d,
    tasksResult,
    streakResult,
    journalResult,
    financeResult,
    lastActivityResult,
  ] = await Promise.all([
    // Habitudes actives
    supabase
      .from('habits')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .is('deleted_at', null),
    
    // Logs 7 jours
    supabase
      .from('habit_logs')
      .select('habit_id, date, completed')
      .eq('user_id', userId)
      .gte('date', sevenDaysAgo.toISOString().split('T')[0]),
    
    // Logs 30 jours
    supabase
      .from('habit_logs')
      .select('habit_id, date, completed')
      .eq('user_id', userId)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0]),
    
    // Tâches
    supabase
      .from('tasks')
      .select('id, status, due_date, estimate_min')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .is('archived_at', null),
    
    // Streak
    supabase
      .from('streaks')
      .select('current_streak, max_streak')
      .eq('user_id', userId)
      .order('current_streak', { ascending: false })
      .limit(1)
      .maybeSingle(),
    
    // Journal
    supabase
      .from('journal_entries')
      .select('mood, energy_level, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5),
    
    // Finance
    supabase
      .from('finance_transactions')
      .select('amount, type')
      .eq('user_id', userId)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0]),
    
    // Dernière activité
    supabase
      .from('audit_log')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  
  // Calculs
  const habits = habitsResult.data || [];
  const logs7d = habitLogs7d.data || [];
  const logs30d = habitLogs30d.data || [];
  const tasks = tasksResult.data || [];
  const journals = journalResult.data || [];
  const transactions = financeResult.data || [];
  
  const totalHabits = habits.length;
  const completed7d = logs7d.filter(l => l.completed).length;
  const expected7d = totalHabits * 7;
  const habitsRate7d = expected7d > 0 ? completed7d / expected7d : 0;
  
  // Variance 30 jours
  const dailyRates = calculateDailyRates(logs30d, totalHabits, 30);
  const habitsVariance = calculateVariance(dailyRates);
  
  // Tâches
  const tasksDone = tasks.filter(t => t.status === 'done').length;
  const tasksPending = tasks.filter(t => t.status !== 'done').length;
  const tasksOverdue = tasks.filter(t => {
    if (t.status === 'done') return false;
    if (!t.due_date) return false;
    return new Date(t.due_date) < now;
  }).length;
  const tasksDueToday = tasks.filter(t => t.due_date === today && t.status !== 'done').length;
  const dueTodayMinutes = tasks
    .filter(t => t.due_date === today && t.status !== 'done')
    .reduce((sum, t) => sum + (t.estimate_min || 30), 0);
  
  // Journal & Sentiment
  const lastJournal = journals[0];
  const moodAvg = journals.length > 0
    ? journals.reduce((sum, j) => sum + (typeof j.mood === 'number' ? j.mood : 3), 0) / journals.length
    : 3;
  const journalSentiment = moodAvg / 5;
  
  // Finance
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Math.abs(t.amount), 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
  const savingsRate = income > 0 ? Math.max(0, (income - expenses) / income) : 0;
  const financialHealth = Math.min(1, savingsRate + 0.3);
  
  // Burnout risk
  const overloadIndex = dueTodayMinutes / 480;
  const streakPressure = (streakResult.data?.current_streak || 0) > 14 ? 0.3 : 0;
  const taskStress = tasks.length > 0 ? tasksOverdue / tasks.length : 0;
  const burnoutRisk = Math.min(1, Math.max(0,
    overloadIndex * 0.35 +
    streakPressure * 0.15 +
    taskStress * 0.25 +
    (1 - journalSentiment) * 0.25
  ));
  
  // Momentum
  const momentum = calculateMomentum(dailyRates);
  
  // Days since last activity
  const lastActivity = lastActivityResult.data?.created_at;
  const daysSinceActivity = lastActivity
    ? Math.floor((now.getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
    : 30;
  
  // Data quality
  const sources: string[] = [];
  if (totalHabits > 0) sources.push('habits');
  if (tasks.length > 0) sources.push('tasks');
  if (journals.length > 0) sources.push('journal');
  if (transactions.length > 0) sources.push('finance');
  if (streakResult.data) sources.push('streak');
  const dataQuality = sources.length / 5;
  
  // Habits today
  const todayLogs = logs7d.filter(l => l.date === today);
  const habitsDoneToday = todayLogs.filter(l => l.completed).length;
  
  return {
    userId,
    timestamp: now,
    version: 'v35',
    
    habits_rate_7d: habitsRate7d,
    habits_variance_30d: habitsVariance,
    task_overdue_ratio: tasks.length > 0 ? tasksOverdue / tasks.length : 0,
    task_completion_rate: tasks.length > 0 ? tasksDone / tasks.length : 0,
    momentum_index: momentum,
    burnout_risk: burnoutRisk,
    journal_sentiment_avg: journalSentiment,
    financial_health: financialHealth,
    
    pending_tasks: tasksPending,
    due_today: tasksDueToday,
    habits_done_today: habitsDoneToday,
    habits_total_today: totalHabits,
    current_streak: streakResult.data?.current_streak || 0,
    last_journal_mood: typeof lastJournal?.mood === 'number' ? lastJournal.mood : 3,
    
    hour_of_day: now.getHours(),
    day_of_week: now.getDay(),
    is_weekend: now.getDay() === 0 || now.getDay() === 6,
    days_since_last_activity: daysSinceActivity,
    
    data_quality: dataQuality,
    sources_available: sources,
  };
}

/**
 * Convertit les métriques en vecteur numérique pour le Policy Engine
 */
export function metricsToVector(m: CanonicalMetrics): number[] {
  return [
    m.habits_rate_7d,
    m.habits_variance_30d,
    m.task_overdue_ratio,
    m.task_completion_rate,
    m.journal_sentiment_avg,
    m.burnout_risk,
    m.momentum_index,
    m.financial_health,
    m.hour_of_day / 24,
    m.day_of_week / 7,
    m.is_weekend ? 1 : 0,
    Math.min(m.days_since_last_activity / 7, 1),
    Math.min(m.pending_tasks / 20, 1),
    Math.min(m.due_today / 10, 1),
    m.habits_done_today / Math.max(m.habits_total_today, 1),
    Math.min(m.current_streak / 30, 1),
    m.last_journal_mood / 5,
    m.data_quality,
  ];
}

// === HELPERS ===

function calculateDailyRates(logs: any[], totalHabits: number, days: number): number[] {
  const rates: number[] = [];
  const now = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const dayLogs = logs.filter(l => l.date === dateStr);
    const completed = dayLogs.filter(l => l.completed).length;
    rates.push(totalHabits > 0 ? completed / totalHabits : 0);
  }
  
  return rates;
}

function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.min(1, variance / 0.25);
}

function calculateMomentum(dailyRates: number[]): number {
  if (dailyRates.length < 3) return 0.5;
  const recent = dailyRates.slice(0, 3);
  const older = dailyRates.slice(3, 7);
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg;
  return Math.min(1, Math.max(0, 0.5 + (recentAvg - olderAvg)));
}
