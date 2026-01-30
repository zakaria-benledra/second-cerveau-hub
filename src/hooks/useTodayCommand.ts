import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTodayTasks, useNextBestAction } from '@/hooks/useTasks';
import { useHabitsWithLogs } from '@/hooks/useHabits';
import { useInboxItems } from '@/hooks/useInbox';
import { useTodayScore } from '@/hooks/useScores';
import { useAICoach } from '@/hooks/useAICoach';
import { fetchTodayStats } from '@/lib/api/stats';
import { supabase } from '@/integrations/supabase/client';

export interface DriftSignal {
  id: string;
  type: 'warning' | 'danger' | 'info';
  category: 'habit' | 'task' | 'finance' | 'energy' | 'overload' | 'streak';
  title: string;
  description: string;
  source: 'computed' | 'ai';
  action?: { label: string; path: string };
}

export interface CommandCenterState {
  // Loading states
  isLoading: boolean;
  
  // Core data
  tasks: any[];
  habits: any[];
  nextBestAction: any;
  
  // Scores & metrics
  disciplineScore: number;
  momentum: 'up' | 'down' | 'stable';
  energyLevel: 'low' | 'medium' | 'high';
  financialStress: number;
  cognitiveLoad: number;
  
  // Drift signals
  driftSignals: DriftSignal[];
  
  // Stats
  completedHabitsCount: number;
  completedTasksCount: number;
  newInboxCount: number;
  
  // Prepared data for cards
  habitsForCard: Array<{
    id: string;
    name: string;
    icon?: string;
    completed: boolean;
    streak?: number;
  }>;
  tasksForCard: Array<{
    id: string;
    title: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'todo' | 'in_progress' | 'done' | 'cancelled';
    estimateMin?: number;
  }>;
  
  // AI Insight
  aiInsight?: string;
}

// Fetch real financial data for stress calculation
async function fetchFinancialStress(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  // Get this month's transactions
  const { data: transactions } = await supabase
    .from('finance_transactions')
    .select('amount, type')
    .gte('date', startOfMonth.toISOString().split('T')[0])
    .eq('type', 'expense');
  
  // Get budgets
  const { data: budgets } = await supabase
    .from('budgets')
    .select('monthly_limit');
  
  const totalExpenses = transactions?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;
  const totalBudget = budgets?.reduce((sum, b) => sum + b.monthly_limit, 0) || 5000;
  
  // Days elapsed this month
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const dayOfMonth = today.getDate();
  const expectedSpend = (dayOfMonth / daysInMonth) * totalBudget;
  
  // Financial stress = how much over expected spending
  const stressRatio = totalBudget > 0 ? (totalExpenses / expectedSpend) * 50 : 0;
  return Math.min(100, Math.round(stressRatio));
}

