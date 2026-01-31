/**
 * Habit Stability Dashboard - BI Contract Compliant
 * 
 * IMPORTANT: This dashboard reads ONLY from:
 * - daily_stats (via useHabitStatsBI)
 * - scores_daily (habits_score via useScoresDailyBI)
 * 
 * For operational habit management, users should use the main Habits page (/habits).
 */

import { useHabitStatsBI, useScoresDailyBI, useDailyStats } from '@/hooks/useBIStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Target, Flame, TrendingUp, TrendingDown, Calendar, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BIBreadcrumb } from '@/components/bi/BIBreadcrumb';

export default function HabitStabilityPage() {
  const { stats: habitStats, isLoading: statsLoading } = useHabitStatsBI(14);
  const { data: scores = [], isLoading: scoresLoading } = useScoresDailyBI(14);
  const { data: dailyStats = [] } = useDailyStats(14);

  const isLoading = statsLoading || scoresLoading;

  // Calculate weekly data for chart
  const weeklyData = habitStats.dailyBreakdown.slice(-7).map(d => ({
    date: format(parseISO(d.date), 'EEE', { locale: fr }),
    rate: d.rate,
  }));

  // Habit score trend from scores_daily
  const habitScoreData = scores.map(s => ({
    date: format(parseISO(s.date), 'dd/MM', { locale: fr }),
    score: s.habits_score,
  }));

  // Calculate trends
  const lastWeek = dailyStats.slice(-7);
  const prevWeek = dailyStats.slice(-14, -7);

  const lastWeekRate = lastWeek.length > 0
    ? Math.round(
        lastWeek.reduce((sum, d) => {
          if (d.habits_total > 0) return sum + (d.habits_completed / d.habits_total) * 100;
          return sum;
        }, 0) / lastWeek.filter(d => d.habits_total > 0).length || 0
      )
    : 0;

  const prevWeekRate = prevWeek.length > 0
    ? Math.round(
        prevWeek.reduce((sum, d) => {
          if (d.habits_total > 0) return sum + (d.habits_completed / d.habits_total) * 100;
          return sum;
        }, 0) / prevWeek.filter(d => d.habits_total > 0).length || 0
      )
    : 0;

  const weekTrend = lastWeekRate - prevWeekRate;

  // Consistency score (how many days had 100% completion)
  const perfectDays = habitStats.dailyBreakdown.filter(d => d.rate === 100).length;
  const consistencyScore = Math.round((perfectDays / habitStats.dailyBreakdown.length) * 100) || 0;

  // Latest habit score
  const latestHabitScore = scores.length > 0 ? scores[scores.length - 1].habits_score : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <BIBreadcrumb currentPage="Stabilité des Habitudes" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Target className="h-8 w-8 text-primary" />
            Stabilité des Habitudes
            <Badge variant="secondary">BI</Badge>
          </h1>
          <p className="text-muted-foreground mt-1">
            Analyse de constance et de régularité
          </p>
        </div>
        <Link 
          to="/habits" 
          className="text-sm text-primary hover:underline flex items-center gap-2"
        >
          <Target className="h-4 w-4" />
          Gérer mes habitudes
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{habitStats.activeHabitCount}</div>
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
                <div className="text-2xl font-bold">{habitStats.completionRate}%</div>
                <div className="text-sm text-muted-foreground">Taux (14j)</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Flame className="h-8 w-8 text-chart-3" />
              <div>
                <div className="text-2xl font-bold">{latestHabitScore}%</div>
                <div className="text-sm text-muted-foreground">Score habitudes</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-chart-4" />
              <div>
                <div className="text-2xl font-bold">{perfectDays}</div>
                <div className="text-sm text-muted-foreground">Jours parfaits</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tendance hebdo</p>
                <div className="flex items-center gap-2 mt-1">
                  {weekTrend >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-chart-2" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-destructive" />
                  )}
                  <span className={`text-2xl font-bold ${weekTrend >= 0 ? 'text-chart-2' : 'text-destructive'}`}>
                    {weekTrend >= 0 ? '+' : ''}{weekTrend}%
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Cette semaine</p>
                <p className="text-xl font-bold">{lastWeekRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Consistance</p>
                <p className="text-2xl font-bold">{consistencyScore}%</p>
              </div>
              <div className="w-32">
                <Progress value={consistencyScore} className="h-3" />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {perfectDays}/{habitStats.dailyBreakdown.length} jours parfaits
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Completion Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Complétion sur 7 jours</CardTitle>
          <CardDescription>Données issues de daily_stats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  formatter={(value: number) => `${value}%`}
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

      {/* Habit Score Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution du score habitudes</CardTitle>
          <CardDescription>Données issues de scores_daily (14 jours)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={habitScoreData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  formatter={(value: number) => `${value}%`}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 2 }}
                  name="Score habitudes"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Daily Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Détail quotidien</CardTitle>
          <CardDescription>Performance sur les 14 derniers jours</CardDescription>
        </CardHeader>
        <CardContent>
          {habitStats.dailyBreakdown.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune donnée disponible
            </div>
          ) : (
            <div className="space-y-2">
              {habitStats.dailyBreakdown.slice(-7).reverse().map((day) => (
                <div key={day.date} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">
                      {format(parseISO(day.date), 'EEEE dd/MM', { locale: fr })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {day.completed}/{day.total}
                    </span>
                    <Badge 
                      variant={day.rate >= 80 ? 'default' : day.rate >= 50 ? 'secondary' : 'destructive'}
                    >
                      {day.rate}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <BarChart3 className="h-8 w-8 text-primary mt-1" />
            <div>
              <h3 className="font-semibold">Mode BI activé</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Ce dashboard affiche les données agrégées depuis <code className="px-1 py-0.5 bg-muted rounded text-xs">daily_stats</code> et <code className="px-1 py-0.5 bg-muted rounded text-xs">scores_daily</code>.
                Pour gérer vos habitudes et séries, utilisez la{' '}
                <Link to="/habits" className="text-primary hover:underline">page Habitudes</Link>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
