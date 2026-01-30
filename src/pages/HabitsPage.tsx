import { useState } from 'react';
import { format, subDays, startOfWeek, addDays } from 'date-fns';
import {
  Plus,
  CheckCircle2,
  Flame,
  Target,
  TrendingUp,
  Calendar,
  MoreHorizontal,
  Trash2,
  Edit2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';
import type { HabitFrequency } from '@/types';

export default function HabitsPage() {
  const { habits, habitLogs, addHabit, toggleHabitLog } = useAppStore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newHabit, setNewHabit] = useState({
    name: '',
    icon: '✨',
    targetFrequency: 'daily' as HabitFrequency,
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });

  const activeHabits = habits.filter((h) => h.isActive);

  // Get last 7 days for the weekly view
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    date.setHours(0, 0, 0, 0);
    return date;
  });

  const getStreak = (habitId: string) => {
    let streak = 0;
    let currentDate = new Date(today);

    while (true) {
      const log = habitLogs.find(
        (l) => l.habitId === habitId && l.date.toDateString() === currentDate.toDateString()
      );
      if (log?.completed) {
        streak++;
        currentDate = subDays(currentDate, 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const getTodayProgress = () => {
    const todayLogs = habitLogs.filter(
      (l) => l.date.toDateString() === today.toDateString() && l.completed
    );
    return (todayLogs.length / Math.max(activeHabits.length, 1)) * 100;
  };

  const getWeekProgress = () => {
    let completed = 0;
    let total = activeHabits.length * 7;

    last7Days.forEach((date) => {
      activeHabits.forEach((habit) => {
        const log = habitLogs.find(
          (l) => l.habitId === habit.id && l.date.toDateString() === date.toDateString()
        );
        if (log?.completed) completed++;
      });
    });

    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const handleAddHabit = () => {
    if (!newHabit.name.trim()) return;
    addHabit({
      name: newHabit.name,
      icon: newHabit.icon,
      targetFrequency: newHabit.targetFrequency,
      isActive: true,
    });
    setNewHabit({ name: '', icon: '✨', targetFrequency: 'daily' });
    setIsAddOpen(false);
  };

  const isDateCompleted = (habitId: string, date: Date) => {
    const log = habitLogs.find(
      (l) => l.habitId === habitId && l.date.toDateString() === date.toDateString()
    );
    return log?.completed || false;
  };

  const iconOptions = ['✨', '🧘', '📚', '💪', '🏃', '✍️', '🎯', '💧', '🌱', '😴', '🧠', '🎨'];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Habits</h1>
            <p className="text-muted-foreground">
              Build consistency, one day at a time.
            </p>
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 border-2 shadow-xs">
                <Plus className="h-4 w-4" />
                New Habit
              </Button>
            </DialogTrigger>
            <DialogContent className="border-2 shadow-md">
              <DialogHeader>
                <DialogTitle>Create New Habit</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    placeholder="e.g., Morning meditation"
                    value={newHabit.name}
                    onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                    className="border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <div className="flex flex-wrap gap-2">
                    {iconOptions.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => setNewHabit({ ...newHabit, icon })}
                        className={cn(
                          'h-10 w-10 border-2 flex items-center justify-center text-xl transition-all',
                          newHabit.icon === icon
                            ? 'bg-foreground text-background border-foreground'
                            : 'border-border hover:border-foreground'
                        )}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={newHabit.targetFrequency}
                    onValueChange={(v) =>
                      setNewHabit({ ...newHabit, targetFrequency: v as HabitFrequency })
                    }
                  >
                    <SelectTrigger className="border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-2 shadow-sm">
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddHabit} className="w-full border-2 shadow-xs">
                  Create Habit
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-2 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Today</p>
                  <p className="text-3xl font-bold">{Math.round(getTodayProgress())}%</p>
                </div>
                <div className="h-12 w-12 border-2 border-foreground flex items-center justify-center">
                  <Target className="h-6 w-6" />
                </div>
              </div>
              <Progress value={getTodayProgress()} className="mt-4 h-2" />
            </CardContent>
          </Card>

          <Card className="border-2 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">This Week</p>
                  <p className="text-3xl font-bold">{getWeekProgress()}%</p>
                </div>
                <div className="h-12 w-12 border-2 border-foreground flex items-center justify-center">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
              <Progress value={getWeekProgress()} className="mt-4 h-2" />
            </CardContent>
          </Card>

          <Card className="border-2 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Best Streak</p>
                  <p className="text-3xl font-bold">
                    {Math.max(...activeHabits.map((h) => getStreak(h.id)), 0)}
                  </p>
                </div>
                <div className="h-12 w-12 border-2 border-foreground flex items-center justify-center">
                  <Flame className="h-6 w-6" />
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">days in a row</p>
            </CardContent>
          </Card>
        </div>

        {/* Habits Grid */}
        <Card className="border-2 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Weekly View
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Header Row */}
            <div className="grid grid-cols-[1fr_repeat(7,40px)] gap-2 mb-4 items-center">
              <div className="text-sm font-medium text-muted-foreground">Habit</div>
              {last7Days.map((date) => (
                <div
                  key={date.toISOString()}
                  className={cn(
                    'text-center text-xs font-medium',
                    date.toDateString() === today.toDateString() && 'text-foreground'
                  )}
                >
                  <div>{format(date, 'EEE')}</div>
                  <div className="text-lg">{format(date, 'd')}</div>
                </div>
              ))}
            </div>

            {/* Habit Rows */}
            <div className="space-y-3">
              {activeHabits.map((habit) => {
                const streak = getStreak(habit.id);

                return (
                  <div
                    key={habit.id}
                    className="grid grid-cols-[1fr_repeat(7,40px)] gap-2 items-center"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl flex-shrink-0">{habit.icon}</span>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{habit.name}</p>
                        {streak > 0 && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Flame className="h-3 w-3" />
                            {streak} day streak
                          </p>
                        )}
                      </div>
                    </div>
                    {last7Days.map((date) => {
                      const completed = isDateCompleted(habit.id, date);
                      const isFuture = date > today;

                      return (
                        <button
                          key={date.toISOString()}
                          onClick={() => !isFuture && toggleHabitLog(habit.id, date)}
                          disabled={isFuture}
                          className={cn(
                            'h-10 w-10 border-2 flex items-center justify-center transition-all',
                            completed
                              ? 'bg-foreground border-foreground text-background'
                              : isFuture
                              ? 'border-muted bg-muted/30 cursor-not-allowed'
                              : 'border-border hover:border-foreground'
                          )}
                        >
                          {completed && <CheckCircle2 className="h-4 w-4" />}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {activeHabits.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                <Target className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="font-medium">No habits yet</p>
                <p className="text-sm">Create your first habit to start tracking.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