export function useTodayCommand(): CommandCenterState {
  const { data: tasks, isLoading: loadingTasks } = useTodayTasks();
  const { data: nextBestAction } = useNextBestAction();
  const { data: habits, isLoading: loadingHabits } = useHabitsWithLogs();
  const { data: inboxItems } = useInboxItems();
  const { data: stats } = useQuery({
    queryKey: ['stats', 'today'],
    queryFn: fetchTodayStats,
  });
  const { data: score } = useTodayScore();
  const { briefing } = useAICoach();
  
  // Real financial stress from transactions
  const { data: financialStress = 35 } = useQuery({
    queryKey: ['financial-stress'],
    queryFn: fetchFinancialStress,
    staleTime: 5 * 60 * 1000,
  });
  
  const currentHour = new Date().getHours();

  // Calculate energy level based on time and user patterns
  const energyLevel = useMemo((): 'low' | 'medium' | 'high' => {
    if (currentHour >= 9 && currentHour <= 11) return 'high';
    if (currentHour >= 14 && currentHour <= 16) return 'low';
    return 'medium';
  }, [currentHour]);

  // Calculate cognitive load from today's tasks
  const cognitiveLoad = useMemo(() => {
    if (!tasks) return 50;
    const activeTasks = tasks.filter(t => t.status !== 'done');
    const totalEstimate = activeTasks.reduce((sum, t) => sum + (t.estimate_min || 30), 0);
    const capacity = 480; // 8 hours
    return Math.min(100, Math.round((totalEstimate / capacity) * 100));
  }, [tasks]);

  // Get momentum from score data
  const momentum = useMemo((): 'up' | 'down' | 'stable' => {
    if (!score) return 'stable';
    return score.momentum_index > 0.05 ? 'up' : score.momentum_index < -0.05 ? 'down' : 'stable';
  }, [score]);

  // Generate drift signals (computed + AI-based)
  const driftSignals = useMemo((): DriftSignal[] => {
    const signals: DriftSignal[] = [];

    // COMPUTED SIGNALS
    
    // 1. Check for overload
    if (cognitiveLoad > 80) {
      signals.push({
        id: 'overload',
        type: 'danger',
        category: 'overload',
        title: 'Charge excessive',
        description: `${cognitiveLoad}% de votre capacité planifiée. Risque d'épuisement.`,
        source: 'computed',
        action: { label: 'Reprioritiser', path: '/tasks' },
      });
    }

    // 2. Check for missed habits
    const activeHabits = habits?.filter(h => h.is_active) || [];
    const missedHabits = activeHabits.filter(h => !h.todayLog?.completed);
    if (missedHabits.length > 2 && currentHour >= 18) {
      signals.push({
        id: 'habits-missed',
        type: 'warning',
        category: 'habit',
        title: `${missedHabits.length} habitudes en attente`,
        description: 'La journée avance et des habitudes clés restent à faire.',
        source: 'computed',
        action: { label: 'Compléter', path: '/habits' },
      });
    }

    // 3. Check for broken streaks (habits with good streaks that might break)
    const atRiskStreaks = activeHabits.filter(h => {
      const streak = h.streak?.current_streak || 0;
      const completed = h.todayLog?.completed;
      return streak >= 7 && !completed && currentHour >= 20;
    });
    if (atRiskStreaks.length > 0) {
      signals.push({
        id: 'streak-risk',
        type: 'danger',
        category: 'streak',
        title: `Série de ${atRiskStreaks[0].streak?.current_streak}j en danger`,
        description: `"${atRiskStreaks[0].name}" risque de perdre sa série.`,
        source: 'computed',
        action: { label: 'Sauver la série', path: '/habits' },
      });
    }

    // 4. Check for budget
    if (financialStress > 60) {
      signals.push({
        id: 'budget',
        type: 'warning',
        category: 'finance',
        title: 'Budget sous pression',
        description: `Dépenses à ${financialStress}% de votre rythme attendu ce mois.`,
        source: 'computed',
        action: { label: 'Analyser', path: '/finance' },
      });
    }

    // 5. Overdue tasks
    const overdueTasks = tasks?.filter(t => {
      if (!t.due_date || t.status === 'done') return false;
      return new Date(t.due_date) < new Date();
    }) || [];
    if (overdueTasks.length > 0) {
      signals.push({
        id: 'overdue-tasks',
        type: 'danger',
        category: 'task',
        title: `${overdueTasks.length} tâche(s) en retard`,
        description: 'Des tâches ont dépassé leur échéance.',
        source: 'computed',
        action: { label: 'Traiter', path: '/tasks' },
      });
    }

    // AI-BASED SIGNALS (from briefing)
    if (briefing?.risks) {
      briefing.risks.slice(0, 2).forEach((risk, i) => {
        signals.push({
          id: `ai-risk-${i}`,
          type: risk.level === 'critical' ? 'danger' : 'warning',
          category: 'energy',
          title: risk.message.slice(0, 40),
          description: risk.message,
          source: 'ai',
        });
      });
    }

    // Sort: danger first, then warning, then info
    const typeOrder = { danger: 0, warning: 1, info: 2 };
    return signals
      .sort((a, b) => typeOrder[a.type] - typeOrder[b.type])
      .slice(0, 4);
  }, [cognitiveLoad, habits, currentHour, financialStress, tasks, briefing]);

  // Prepare habits for the card - ONLY SHOW UNCOMPLETED (max 3)
  const habitsForCard = useMemo(() => {
    return (habits?.filter(h => h.is_active && !h.todayLog?.completed) || [])
      .slice(0, 3)
      .map(h => ({
        id: h.id,
        name: h.name,
        icon: h.icon,
        completed: false,
        streak: h.streak?.current_streak,
      }));
  }, [habits]);

  // Prepare tasks for the card - ONLY SHOW NON-DONE (max 3)
  const tasksForCard = useMemo(() => {
    return (tasks || [])
      .filter(t => t.status !== 'done' && t.status !== 'cancelled')
      .slice(0, 3)
      .map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        status: t.status as 'todo' | 'in_progress' | 'done' | 'cancelled',
        estimateMin: t.estimate_min,
      }));
  }, [tasks]);

  // Stats for clickable KPIs
  const completedHabitsCount = habits?.filter(h => h.is_active && h.todayLog?.completed).length || 0;
  const completedTasksCount = tasks?.filter(t => t.status === 'done').length || 0;
  const newInboxCount = inboxItems?.filter(i => i.status === 'new').length || 0;

  // AI Insight
  const aiInsight = useMemo(() => {
    if (briefing?.recommendations?.[0]) {
      return briefing.recommendations[0].message;
    }
    // Fallback insight
    if (energyLevel === 'high') {
      return 'Profitez de votre pic d\'énergie matinal pour les tâches complexes.';
    }
    if (cognitiveLoad > 70) {
      return 'Charge élevée détectée. Envisagez de reporter les tâches non urgentes.';
    }
    return 'Basé sur vos 7 derniers jours : maintenez votre rythme actuel.';
  }, [briefing, energyLevel, cognitiveLoad]);

  return {
    isLoading: loadingTasks || loadingHabits,
    tasks: tasks || [],
    habits: habits || [],
    nextBestAction,
    disciplineScore: score?.global_score ?? briefing?.summary?.global_score ?? 65,
    momentum,
    energyLevel,
    financialStress,
    cognitiveLoad,
    driftSignals,
    completedHabitsCount,
    completedTasksCount,
    newInboxCount,
    habitsForCard,
    tasksForCard,
    aiInsight,
  };
}
