import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { SageCompanion } from '@/components/sage';
import { usePageSage } from '@/hooks/usePageSage';
import { useTodayCommand } from '@/hooks/useTodayCommand';
import { useTodayScore } from '@/hooks/useScores';
import { useCompleteTask } from '@/hooks/useTasks';
import { useToggleHabitLog } from '@/hooks/useHabits';
import { useCelebration } from '@/hooks/useCelebration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  CheckCircle2, 
  ChevronRight, 
  Sparkles,
  Target,
  ListTodo,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ZenHomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { context, mood, data: sageData } = usePageSage('home');
  
  const {
    isLoading,
    nextBestAction,
    habitsForCard,
    tasksForCard,
    completedHabitsCount,
    completedTasksCount,
  } = useTodayCommand();
  
  const { data: todayScore } = useTodayScore();
  const completeTask = useCompleteTask();
  const toggleHabit = useToggleHabitLog();
  const { celebrate } = useCelebration();
  
  // Refs pour éviter les doubles clics
  const actionRef = useRef<string | null>(null);

  // Score global
  const globalScore = todayScore?.global_score || 0;
  
  // Top 3 habitudes et tâches
  const topHabits = habitsForCard?.slice(0, 3) || [];
  const topTasks = tasksForCard?.filter(t => t.status !== 'done').slice(0, 2) || [];
  
  // Calculer la progression du jour
  const totalItems = (habitsForCard?.length || 0) + (tasksForCard?.length || 0);
  const completedItems = completedHabitsCount + completedTasksCount;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Handlers
  const handleCompleteTask = useCallback((id: string, title: string) => {
    if (actionRef.current === id || completeTask.isPending) return;
    actionRef.current = id;
    
    completeTask.mutate(id, {
      onSuccess: () => {
        const remaining = tasksForCard?.filter(t => t.id !== id && t.status !== 'done').length || 0;
        if (remaining === 0) {
          celebrate('all_tasks_done');
        } else {
          celebrate('task_complete', title);
        }
        actionRef.current = null;
      },
      onError: () => {
        actionRef.current = null;
      }
    });
  }, [completeTask, tasksForCard, celebrate]);

  const handleToggleHabit = useCallback((id: string, name: string) => {
    if (actionRef.current === id || toggleHabit.isPending) return;
    actionRef.current = id;
    
    toggleHabit.mutate(id, {
      onSuccess: () => {
        const allDone = habitsForCard?.every(h => h.completed || h.id === id);
        if (allDone) {
          celebrate('all_habits_done');
        } else {
          celebrate('habit_complete', name);
        }
        actionRef.current = null;
      },
      onError: () => {
        actionRef.current = null;
      }
    });
  }, [toggleHabit, habitsForCard, celebrate]);

  // Action principale suggérée
  const primaryAction = nextBestAction && nextBestAction.status !== 'done' 
    ? {
        label: 'Commencer',
        onClick: () => handleCompleteTask(nextBestAction.id, nextBestAction.title)
      }
    : topHabits.find(h => !h.completed)
      ? {
          label: 'Valider une habitude',
          onClick: () => navigate('/habits')
        }
      : undefined;

  // Loading
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Tout est fait !
  const allDone = completedItems === totalItems && totalItems > 0;

  return (
    <AppLayout>
      <div className="space-y-6 pb-8">
        
        {/* Header avec Greeting */}
        <GlobalHeader variant="greeting" />

        {/* Sage Hero - Message principal */}
        <SageCompanion
          context={context}
          mood={mood}
          data={sageData}
          variant="hero"
          primaryAction={primaryAction}
          secondaryAction={{
            label: 'Voir mon évolution',
            onClick: () => navigate('/progress')
          }}
        />

        {/* Progression du jour */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Ta journée</span>
              <Badge variant="secondary" className="text-xs">
                {progressPercent}%
              </Badge>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {completedItems}/{totalItems} actions complétées
            </p>
          </CardContent>
        </Card>

        {/* Prochaine action (si pas tout fait) */}
        {!allDone && nextBestAction && nextBestAction.status !== 'done' && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Ta priorité
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium">{nextBestAction.title}</p>
                {nextBestAction.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {nextBestAction.description}
                  </p>
                )}
              </div>
              <Button
                onClick={() => handleCompleteTask(nextBestAction.id, nextBestAction.title)}
                disabled={completeTask.isPending}
              >
                {completeTask.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                C'est fait !
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Habitudes rapides */}
        {topHabits.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Tes habitudes
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/habits')}>
                  Tout voir
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {topHabits.map((habit) => (
                <button
                  key={habit.id}
                  onClick={() => !habit.completed && handleToggleHabit(habit.id, habit.name)}
                  disabled={toggleHabit.isPending || habit.completed}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg transition-all",
                    "hover:bg-muted/50 active:scale-[0.98]",
                    habit.completed && "bg-success/10 opacity-70"
                  )}
                >
                  <Checkbox checked={habit.completed} />
                  <span className="text-lg">{habit.icon || '✓'}</span>
                  <span className={cn(habit.completed && "line-through text-muted-foreground")}>
                    {habit.name}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Tâches restantes (max 2) */}
        {topTasks.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <ListTodo className="h-4 w-4 text-primary" />
                  À faire
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/tasks')}>
                  Tout voir
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {topTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{task.title}</p>
                    {task.priority === 'high' && (
                      <Badge variant="destructive" className="text-xs mt-1">Prioritaire</Badge>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleCompleteTask(task.id, task.title)}
                    disabled={completeTask.isPending}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Message si tout est vide */}
        {totalItems === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="font-medium mb-2">C'est calme ici !</p>
              <p className="text-sm text-muted-foreground mb-4">
                Ajoute des habitudes ou des tâches pour commencer.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button variant="outline" onClick={() => navigate('/habits')}>
                  Ajouter une habitude
                </Button>
                <Button onClick={() => navigate('/tasks')}>
                  Ajouter une tâche
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lien discret vers plus de détails */}
        <div className="flex justify-center pt-4">
          <Button
            variant="ghost"
            className="text-muted-foreground text-sm"
            onClick={() => navigate('/identity/details')}
          >
            Voir tous les détails
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

      </div>
    </AppLayout>
  );
}
