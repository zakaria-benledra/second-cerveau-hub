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
import { useSound } from '@/hooks/useSound';
import { useQuery } from '@tanstack/react-query';
import { fetchTodayStats } from '@/lib/api/stats';
import { Loader2, Sparkles, ChevronRight, Settings2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SoundSettings } from '@/components/sound/SoundSettings';

export default function TodayPage() {
  const navigate = useNavigate();
  const [showSoundSettings, setShowSoundSettings] = useState(false);
  
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
  const { play } = useSound();

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
    const activeTasks = tasks.filter(t => t.status !== 'done');
    const totalEstimate = activeTasks.reduce((sum, t) => sum + (t.estimate_min || 30), 0);
    const capacity = 480; // 8 hours
    return Math.min(100, Math.round((totalEstimate / capacity) * 100));
  }, [tasks]);

  // Get momentum from score data
  const momentum = useMemo(() => {
    if (!score) return 'stable';
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

    // Check for missed habits (only show uncompleted ones)
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

    return signals.slice(0, 3); // Max 3 signals
  }, [cognitiveLoad, habits, currentHour, financialStress]);

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

  // Handle task completion with sound
  const handleCompleteTask = (id: string) => {
    completeTask.mutate(id, {
      onSuccess: () => {
        play('task_done');
      }
    });
  };

  // Handle habit toggle with sound
  const handleToggleHabit = (id: string) => {
    toggleHabit.mutate(id, {
      onSuccess: () => {
        play('habit_done');
      }
    });
  };

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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header - Minimal */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight capitalize text-gradient">
              {formattedDate}
            </h1>
            <p className="text-muted-foreground mt-1">
              Centre de commande
            </p>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowSoundSettings(!showSoundSettings)}
            className="text-muted-foreground"
          >
            <Settings2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Sound Settings Popover */}
        {showSoundSettings && (
          <Card className="glass-strong animate-slide-in-from-top">
            <CardContent className="p-4">
              <SoundSettings />
            </CardContent>
          </Card>
        )}

        {/* SECTION 1: Global State Bar - Each KPI clickable */}
        <GlobalStateCard
          disciplineScore={score?.global_score ?? 65}
          energyLevel={energyLevel}
          financialStress={financialStress}
          cognitiveLoad={cognitiveLoad}
          momentum={momentum as 'up' | 'down' | 'stable'}
          onScoreClick={() => navigate('/history?metric=discipline&range=7')}
        />

        {/* SECTION 2: Next Best Action - Dominant Card */}
        {nextBestAction && nextBestAction.status !== 'done' && (
          <NextBestActionCard
            task={{
              id: nextBestAction.id,
              title: nextBestAction.title,
              description: nextBestAction.description || undefined,
              priority: nextBestAction.priority,
              estimateMin: nextBestAction.estimate_min || undefined,
              energyLevel: nextBestAction.energy_level || undefined,
              impactScore: 85,
            }}
            onStart={() => handleCompleteTask(nextBestAction.id)}
            isLoading={completeTask.isPending}
          />
        )}

        {/* SECTION 3: Focus Zone - Habits + Tasks (max 3 each) */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Critical Habits - Uncompleted only */}
          <CriticalHabitsCard
            habits={habitsForCard}
            onToggle={handleToggleHabit}
            isToggling={toggleHabit.isPending}
          />

          {/* Impact Tasks - Non-done only */}
          <ImpactTasksCard
            tasks={tasksForCard}
            onComplete={handleCompleteTask}
            isLoading={completeTask.isPending}
          />
        </div>

        {/* SECTION 4: Drift Signals - Compact alerts (max 3) */}
        {driftSignals.length > 0 && (
          <DriftSignalsCard signals={driftSignals} />
        )}

        {/* AI Insight Footer - Minimal */}
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

        {/* Quick Stats Footer - Clickable links to history */}
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <Link 
            to="/history?metric=habits&range=7" 
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <span className="font-semibold text-success">{completedHabitsCount}</span>
            habitudes complétées
          </Link>
          <span className="text-border">•</span>
          <Link 
            to="/history?metric=tasks&range=7"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <span className="font-semibold text-primary">{completedTasksCount}</span>
            tâches terminées
          </Link>
          {newInboxCount > 0 && (
            <>
              <span className="text-border">•</span>
              <Link 
                to="/inbox"
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                <span className="font-semibold text-warning">{newInboxCount}</span>
                dans l'inbox
              </Link>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
