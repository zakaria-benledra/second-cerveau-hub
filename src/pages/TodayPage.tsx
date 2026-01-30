import { format } from 'date-fns';
import {
  Zap,
  Target,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Play,
  Inbox,
  Brain,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';

export default function TodayPage() {
  const { tasks, habits, habitLogs, inboxItems, dailyStats, completeTask, toggleHabitLog } = useAppStore();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayTasks = tasks.filter((t) => {
    if (t.status === 'done') return false;
    if (t.dueDate) {
      const dueDate = new Date(t.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate <= today;
    }
    return false;
  });

  // Next Best Action: highest priority, due today/overdue, lowest estimate
  const nextBestAction = [...todayTasks]
    .sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return (a.estimateMin || 999) - (b.estimateMin || 999);
    })[0];

  const todayHabitLogs = habitLogs.filter(
    (l) => l.date.toDateString() === today.toDateString()
  );
  const habitsCompleted = todayHabitLogs.filter((l) => l.completed).length;
  const activeHabits = habits.filter((h) => h.isActive);

  const pendingInbox = inboxItems.filter((i) => i.status === 'new').length;
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-destructive text-destructive-foreground';
      case 'high':
        return 'bg-foreground text-background';
      case 'medium':
        return 'bg-accent text-accent-foreground border border-border';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {format(today, 'EEEE, MMMM d')}
          </h1>
          <p className="text-muted-foreground">
            Let's make today count. Here's your executive briefing.
          </p>
        </div>

        {/* Next Best Action Card */}
        {nextBestAction && (
          <Card className="border-2 shadow-md bg-foreground text-background">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-sm font-medium opacity-80">
                <Zap className="h-4 w-4" />
                NEXT BEST ACTION
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">{nextBestAction.title}</h2>
                {nextBestAction.description && (
                  <p className="opacity-80">{nextBestAction.description}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline" className="border-background/30 text-background">
                  {nextBestAction.priority.toUpperCase()}
                </Badge>
                {nextBestAction.estimateMin && (
                  <span className="flex items-center gap-1 text-sm opacity-80">
                    <Clock className="h-4 w-4" />
                    {nextBestAction.estimateMin} min
                  </span>
                )}
                {nextBestAction.energyLevel && (
                  <span className="flex items-center gap-1 text-sm opacity-80">
                    <Zap className="h-4 w-4" />
                    {nextBestAction.energyLevel} energy
                  </span>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="secondary"
                  className="gap-2 border-2 border-background shadow-xs"
                  onClick={() => completeTask(nextBestAction.id)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark Complete
                </Button>
                <Button variant="ghost" className="gap-2 text-background hover:bg-background/10">
                  <Play className="h-4 w-4" />
                  Start Focus
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-2 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tasks Today</p>
                  <p className="text-3xl font-bold">{todayTasks.length}</p>
                </div>
                <div className="h-12 w-12 border-2 border-foreground flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </div>
              <Progress value={completionRate} className="mt-4 h-2" />
            </CardContent>
          </Card>

          <Card className="border-2 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Habits</p>
                  <p className="text-3xl font-bold">
                    {habitsCompleted}/{activeHabits.length}
                  </p>
                </div>
                <div className="h-12 w-12 border-2 border-foreground flex items-center justify-center">
                  <Target className="h-6 w-6" />
                </div>
              </div>
              <Progress
                value={(habitsCompleted / Math.max(activeHabits.length, 1)) * 100}
                className="mt-4 h-2"
              />
            </CardContent>
          </Card>

          <Card className="border-2 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Focus Time</p>
                  <p className="text-3xl font-bold">{dailyStats?.focusMinutes || 0}m</p>
                </div>
                <div className="h-12 w-12 border-2 border-foreground flex items-center justify-center">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">of 120m goal</p>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Inbox</p>
                  <p className="text-3xl font-bold">{pendingInbox}</p>
                </div>
                <div className="h-12 w-12 border-2 border-foreground flex items-center justify-center">
                  <Inbox className="h-6 w-6" />
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">items to process</p>
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Today's Tasks */}
          <Card className="border-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold">Today's Tasks</CardTitle>
              <Button variant="ghost" size="sm" className="gap-1 text-sm">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {todayTasks.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <CheckCircle2 className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>All caught up! No tasks due today.</p>
                </div>
              ) : (
                todayTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 border-2 border-border hover:shadow-xs transition-shadow"
                  >
                    <button
                      onClick={() => completeTask(task.id)}
                      className="h-5 w-5 border-2 border-foreground flex-shrink-0 hover:bg-foreground hover:text-background transition-colors"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={cn('text-xs', getPriorityStyles(task.priority))}>
                          {task.priority}
                        </Badge>
                        {task.estimateMin && (
                          <span className="text-xs text-muted-foreground">
                            {task.estimateMin}m
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Habits */}
          <Card className="border-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold">Daily Habits</CardTitle>
              <Button variant="ghost" size="sm" className="gap-1 text-sm">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {activeHabits.map((habit) => {
                const log = todayHabitLogs.find((l) => l.habitId === habit.id);
                const completed = log?.completed || false;

                return (
                  <button
                    key={habit.id}
                    onClick={() => toggleHabitLog(habit.id, today)}
                    className={cn(
                      'flex w-full items-center gap-3 p-3 border-2 transition-all',
                      completed
                        ? 'bg-foreground text-background border-foreground'
                        : 'border-border hover:shadow-xs'
                    )}
                  >
                    <span className="text-xl">{habit.icon}</span>
                    <span className="flex-1 text-left font-medium">{habit.name}</span>
                    <CheckCircle2
                      className={cn(
                        'h-5 w-5',
                        completed ? 'opacity-100' : 'opacity-20'
                      )}
                    />
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        <Card className="border-2 shadow-sm border-dashed">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="h-12 w-12 border-2 border-foreground flex items-center justify-center flex-shrink-0">
              <Brain className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-medium">AI Agent</p>
              <p className="text-sm text-muted-foreground">
                Connect to Lovable Cloud to enable AI-powered insights, weekly reviews, and smart task suggestions.
              </p>
            </div>
            <Button variant="outline" className="border-2 shadow-xs hidden sm:flex">
              Enable
            </Button>
          </CardContent>
        </Card>

        {/* Overload Warning */}
        {dailyStats && dailyStats.overloadIndex > 0.8 && (
          <Card className="border-2 border-destructive bg-destructive/5">
            <CardContent className="flex items-center gap-4 py-4">
              <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0" />
              <div>
                <p className="font-medium text-destructive">Overload Warning</p>
                <p className="text-sm text-muted-foreground">
                  You have more tasks scheduled than your daily capacity. Consider rescheduling or delegating.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
