import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { fetchWeekStats, fetchTodayStats } from '@/lib/api/stats';
import { 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Flame, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Zap,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function DashboardPage() {
  const navigate = useNavigate();
  
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
        avgOverload: weekStats.reduce((sum, d) => sum + (d.overload_index || 0), 0) / weekStats.length,
      }
    : null;

  // Prepare chart data
  const chartData = weekStats?.map(stat => ({
    date: format(parseISO(stat.date), 'EEE', { locale: fr }),
    fullDate: format(parseISO(stat.date), 'dd MMM', { locale: fr }),
    completion: stat.tasks_planned > 0 ? Math.round((stat.tasks_completed / stat.tasks_planned) * 100) : 0,
    habits: stat.habits_total > 0 ? Math.round((stat.habits_completed / stat.habits_total) * 100) : 0,
    focus: stat.focus_minutes,
    overload: Math.round((stat.overload_index || 0) * 100),
  })) || [];

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

  // Clickable KPI Card component
  const KPICard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    progress, 
    link,
    iconBgClass = 'bg-primary/10',
    iconClass = 'text-primary',
    valueClass = ''
  }: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: React.ElementType;
    progress: number;
    link: string;
    iconBgClass?: string;
    iconClass?: string;
    valueClass?: string;
  }) => (
    <Card 
      className="hover-lift cursor-pointer group transition-all hover:ring-2 hover:ring-primary/20"
      onClick={() => navigate(link)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center gap-2">
          <div className={cn("p-2 rounded-lg", iconBgClass)}>
            <Icon className={cn("h-4 w-4", iconClass)} />
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn("text-3xl font-bold", valueClass)}>{value}</div>
        <Progress value={progress} className="mt-3 h-2" />
        <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
      </CardContent>
    </Card>
  );

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord</h1>
            <p className="text-muted-foreground mt-1">
              Indicateurs de transformation — Cliquez pour explorer
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BarChart3 className="h-4 w-4" />
            <span>Mode Intelligence</span>
          </div>
        </div>

        {/* Today KPIs - Now clickable! */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Completion Rate"
            value={`${completionRate}%`}
            subtitle={`${todayStats?.tasks_completed || 0} / ${todayStats?.tasks_planned || 0} tâches`}
            icon={Target}
            progress={completionRate}
            link="/tasks"
            iconBgClass="bg-primary/10"
            iconClass="text-primary"
          />

          <KPICard
            title="Habit Adherence"
            value={`${habitRate}%`}
            subtitle={`${todayStats?.habits_completed || 0} / ${todayStats?.habits_total || 0} habitudes`}
            icon={Flame}
            progress={habitRate}
            link="/habits"
            iconBgClass="bg-primary/10"
            iconClass="text-primary"
          />

          <KPICard
            title="Focus Time"
            value={`${todayStats?.focus_minutes || 0} min`}
            subtitle="Objectif: 4h de focus"
            icon={Clock}
            progress={Math.min(100, ((todayStats?.focus_minutes || 0) / 240) * 100)}
            link="/focus"
            iconBgClass="bg-primary/10"
            iconClass="text-primary"
          />

          <Card 
            className="hover-lift cursor-pointer group transition-all hover:ring-2 hover:ring-primary/20"
            onClick={() => navigate('/tasks')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overload Index</CardTitle>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "p-2 rounded-lg",
                  (todayStats?.overload_index || 0) > 1 ? 'bg-destructive/10' : 'bg-primary/10'
                )}>
                  <AlertTriangle className={cn(
                    "h-4 w-4",
                    (todayStats?.overload_index || 0) > 1 ? 'text-destructive' : 'text-primary'
                  )} />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-3xl font-bold",
                (todayStats?.overload_index || 0) > 1 && 'text-destructive'
              )}>
                {((todayStats?.overload_index || 0) * 100).toFixed(0)}%
              </div>
              <Progress 
                value={Math.min(100, (todayStats?.overload_index || 0) * 100)} 
                className="mt-3 h-2" 
              />
              <p className="text-xs text-muted-foreground mt-2">
                {(todayStats?.overload_index || 0) > 1 ? 'Surcharge détectée' : 'Charge normale'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        {chartData.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Performance Hebdomadaire
                </CardTitle>
                <CardDescription>Taux de completion et adhérence habitudes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorHabits" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis domain={[0, 100]} className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '0.75rem',
                        }}
                        labelFormatter={(label) => chartData.find(d => d.date === label)?.fullDate || label}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="completion" 
                        stroke="hsl(var(--primary))" 
                        fillOpacity={1}
                        fill="url(#colorCompletion)"
                        strokeWidth={2}
                        name="Tâches %"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="habits" 
                        stroke="hsl(var(--accent))" 
                        fillOpacity={1}
                        fill="url(#colorHabits)"
                        strokeWidth={2}
                        name="Habitudes %"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Focus Time Trend
                </CardTitle>
                <CardDescription>Minutes de focus par jour</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '0.75rem',
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="focus" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ r: 4, strokeWidth: 2 }}
                        name="Focus (min)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Week Summary */}
        {weekAvg && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card 
              className="cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
              onClick={() => navigate('/tasks')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Tendances Semaine
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                </CardTitle>
                <CardDescription>Moyennes sur 7 jours — Cliquez pour les tâches</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Completion Rate Moy.</span>
                  <span className="font-bold">{(weekAvg.completionRate * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Habit Adherence Moy.</span>
                  <span className="font-bold">{(weekAvg.habitAdherence * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Focus Moy./Jour</span>
                  <span className="font-bold">{weekAvg.avgFocusMinutes.toFixed(0)} min</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Overload Moy.</span>
                  <span className={cn(
                    "font-bold",
                    weekAvg.avgOverload > 1 && 'text-destructive'
                  )}>
                    {(weekAvg.avgOverload * 100).toFixed(0)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Clarity Score
                </CardTitle>
                <CardDescription>Qualité de planification</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-5xl font-bold text-primary">
                    {((todayStats?.clarity_score || 0) * 100).toFixed(0)}%
                  </div>
                  <CheckCircle2 className={cn(
                    "h-8 w-8",
                    (todayStats?.clarity_score || 0) >= 0.8 ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Tâches avec estimation + échéance
                </p>
                <div className="p-4 rounded-lg bg-muted/50 font-mono text-xs">
                  clarity_score = tasks_with(estimate + due_date) / total_tasks
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* No data state */}
        {!todayStats && !weekStats?.length && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <TrendingDown className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold text-xl mb-2">Aucune donnée disponible</h3>
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
