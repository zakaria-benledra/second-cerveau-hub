import { useHabitsWithLogs } from '@/hooks/useHabits';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Target, Flame, TrendingUp, Calendar } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function HabitStabilityPage() {
  const { data: habitsData = [], isLoading } = useHabitsWithLogs();

  const habits = habitsData;
  // Extract logs and streaks from the habitsData (each habit has todayLog and streak)
  const habitLogs = habitsData.flatMap((h: any) => h.todayLog ? [h.todayLog] : []);
  const streaks = habitsData.map((h: any) => h.streak).filter(Boolean);

  // Calculate habit completion rates
  const habitStats = habits.filter((h: any) => h.is_active).map((habit: any) => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      return habitLogs.find((log: any) => log.habit_id === habit.id && log.date === date && log.completed);
    });
    
    const completedDays = last7Days.filter(Boolean).length;
    const completionRate = (completedDays / 7) * 100;
    const streak = streaks.find((s: any) => s.habit_id === habit.id);

    return {
      id: habit.id,
      name: habit.name,
      completionRate,
      completedDays,
      currentStreak: streak?.current_streak || 0,
      maxStreak: streak?.max_streak || 0,
      color: habit.color || 'hsl(var(--primary))',
    };
  });

  // Weekly completion data
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayLogs = habitLogs.filter((log: any) => log.date === dateStr && log.completed);
    const activeHabits = habits.filter((h: any) => h.is_active).length;
    
    return {
      date: format(date, 'EEE', { locale: fr }),
      completed: dayLogs.length,
      total: activeHabits,
      rate: activeHabits > 0 ? (dayLogs.length / activeHabits) * 100 : 0,
    };
  });

  // Overall stats
  const totalActiveHabits = habits.filter((h: any) => h.is_active).length;
  const avgCompletionRate = habitStats.length > 0
    ? habitStats.reduce((sum: number, h: any) => sum + h.completionRate, 0) / habitStats.length
    : 0;
  const totalStreaks = streaks.reduce((sum: number, s: any) => sum + s.current_streak, 0);
  const longestStreak = Math.max(...streaks.map((s: any) => s.current_streak), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Target className="h-8 w-8 text-primary" />
          Stabilité des Habitudes
        </h1>
        <p className="text-muted-foreground mt-1">
          Suivi de la constance et des séries
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{totalActiveHabits}</div>
                <div className="text-sm text-muted-foreground">Habitudes actives</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-chart-2" />
              <div>
                <div className="text-2xl font-bold">{avgCompletionRate.toFixed(0)}%</div>
                <div className="text-sm text-muted-foreground">Taux moyen</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Flame className="h-8 w-8 text-chart-3" />
              <div>
                <div className="text-2xl font-bold">{longestStreak}</div>
                <div className="text-sm text-muted-foreground">Plus longue série</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-chart-4" />
              <div>
                <div className="text-2xl font-bold">{totalStreaks}</div>
                <div className="text-sm text-muted-foreground">Jours cumulés</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Complétion sur 7 jours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(0)}%`}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="rate" name="Taux de complétion" radius={[4, 4, 0, 0]}>
                  {weeklyData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.rate >= 80 ? 'hsl(var(--chart-2))' : entry.rate >= 50 ? 'hsl(var(--chart-4))' : 'hsl(var(--destructive))'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Habit Details */}
      <Card>
        <CardHeader>
          <CardTitle>Détail par habitude</CardTitle>
          <CardDescription>Performance sur les 7 derniers jours</CardDescription>
        </CardHeader>
        <CardContent>
          {habitStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune habitude active
            </div>
          ) : (
            <div className="space-y-4">
              {habitStats.map((habit: any) => (
                <div key={habit.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{habit.name}</span>
                      {habit.currentStreak > 0 && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Flame className="h-3 w-3" />
                          {habit.currentStreak}j
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {habit.completedDays}/7 jours
                      </span>
                      <Badge 
                        variant={habit.completionRate >= 80 ? 'default' : habit.completionRate >= 50 ? 'secondary' : 'destructive'}
                      >
                        {habit.completionRate.toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                  <Progress 
                    value={habit.completionRate} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Streak Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-chart-3" />
            Meilleures séries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {habitStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune série en cours
            </div>
          ) : (
            <div className="space-y-3">
              {habitStats
                .sort((a: any, b: any) => b.currentStreak - a.currentStreak)
                .slice(0, 5)
                .map((habit: any, i: number) => (
                  <div key={habit.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground">#{i + 1}</span>
                      <span>{habit.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold">{habit.currentStreak} jours</div>
                        <div className="text-xs text-muted-foreground">Record: {habit.maxStreak}</div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
