import { useState, useRef, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { IdentitySnapshotCard, IdentityComparison, PrimaryActionCard } from '@/components/identity';
import { AICoachCard } from '@/components/today/AICoachCard';
import { CriticalHabitsCard } from '@/components/today/CriticalHabitsCard';
import { ImpactTasksCard } from '@/components/today/ImpactTasksCard';
import { DriftSignalsCard } from '@/components/today/DriftSignalsCard';
import { QuickStatsFooter } from '@/components/today/QuickStatsFooter';
import { AIEngineStatus } from '@/components/ai';
import { AnimatedContainer } from '@/components/ui/animated-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTodayCommand } from '@/hooks/useTodayCommand';
import { useTodayScore, useScoreHistory } from '@/hooks/useScores';
import { useCurrentIdentity } from '@/hooks/useCurrentIdentity';
import { useCompleteTask } from '@/hooks/useTasks';
import { useToggleHabitLog } from '@/hooks/useHabits';
import { useSound } from '@/hooks/useSound';
import { useActiveInterventions } from '@/hooks/useAIInterventions';
import { 
  Loader2, 
  Brain, 
  Zap, 
  BarChart3, 
  Target, 
  Activity,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function IdentityPage() {
  const navigate = useNavigate();
  
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
  
  const completeTask = useCompleteTask();
  const toggleHabit = useToggleHabitLog();
  const { play } = useSound();

  // Race condition prevention
  const completingTaskRef = useRef<string | null>(null);
  const togglingHabitRef = useRef<string | null>(null);

  const today = new Date();
  const formattedDate = format(today, "EEEE d MMMM", { locale: fr });

  // Calculate momentum direction
  const momentumDirection = todayScore?.momentum_index 
    ? (todayScore.momentum_index > 55 ? 'up' : todayScore.momentum_index < 45 ? 'down' : 'stable')
    : 'stable';

  // Handlers
  const handleCompleteTask = useCallback((id: string) => {
    if (completingTaskRef.current === id || completeTask.isPending) return;
    completingTaskRef.current = id;
    
    completeTask.mutate(id, {
      onSuccess: () => {
        play('task_done');
        completingTaskRef.current = null;
      },
      onError: () => {
        completingTaskRef.current = null;
      }
    });
  }, [completeTask, play]);

  const handleToggleHabit = useCallback((id: string) => {
    if (togglingHabitRef.current === id || toggleHabit.isPending) return;
    togglingHabitRef.current = id;
    
    toggleHabit.mutate(id, {
      onSuccess: () => {
        play('habit_done');
        togglingHabitRef.current = null;
      },
      onError: () => {
        togglingHabitRef.current = null;
      }
    });
  }, [toggleHabit, play]);

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
      <div className="max-w-4xl mx-auto space-y-6 pb-8">
        {/* Header */}
        <AnimatedContainer delay={0} animation="fade-up">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight capitalize text-gradient">
                {formattedDate}
              </h1>
              <p className="text-muted-foreground mt-1">
                Qui je deviens aujourd'hui
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

        {/* Identity Snapshot - Score central + métriques */}
        <AnimatedContainer delay={50} animation="fade-up">
          <IdentitySnapshotCard
            globalScore={todayScore?.global_score || disciplineScore}
            momentum={momentumDirection as 'up' | 'down' | 'stable'}
            burnout={todayScore?.burnout_index || financialStress}
            friction={cognitiveLoad}
            habitsScore={todayScore?.habits_score || 0}
            tasksScore={todayScore?.tasks_score || 0}
          />
        </AnimatedContainer>

        {/* AI Coach Intervention */}
        <AnimatedContainer delay={100} animation="fade-up">
          <AICoachCard />
        </AnimatedContainer>

        {/* Primary Action */}
        <AnimatedContainer delay={150} animation="fade-up">
          <PrimaryActionCard
            action={nextBestAction && nextBestAction.status !== 'done' ? nextBestAction : null}
            onStart={() => nextBestAction && handleCompleteTask(nextBestAction.id)}
            isLoading={completeTask.isPending}
            disabled={completeTask.isPending || completingTaskRef.current === nextBestAction?.id}
          />
        </AnimatedContainer>

        {/* Drift Signals */}
        {driftSignals.length > 0 && (
          <AnimatedContainer delay={175} animation="fade-up">
            <DriftSignalsCard signals={driftSignals} />
          </AnimatedContainer>
        )}

        {/* Habits + Tasks Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          <AnimatedContainer delay={200} animation="fade-up">
            <CriticalHabitsCard
              habits={habitsForCard}
              onToggle={handleToggleHabit}
              isToggling={toggleHabit.isPending}
            />
          </AnimatedContainer>
          <AnimatedContainer delay={225} animation="fade-up">
            <ImpactTasksCard
              tasks={tasksForCard}
              onComplete={handleCompleteTask}
              isLoading={completeTask.isPending}
            />
          </AnimatedContainer>
        </div>

        {/* Shaping Behaviors */}
        {identity?.shapingBehaviors && identity.shapingBehaviors.length > 0 && (
          <AnimatedContainer delay={250} animation="fade-up">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5 text-primary" />
                  Ce qui te façonne
                  <Badge variant="outline" className="ml-2 text-xs">Live</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {identity.shapingBehaviors.slice(0, 3).map((behavior) => (
                  <div key={behavior.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="text-2xl">{behavior.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{behavior.title}</span>
                        <span className="text-xs text-muted-foreground">{behavior.completion}%</span>
                      </div>
                      <Progress value={behavior.completion} className="h-1.5" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </AnimatedContainer>
        )}

        {/* Evolution 30j */}
        <AnimatedContainer delay={275} animation="fade-up">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  🔄 Évolution 30 jours
                </span>
                <Badge variant="secondary" className="text-xs">Comparaison</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <IdentityComparison daysAgo={30} />
            </CardContent>
          </Card>
        </AnimatedContainer>

        {/* Quick Actions */}
        <AnimatedContainer delay={300} animation="fade-up">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-4 w-4 text-primary" />
                Actions Rapides
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button 
                  variant="outline" 
                  className="justify-start h-auto py-3 px-3"
                  onClick={() => navigate('/bi/executive')}
                >
                  <div className="flex flex-col items-start gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">Insights BI</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Dashboard</span>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start h-auto py-3 px-3"
                  onClick={() => navigate('/ai-coach')}
                >
                  <div className="flex flex-col items-start gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <Brain className="h-4 w-4 text-accent" />
                      <span className="font-medium text-sm">AI Coach</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Revue IA</span>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start h-auto py-3 px-3"
                  onClick={() => navigate('/kanban')}
                >
                  <div className="flex flex-col items-start gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <Target className="h-4 w-4 text-success" />
                      <span className="font-medium text-sm">Kanban</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Tâches</span>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start h-auto py-3 px-3"
                  onClick={() => navigate('/finance')}
                >
                  <div className="flex flex-col items-start gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <Activity className="h-4 w-4 text-warning" />
                      <span className="font-medium text-sm">Finances</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Discipline</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </AnimatedContainer>

        {/* Footer Stats */}
        <AnimatedContainer delay={325} animation="fade">
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
