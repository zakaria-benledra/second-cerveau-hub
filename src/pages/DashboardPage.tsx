import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { fetchWeekStats, fetchTodayStats } from '@/lib/api/stats';
import { Loader2, TrendingUp, TrendingDown, Target, Flame, Clock, AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  const { data: todayStats, isLoading: loadingToday } = useQuery({
    queryKey: ['stats', 'today'],
    queryFn: fetchTodayStats,
  });

  const { data: weekStats, isLoading: loadingWeek } = useQuery({
    queryKey: ['stats', 'week'],
    queryFn: fetchWeekStats,
  });

  const isLoading = loadingToday || loadingWeek;

  // Calculate week averages from daily_stats
  const weekAvg = weekStats && weekStats.length > 0
    ? {
        completionRate: weekStats.reduce((sum, d) => sum + (d.tasks_planned > 0 ? d.tasks_completed / d.tasks_planned : 0), 0) / weekStats.length,
        habitAdherence: weekStats.reduce((sum, d) => sum + (d.habits_total > 0 ? d.habits_completed / d.habits_total : 0), 0) / weekStats.length,
        avgFocusMinutes: weekStats.reduce((sum, d) => sum + d.focus_minutes, 0) / weekStats.length,
        avgOverload: weekStats.reduce((sum, d) => sum + d.overload_index, 0) / weekStats.length,
      }
    : null;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const completionRate = todayStats && todayStats.tasks_planned > 0
    ? Math.round((todayStats.tasks_completed / todayStats.tasks_planned) * 100)
    : 0;

  const habitRate = todayStats && todayStats.habits_total > 0
    ? Math.round((todayStats.habits_completed / todayStats.habits_total) * 100)
    : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard BI</h1>
          <p className="text-muted-foreground">
            Vos indicateurs de performance — données issues de dailyStats uniquement
          </p>
        </div>

        {/* Today KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completionRate}%</div>
              <Progress value={completionRate} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {todayStats?.tasks_completed || 0} / {todayStats?.tasks_planned || 0} tâches
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Habit Adherence</CardTitle>
              <Flame className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{habitRate}%</div>
              <Progress value={habitRate} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {todayStats?.habits_completed || 0} / {todayStats?.habits_total || 0} habitudes
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Focus Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats?.focus_minutes || 0} min</div>
              <Progress value={Math.min(100, ((todayStats?.focus_minutes || 0) / 240) * 100)} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Objectif: 4h de focus
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overload Index</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(todayStats?.overload_index || 0) > 1 ? 'text-destructive' : ''}`}>
                {((todayStats?.overload_index || 0) * 100).toFixed(0)}%
              </div>
              <Progress 
                value={Math.min(100, (todayStats?.overload_index || 0) * 100)} 
                className="mt-2" 
              />
              <p className="text-xs text-muted-foreground mt-2">
                {(todayStats?.overload_index || 0) > 1 ? 'Surcharge détectée' : 'Charge normale'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Week Summary */}
        {weekAvg && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Tendances Semaine
                </CardTitle>
                <CardDescription>Moyennes sur 7 jours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Completion Rate Moy.</span>
                  <span className="font-bold">{(weekAvg.completionRate * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Habit Adherence Moy.</span>
                  <span className="font-bold">{(weekAvg.habitAdherence * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Focus Moy./Jour</span>
                  <span className="font-bold">{weekAvg.avgFocusMinutes.toFixed(0)} min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Overload Moy.</span>
                  <span className={`font-bold ${weekAvg.avgOverload > 1 ? 'text-destructive' : ''}`}>
                    {(weekAvg.avgOverload * 100).toFixed(0)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Clarity Score
                </CardTitle>
                <CardDescription>Qualité de planification</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-4">
                  {((todayStats?.clarity_score || 0) * 100).toFixed(0)}%
                </div>
                <p className="text-sm text-muted-foreground">
                  Tâches avec estimation + échéance
                </p>
                <div className="mt-4 p-3 bg-muted rounded-md border-2 border-border">
                  <p className="text-xs font-mono">
                    clarity_score = tasks_with(estimate + due_date) / total_tasks
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* No data state */}
        {!todayStats && !weekStats?.length && (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TrendingDown className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Aucune donnée disponible</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Commencez à utiliser l'application pour voir vos statistiques.
                Les données sont calculées automatiquement chaque nuit.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
