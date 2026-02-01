import { useState, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { IdentitySnapshotCard, IdentityComparison, PrimaryActionCard } from '@/components/identity';
import { SageMessage } from '@/components/ai/SageMessage';
import { StreakBadge } from '@/components/gamification/StreakBadge';
import { CriticalHabitsCard } from '@/components/today/CriticalHabitsCard';
import { ImpactTasksCard } from '@/components/today/ImpactTasksCard';
import { DriftSignalsCard } from '@/components/today/DriftSignalsCard';
import { QuickStatsFooter } from '@/components/today/QuickStatsFooter';
import { AIEngineStatus, BehavioralMetricsBar } from '@/components/ai';
import { AnimatedContainer } from '@/components/ui/animated-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useTodayCommand } from '@/hooks/useTodayCommand';
import { useTodayScore, useScoreHistory } from '@/hooks/useScores';
import { useCurrentIdentity } from '@/hooks/useCurrentIdentity';
import { useCompleteTask } from '@/hooks/useTasks';
import { useToggleHabitLog } from '@/hooks/useHabits';
import { useSound } from '@/hooks/useSound';
import { useConfetti } from '@/hooks/useConfetti';
import { useActiveInterventions } from '@/hooks/useAIInterventions';
import { useStreak } from '@/hooks/useStreak';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useHaptic } from '@/hooks/useHaptic';
import { 
  Loader2, 
  Brain, 
  ChevronDown,
  TrendingUp,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function IdentityDetailsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [trajectoryOpen, setTrajectoryOpen] = useState(true);
  const [evolutionOpen, setEvolutionOpen] = useState(false);
  
  // Pull-to-refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullStart, setPullStart] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  
  // Core data hooks
  const {
    isLoading,
    nextBestAction,
    disciplineScore,
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
  } = useTodayCommand();
  
  const { data: todayScore } = useTodayScore();
  const { data: scoreHistory } = useScoreHistory(7);
  const { data: identity } = useCurrentIdentity();
  const { data: activeInterventions } = useActiveInterventions();
  const { data: streakData } = useStreak();
  const { data: profile } = useUserProfile();
  const firstName = profile?.first_name || 'toi';
  
  const completeTask = useCompleteTask();
  const toggleHabit = useToggleHabitLog();
  const { play } = useSound();
  const { fire: fireConfetti } = useConfetti();
  const { vibrate } = useHaptic();

  // Race condition prevention
  const completingTaskRef = useRef<string | null>(null);
  const togglingHabitRef = useRef<string | null>(null);

  const today = new Date();
  const formattedDate = format(today, "EEEE d MMMM", { locale: fr });

  // Pull-to-refresh handlers
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['today-command'] }),
      queryClient.invalidateQueries({ queryKey: ['today-score'] }),
      queryClient.invalidateQueries({ queryKey: ['user-streak'] }),
    ]);
    setIsRefreshing(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setPullStart(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (pullStart > 0) {
      const distance = e.touches[0].clientY - pullStart;
      if (distance > 0 && distance < 150) {
        setPullDistance(distance);
      }
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 80) {
      handleRefresh();
    }
    setPullStart(0);
    setPullDistance(0);
  };

  // Calculate momentum direction
  const momentumDirection = todayScore?.momentum_index 
    ? (todayScore.momentum_index > 0.05 ? 'up' : todayScore.momentum_index < -0.05 ? 'down' : 'stable')
    : momentum;

  // Handlers
  const handleCompleteTask = useCallback((id: string) => {
    if (completingTaskRef.current === id || completeTask.isPending) return;
    completingTaskRef.current = id;
    
    completeTask.mutate(id, {
      onSuccess: () => {
        play('task_done');
        fireConfetti('success');
        vibrate('success');
        completingTaskRef.current = null;
        
        // Si c'était la dernière tâche
        const remainingTasks = tasksForCard?.filter(t => t.id !== id && t.status !== 'done');
        if (remainingTasks?.length === 0) {
          setTimeout(() => fireConfetti('allDone'), 500);
        }
      },
      onError: () => {
        completingTaskRef.current = null;
      }
    });
  }, [completeTask, play, fireConfetti, tasksForCard]);

  const handleToggleHabit = useCallback((id: string) => {
    if (togglingHabitRef.current === id || toggleHabit.isPending) return;
    togglingHabitRef.current = id;
    
    toggleHabit.mutate(id, {
      onSuccess: () => {
        play('habit_done');
        fireConfetti('success');
        vibrate('success');
        togglingHabitRef.current = null;
        
        // Si toutes les habitudes sont faites
        const allDone = habitsForCard?.every(h => h.completed || h.id === id);
        if (allDone) {
          setTimeout(() => fireConfetti('allDone'), 500);
        }
      },
      onError: () => {
        togglingHabitRef.current = null;
      }
    });
  }, [toggleHabit, play, fireConfetti, habitsForCard]);

  // Dynamic greeting message based on time and score
  const getGreetingMessage = () => {
    const hour = new Date().getHours();
    const score = todayScore?.global_score || 50;
    
    if (hour < 12) {
      if (score >= 70) return "Prêt à conquérir cette journée ? 💪";
      return "Une nouvelle journée commence !";
    } else if (hour < 18) {
      if (score >= 70) return "Tu gères bien aujourd'hui !";
      return "L'après-midi est à toi";
    } else {
      if (score >= 70) return "Belle journée, bravo ! 🌟";
      return "Bientôt l'heure de se reposer";
    }
  };

  // Loading state
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
              Chargement de votre identité...
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div 
        className="max-w-4xl mx-auto space-y-6 pb-8"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull-to-refresh indicator */}
        {(pullDistance > 0 || isRefreshing) && (
          <div 
            className="flex justify-center py-2 transition-all"
            style={{ 
              height: isRefreshing ? 40 : pullDistance, 
              opacity: isRefreshing ? 1 : pullDistance / 80 
            }}
          >
            <Loader2 className={cn(
              "h-6 w-6 text-primary",
              (pullDistance > 80 || isRefreshing) && "animate-spin"
            )} />
          </div>
        )}
        
        {/* Header */}
        <AnimatedContainer delay={0} animation="fade-up">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  Bonjour {firstName} 👋
                </h1>
                {streakData && streakData.currentStreak > 0 && (
                  <StreakBadge days={streakData.currentStreak} />
                )}
              </div>
              <p className="text-muted-foreground mt-1 capitalize">
                {formattedDate} — {getGreetingMessage()}
              </p>
            </div>
            <AIEngineStatus 
              isActive={!!todayScore}
              isLoading={!todayScore}
              lastUpdate={todayScore?.date}
              signalsCount={driftSignals.length}
            />
          </div>
        </AnimatedContainer>

        {/* Active Interventions Alert */}
        {activeInterventions && activeInterventions.length > 0 && (
          <AnimatedContainer delay={25} animation="fade-up">
            <Alert 
              variant={activeInterventions[0].severity === 'critical' ? 'destructive' : 'default'}
              className="border-2"
            >
              <Brain className="h-5 w-5" />
              <AlertTitle className="flex items-center gap-2">
                Intervention IA Active
                <Badge variant="outline">{activeInterventions[0].severity}</Badge>
              </AlertTitle>
              <AlertDescription>
                <p className="mt-2">{activeInterventions[0].reason || activeInterventions[0].ai_message}</p>
                <Button 
                  variant="link" 
                  className="px-0 mt-2"
                  onClick={() => navigate('/ai-interventions')}
                >
                  Voir détails et historique →
                </Button>
              </AlertDescription>
            </Alert>
          </AnimatedContainer>
        )}

        {/* Identity Snapshot - Unified metrics */}
        <AnimatedContainer delay={50} animation="fade-up">
          <IdentitySnapshotCard
            globalScore={todayScore?.global_score || disciplineScore}
            habitsScore={todayScore?.habits_score || 0}
            consistencyLevel={identity?.consistencyLevel || todayScore?.habits_score || 0}
            energyLevel={energyLevel}
            resilienceLevel={identity?.stabilityLevel || 50}
            financialStress={financialStress}
            cognitiveLoad={cognitiveLoad}
            momentum={momentumDirection as 'up' | 'down' | 'stable'}
          />
        </AnimatedContainer>

        {/* Behavioral Metrics Bar */}
        <AnimatedContainer delay={75} animation="fade-up">
          <BehavioralMetricsBar 
            coherence={todayScore?.habits_score ?? 0}
            momentum={todayScore?.global_score ? (todayScore.global_score / 2) + 25 : 50}
            friction={cognitiveLoad}
            burnout={financialStress}
          />
        </AnimatedContainer>

        {/* AI Coach */}
        <AnimatedContainer delay={100} animation="fade-up">
          <SageMessage 
            context={{
              score: todayScore?.global_score || disciplineScore,
              tasksLeft: tasksForCard?.filter(t => t.status !== 'done').length || 0,
            }}
            onActionClick={nextBestAction ? () => handleCompleteTask(nextBestAction.id) : undefined}
            actionLabel={nextBestAction ? "Commencer" : undefined}
          />
        </AnimatedContainer>

        {/* Primary Action */}
        <AnimatedContainer delay={125} animation="fade-up">
          <PrimaryActionCard
            action={nextBestAction && nextBestAction.status !== 'done' ? nextBestAction : null}
            onStart={() => nextBestAction && handleCompleteTask(nextBestAction.id)}
            isLoading={completeTask.isPending}
            disabled={completeTask.isPending || completingTaskRef.current === nextBestAction?.id}
          />
        </AnimatedContainer>

        {/* Drift Signals */}
        {driftSignals.length > 0 && (
          <AnimatedContainer delay={150} animation="fade-up">
            <DriftSignalsCard signals={driftSignals} />
          </AnimatedContainer>
        )}

        {/* Focus Zone - Habits + Tasks */}
        <div className="grid gap-6 md:grid-cols-2">
          <AnimatedContainer delay={175} animation="fade-up">
            <CriticalHabitsCard
              habits={habitsForCard}
              onToggle={handleToggleHabit}
              isToggling={toggleHabit.isPending}
            />
          </AnimatedContainer>

          <AnimatedContainer delay={200} animation="fade-up">
            <ImpactTasksCard
              tasks={tasksForCard}
              onComplete={handleCompleteTask}
              isLoading={completeTask.isPending}
            />
          </AnimatedContainer>
        </div>

        {/* Trajectory - Collapsible */}
        <AnimatedContainer delay={225} animation="fade-up">
          <Collapsible open={trajectoryOpen} onOpenChange={setTrajectoryOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Trajectoire 7 jours
                    </span>
                    <ChevronDown className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      trajectoryOpen && "rotate-180"
                    )} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground text-center">
                    {momentumDirection === 'up' && '🔺 Tes efforts portent leurs fruits. Continue ainsi !'}
                    {momentumDirection === 'down' && '🔻 Un moment de transition. Reviens aux fondamentaux.'}
                    {momentumDirection === 'stable' && '➖ Maintiens le cap. La cohérence est ta force.'}
                  </p>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </AnimatedContainer>

        {/* Evolution 30j - Collapsible */}
        <AnimatedContainer delay={250} animation="fade-up">
          <Collapsible open={evolutionOpen} onOpenChange={setEvolutionOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                      🔄 Évolution 30 jours
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">Comparaison</Badge>
                      <ChevronDown className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        evolutionOpen && "rotate-180"
                      )} />
                    </div>
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <IdentityComparison daysAgo={30} />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </AnimatedContainer>

        {/* Footer Stats */}
        <AnimatedContainer delay={275} animation="fade">
          <QuickStatsFooter
            completedHabitsCount={completedHabitsCount}
            completedTasksCount={completedTasksCount}
            newInboxCount={newInboxCount}
          />
        </AnimatedContainer>
      </div>
    </AppLayout>
  );
}
