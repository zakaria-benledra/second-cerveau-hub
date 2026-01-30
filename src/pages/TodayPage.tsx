import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { GlobalStateCard } from '@/components/today/GlobalStateCard';
import { NextBestActionCard } from '@/components/today/NextBestActionCard';
import { CriticalHabitsCard } from '@/components/today/CriticalHabitsCard';
import { ImpactTasksCard } from '@/components/today/ImpactTasksCard';
import { DriftSignalsCard } from '@/components/today/DriftSignalsCard';
import { 
  useTodayTasks, 
  useCompleteTask, 
  useNextBestAction 
} from '@/hooks/useTasks';
import { useHabitsWithLogs, useToggleHabitLog } from '@/hooks/useHabits';
import { useInboxItems } from '@/hooks/useInbox';
import { useTodayScore } from '@/hooks/useScores';
import { useQuery } from '@tanstack/react-query';
import { fetchTodayStats } from '@/lib/api/stats';
import { Loader2, Calendar, Inbox, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function TodayPage() {
  const navigate = useNavigate();
  const { data: tasks, isLoading: loadingTasks } = useTodayTasks();
  const { data: nextBestAction } = useNextBestAction();
  const { data: habits, isLoading: loadingHabits } = useHabitsWithLogs();
  const { data: inboxItems } = useInboxItems();
  const { data: stats } = useQuery({
    queryKey: ['stats', 'today'],
    queryFn: fetchTodayStats,
  });
  const { data: score } = useTodayScore();
  
  const completeTask = useCompleteTask();
  const toggleHabit = useToggleHabitLog();

  const today = new Date();
  const formattedDate = format(today, "EEEE d MMMM", { locale: fr });
  const currentHour = today.getHours();

  // Calculate energy level based on time and user patterns
  const energyLevel = useMemo(() => {
    if (currentHour >= 9 && currentHour <= 11) return 'high';
    if (currentHour >= 14 && currentHour <= 16) return 'low';
    return 'medium';
  }, [currentHour]);

  // Calculate financial stress (mock - would come from budget analysis)
  const financialStress = 35;

  // Calculate cognitive load from today's tasks
  const cognitiveLoad = useMemo(() => {
    if (!tasks) return 50;
    const totalEstimate = tasks.reduce((sum, t) => sum + (t.estimate_min || 30), 0);
    const capacity = 480; // 8 hours
    return Math.min(100, Math.round((totalEstimate / capacity) * 100));
  }, [tasks]);

  // Get momentum from score data
  const momentum = useMemo(() => {
    if (!score) return 'stable';
    // Would compare with previous day
    return score.momentum_index > 0.05 ? 'up' : score.momentum_index < -0.05 ? 'down' : 'stable';
  }, [score]);

  // Generate drift signals
  const driftSignals = useMemo(() => {
    const signals: Array<{
      id: string;
      type: 'warning' | 'danger' | 'info';
      category: 'habit' | 'task' | 'finance' | 'energy' | 'overload';
      title: string;
      description: string;
      action?: { label: string; path: string };
    }> = [];

    // Check for overload
    if (cognitiveLoad > 80) {
      signals.push({
        id: 'overload',
        type: 'danger',
        category: 'overload',
        title: 'Charge excessive',
        description: `${cognitiveLoad}% de votre capacité planifiée. Risque d'épuisement.`,
        action: { label: 'Reprioritiser', path: '/tasks' },
      });
    }

    // Check for missed habits (mock)
    const activeHabits = habits?.filter(h => h.is_active) || [];
    const missedHabits = activeHabits.filter(h => !h.todayLog?.completed);
    if (missedHabits.length > 2 && currentHour >= 18) {
      signals.push({
        id: 'habits-missed',
        type: 'warning',
        category: 'habit',
        title: `${missedHabits.length} habitudes en attente`,
        description: 'La journée avance et des habitudes clés restent à faire.',
        action: { label: 'Compléter', path: '/habits' },
      });
    }

    // Check for budget (mock)
    if (financialStress > 50) {
      signals.push({
        id: 'budget',
        type: 'warning',
        category: 'finance',
        title: 'Budget sous pression',
        description: 'Vous approchez de la limite de votre budget mensuel.',
        action: { label: 'Analyser', path: '/finance' },
      });
    }

    return signals;
  }, [cognitiveLoad, habits, currentHour, financialStress]);

  // Prepare habits for the card
  const habitsForCard = useMemo(() => {
    return (habits?.filter(h => h.is_active) || []).map(h => ({
      id: h.id,
      name: h.name,
      icon: h.icon,
      completed: h.todayLog?.completed || false,
      streak: h.streak?.current_streak,
    }));
  }, [habits]);

  // Prepare tasks for the card
  const tasksForCard = useMemo(() => {
    return (tasks || [])
      .filter(t => t.status !== 'cancelled')
      .map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        status: t.status as 'todo' | 'in_progress' | 'done' | 'cancelled',
        estimateMin: t.estimate_min,
      }));
  }, [tasks]);

  const newInboxCount = inboxItems?.filter(i => i.status === 'new').length || 0;

  const isLoading = loadingTasks || loadingHabits;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full gradient-primary animate-pulse opacity-20" />
              <Loader2 className="h-8 w-8 animate-spin text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-sm text-muted-foreground animate-pulse">
              Chargement de votre journée...
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight capitalize text-gradient">
              {formattedDate}
            </h1>
            <p className="text-muted-foreground mt-1">
              Votre centre de commande comportemental
            </p>
          </div>
          
          {/* Quick access pills */}
          <div className="flex gap-2">
            <Link 
              to="/calendar"
              className="glass-hover px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Calendar className="h-4 w-4" />
              Calendrier
            </Link>
            <Link 
              to="/inbox"
              className={cn(
                "glass-hover px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition-colors",
                newInboxCount > 0 ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Inbox className="h-4 w-4" />
              Inbox
              {newInboxCount > 0 && (
                <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                  {newInboxCount}
                </Badge>
              )}
            </Link>
          </div>
        </div>

        {/* Global State Card */}
        <GlobalStateCard
          disciplineScore={score?.global_score ?? 65}
          energyLevel={energyLevel}
          financialStress={financialStress}
          cognitiveLoad={cognitiveLoad}
          momentum={momentum as 'up' | 'down' | 'stable'}
          onScoreClick={() => navigate('/scores')}
        />

        {/* Next Best Action */}
        {nextBestAction && nextBestAction.status === 'todo' && (
          <NextBestActionCard
            task={{
              id: nextBestAction.id,
              title: nextBestAction.title,
              description: nextBestAction.description || undefined,
              priority: nextBestAction.priority,
              estimateMin: nextBestAction.estimate_min || undefined,
              energyLevel: nextBestAction.energy_level || undefined,
              impactScore: 85, // Mock - would come from scoring
            }}
            onStart={() => completeTask.mutate(nextBestAction.id)}
            isLoading={completeTask.isPending}
          />
        )}

        {/* Three Column Layout */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Critical Habits */}
          <CriticalHabitsCard
            habits={habitsForCard}
            onToggle={(id) => toggleHabit.mutate(id)}
            isToggling={toggleHabit.isPending}
          />

          {/* Impact Tasks */}
          <ImpactTasksCard
            tasks={tasksForCard}
            onComplete={(id) => completeTask.mutate(id)}
            isLoading={completeTask.isPending}
          />

          {/* Drift Signals */}
          <DriftSignalsCard signals={driftSignals} />
        </div>

        {/* AI Insight Footer */}
        <Card className="glass-subtle border-primary/10 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                  AI
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Insight du jour
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Basé sur vos 7 derniers jours : votre productivité est 23% plus élevée le matin.
                  </p>
                </div>
              </div>
              <Link 
                to="/ai-coach"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Voir plus
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
