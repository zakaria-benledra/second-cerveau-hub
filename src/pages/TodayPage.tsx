import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  useTodayTasks, 
  useCompleteTask, 
  useNextBestAction 
} from '@/hooks/useTasks';
import { useHabitsWithLogs, useToggleHabitLog } from '@/hooks/useHabits';
import { useInboxItems } from '@/hooks/useInbox';
import { useQuery } from '@tanstack/react-query';
import { fetchTodayStats, calculateTodayStats } from '@/lib/api/stats';
import { 
  CheckCircle2, 
  Clock, 
  Flame, 
  Inbox, 
  Loader2, 
  Play, 
  Zap,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const priorityColors: Record<string, string> = {
  urgent: 'border-destructive bg-destructive/10 text-destructive',
  high: 'border-orange-500 bg-orange-500/10 text-orange-700',
  medium: 'border-primary bg-primary/10 text-primary',
  low: 'border-muted-foreground bg-muted text-muted-foreground',
};

export default function TodayPage() {
  const { data: tasks, isLoading: loadingTasks } = useTodayTasks();
  const { data: nextBestAction } = useNextBestAction();
  const { data: habits, isLoading: loadingHabits } = useHabitsWithLogs();
  const { data: inboxItems } = useInboxItems();
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['stats', 'today'],
    queryFn: fetchTodayStats,
  });
  
  const completeTask = useCompleteTask();
  const toggleHabit = useToggleHabitLog();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshStats = async () => {
    setIsRefreshing(true);
    try {
      await calculateTodayStats();
      await refetchStats();
    } finally {
      setIsRefreshing(false);
    }
  };

  const today = new Date();
  const formattedDate = format(today, "EEEE d MMMM yyyy", { locale: fr });

  const todoTasks = tasks?.filter(t => t.status === 'todo') || [];
  const inProgressTasks = tasks?.filter(t => t.status === 'in_progress') || [];
  const completedTasks = tasks?.filter(t => t.status === 'done') || [];
  const totalTasks = tasks?.length || 0;
  const completedCount = completedTasks.length;

  const activeHabits = habits?.filter(h => h.is_active) || [];
  const completedHabits = activeHabits.filter(h => h.todayLog?.completed);

  const newInboxCount = inboxItems?.filter(i => i.status === 'new').length || 0;

  const isLoading = loadingTasks || loadingHabits;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight capitalize">{formattedDate}</h1>
            <p className="text-muted-foreground">
              {totalTasks} tâches planifiées · {completedCount} terminées
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefreshStats}
            disabled={isRefreshing}
            className="border-2"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Rafraîchir Stats
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-2">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 border-2 border-primary">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedCount}/{totalTasks}</p>
                  <p className="text-xs text-muted-foreground">Tâches</p>
                </div>
              </div>
              <Progress 
                value={totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0} 
                className="mt-3" 
              />
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 border-2 border-orange-500">
                  <Flame className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedHabits.length}/{activeHabits.length}</p>
                  <p className="text-xs text-muted-foreground">Habitudes</p>
                </div>
              </div>
              <Progress 
                value={activeHabits.length > 0 ? (completedHabits.length / activeHabits.length) * 100 : 0} 
                className="mt-3" 
              />
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 border-2 border-blue-500">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.focus_minutes || 0}</p>
                  <p className="text-xs text-muted-foreground">Min. Focus</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 border-2 ${(stats?.overload_index || 0) > 1 ? 'bg-destructive/10 border-destructive' : 'bg-green-500/10 border-green-500'}`}>
                  <AlertTriangle className={`h-5 w-5 ${(stats?.overload_index || 0) > 1 ? 'text-destructive' : 'text-green-500'}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{((stats?.overload_index || 0) * 100).toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">Charge</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Next Best Action */}
          <div className="lg:col-span-2 space-y-4">
            {nextBestAction && nextBestAction.status === 'todo' && (
              <Card className="border-2 border-primary bg-primary/5">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Next Best Action</CardTitle>
                  </div>
                  <CardDescription>
                    Haute priorité · Échéance proche · Estimation courte
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold text-lg">{nextBestAction.title}</p>
                      {nextBestAction.description && (
                        <p className="text-sm text-muted-foreground">{nextBestAction.description}</p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Badge className={priorityColors[nextBestAction.priority]}>
                          {nextBestAction.priority}
                        </Badge>
                        {nextBestAction.estimate_min && (
                          <Badge variant="outline" className="border-2">
                            <Clock className="h-3 w-3 mr-1" />
                            {nextBestAction.estimate_min} min
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button 
                      onClick={() => completeTask.mutate(nextBestAction.id)}
                      disabled={completeTask.isPending}
                      className="border-2"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Commencer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tasks List */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Tâches du jour</CardTitle>
                <CardDescription>
                  {inProgressTasks.length} en cours · {todoTasks.length} à faire
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[...inProgressTasks, ...todoTasks].map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 border-2 hover:bg-accent transition-colors"
                  >
                    <Checkbox
                      checked={task.status === 'done'}
                      onCheckedChange={() => completeTask.mutate(task.id)}
                      disabled={completeTask.isPending}
                      className="border-2"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{task.title}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge className={priorityColors[task.priority]} variant="outline">
                          {task.priority}
                        </Badge>
                        {task.estimate_min && (
                          <Badge variant="outline" className="border-2">
                            {task.estimate_min} min
                          </Badge>
                        )}
                        {task.status === 'in_progress' && (
                          <Badge className="bg-blue-500/10 border-blue-500 text-blue-700 border-2">
                            En cours
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {todoTasks.length === 0 && inProgressTasks.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">
                    Aucune tâche pour aujourd'hui
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Habits */}
            <Card className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Habitudes</CardTitle>
                  <Flame className="h-4 w-4 text-orange-500" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {activeHabits.map((habit) => (
                  <div
                    key={habit.id}
                    className="flex items-center gap-3 p-2 border-2 hover:bg-accent transition-colors cursor-pointer"
                    onClick={() => toggleHabit.mutate(habit.id)}
                  >
                    <Checkbox
                      checked={habit.todayLog?.completed || false}
                      disabled={toggleHabit.isPending}
                      className="border-2"
                    />
                    <span className="text-lg">{habit.icon || '✨'}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{habit.name}</p>
                      {habit.streak && habit.streak.current_streak > 0 && (
                        <p className="text-xs text-orange-500">
                          🔥 {habit.streak.current_streak} jours
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {activeHabits.length === 0 && (
                  <p className="text-center py-4 text-muted-foreground text-sm">
                    Aucune habitude active
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Inbox Preview */}
            <Card className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Inbox</CardTitle>
                  <div className="flex items-center gap-2">
                    {newInboxCount > 0 && (
                      <Badge variant="default" className="border-2">
                        {newInboxCount}
                      </Badge>
                    )}
                    <Inbox className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {newInboxCount > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {newInboxCount} élément{newInboxCount > 1 ? 's' : ''} à traiter
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Inbox vide ✨
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
