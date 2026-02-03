import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { fetchWeekStats, fetchTodayStats } from '@/lib/api/stats';
import { useTodayScore } from '@/hooks/useScores';
import { ActiveProgramCard } from '@/components/program/ActiveProgramCard';
import { 
  Loader2, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Target, 
  Flame, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Zap,
  ArrowRight,
  Brain,
  Activity,
  Sparkles,
  Eye
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
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

  const { data: todayScore } = useTodayScore();

  const isLoading = loadingToday || loadingWeek;

  // Calculate week averages
  const weekAvg = weekStats && weekStats.length > 0
    ? {
        completionRate: weekStats.reduce((sum, d) => sum + (d.tasks_planned > 0 ? d.tasks_completed / d.tasks_planned : 0), 0) / weekStats.length,
        habitAdherence: weekStats.reduce((sum, d) => sum + (d.habits_total > 0 ? d.habits_completed / d.habits_total : 0), 0) / weekStats.length,
        avgFocusMinutes: weekStats.reduce((sum, d) => sum + d.focus_minutes, 0) / weekStats.length,
        avgOverload: weekStats.reduce((sum, d) => sum + (d.overload_index || 0), 0) / weekStats.length,
      }
    : null;

  // Chart data
  const chartData = weekStats?.map(stat => ({
    date: format(parseISO(stat.date), 'EEE', { locale: fr }),
    fullDate: format(parseISO(stat.date), 'dd MMM', { locale: fr }),
    completion: stat.tasks_planned > 0 ? Math.round((stat.tasks_completed / stat.tasks_planned) * 100) : 0,
    habits: stat.habits_total > 0 ? Math.round((stat.habits_completed / stat.habits_total) * 100) : 0,
    focus: stat.focus_minutes,
    overload: Math.round((stat.overload_index || 0) * 100),
  })) || [];

  // Radar data for breakdown
  const radarData = todayStats ? [
    { 
      subject: 'Tâches', 
      value: todayStats.tasks_planned > 0 
        ? Math.round((todayStats.tasks_completed / todayStats.tasks_planned) * 100) 
        : 0, 
      fullMark: 100 
    },
    { 
      subject: 'Habitudes', 
      value: todayStats.habits_total > 0 
        ? Math.round((todayStats.habits_completed / todayStats.habits_total) * 100) 
        : 0, 
      fullMark: 100 
    },
    { 
      subject: 'Focus', 
      value: Math.min(100, Math.round((todayStats.focus_minutes / 240) * 100)), 
      fullMark: 100 
    },
    { 
      subject: 'Clarté', 
      value: Math.round((todayStats.clarity_score || 0) * 100), 
      fullMark: 100 
    },
  ] : [];

  // Calculate global performance score
  const globalPerformance = todayStats && radarData.length > 0
    ? Math.round(radarData.reduce((sum, d) => sum + d.value, 0) / radarData.length)
    : 0;

  // Trend icon
  const getTrendIcon = () => {
    if (!todayScore) return <Minus className="h-5 w-5" />;
    const momentum = todayScore.momentum_index || 50;
    if (momentum > 55) return <TrendingUp className="h-5 w-5 text-chart-2" />;
    if (momentum < 45) return <TrendingDown className="h-5 w-5 text-destructive" />;
    return <Minus className="h-5 w-5 text-muted-foreground" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const completionRate = todayStats && todayStats.tasks_planned > 0
    ? Math.round((todayStats.tasks_completed / todayStats.tasks_planned) * 100)
    : 0;

  const habitRate = todayStats && todayStats.habits_total > 0
    ? Math.round((todayStats.habits_completed / todayStats.habits_total) * 100)
    : 0;

  // Premium KPI Card Component
  const PremiumKPI = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    progress, 
    trend,
    link,
    gradient = 'from-primary/10 via-primary/5 to-background'
  }: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: React.ElementType;
    progress: number;
    trend?: 'up' | 'down' | 'stable';
    link: string;
    gradient?: string;
  }) => (
    <Card 
      className={cn(
        "cursor-pointer hover:border-primary/50 transition-all duration-300 hover:shadow-lg bg-gradient-to-br",
        gradient
      )}
      onClick={() => navigate(link)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <span className="font-medium text-sm">{title}</span>
          </div>
          {trend && (
            <div className="flex items-center gap-1">
              {trend === 'up' && <TrendingUp className="h-4 w-4 text-chart-2" />}
              {trend === 'down' && <TrendingDown className="h-4 w-4 text-destructive" />}
              {trend === 'stable' && <Minus className="h-4 w-4 text-muted-foreground" />}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{value}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <Progress value={progress} className="h-1.5" />
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* PROGRAMME ACTIF - Compact */}
      <ActiveProgramCard variant="compact" />

      {/* HEADER PREMIUM */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">Dashboard Intelligence</h1>
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                BI Mode
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Vue d'ensemble de votre performance — Cliquez sur les cartes pour explorer
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/bi/executive')}
          className="gap-2"
        >
          <Eye className="h-4 w-4" />
          Vue Exécutive
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* GLOBAL SCORE HERO SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Score Card */}
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Performance Globale
            </CardTitle>
            <CardDescription>Score du jour</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-6">
              <div className="relative">
                <div className="text-7xl font-bold text-primary">
                  {globalPerformance}
                </div>
                <div className="absolute -right-8 top-0">
                  {getTrendIcon()}
                </div>
              </div>
            </div>
            
            {/* Mini metrics */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-xl font-bold">
                  {todayScore?.momentum_index?.toFixed(0) || 50}%
                </div>
                <p className="text-xs text-muted-foreground">Momentum</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-xl font-bold">
                  {todayScore?.burnout_index?.toFixed(0) || 0}%
                </div>
                <p className="text-xs text-muted-foreground">Burnout</p>
              </div>
            </div>

            <Button 
              variant="ghost" 
              className="w-full mt-4"
              onClick={() => navigate('/')}
            >
              <Eye className="h-4 w-4 mr-2" />
              Voir Identity Dashboard
            </Button>
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Breakdown Performance
            </CardTitle>
            <CardDescription>Répartition détaillée par dimension</CardDescription>
          </CardHeader>
          <CardContent>
            {radarData.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Radar
                      name="Performance"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                Aucune donnée disponible
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* TODAY KPIs - PREMIUM STYLE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <PremiumKPI
          title="Tâches"
          value={`${completionRate}%`}
          subtitle={`${todayStats?.tasks_completed || 0}/${todayStats?.tasks_planned || 0} complétées`}
          icon={CheckCircle2}
          progress={completionRate}
          trend={completionRate >= 80 ? 'up' : completionRate < 50 ? 'down' : 'stable'}
          link="/kanban"
          gradient="from-primary/10 via-primary/5 to-background"
        />

        <PremiumKPI
          title="Habitudes"
          value={`${habitRate}%`}
          subtitle={`${todayStats?.habits_completed || 0}/${todayStats?.habits_total || 0} validées`}
          icon={Flame}
          progress={habitRate}
          trend={habitRate >= 80 ? 'up' : habitRate < 50 ? 'down' : 'stable'}
          link="/behavior-hub"
          gradient="from-accent/10 via-accent/5 to-background"
        />

        <PremiumKPI
          title="Focus"
          value={`${todayStats?.focus_minutes || 0} min`}
          subtitle="Deep work aujourd'hui"
          icon={Clock}
          progress={Math.min(100, ((todayStats?.focus_minutes || 0) / 240) * 100)}
          trend={(todayStats?.focus_minutes || 0) >= 240 ? 'up' : (todayStats?.focus_minutes || 0) < 120 ? 'down' : 'stable'}
          link="/focus"
          gradient="from-chart-2/10 via-chart-2/5 to-background"
        />

        <Card 
          className={cn(
            "cursor-pointer hover:border-primary/50 transition-all duration-300 hover:shadow-lg bg-gradient-to-br",
            (todayStats?.overload_index || 0) > 1 
              ? "from-destructive/10 via-destructive/5 to-background border-destructive/30" 
              : "from-muted/30 via-muted/10 to-background"
          )}
          onClick={() => navigate('/ai-interventions')}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-muted/50">
                  <AlertTriangle className={cn(
                    "h-5 w-5",
                    (todayStats?.overload_index || 0) > 1 ? 'text-destructive' : 'text-primary'
                  )} />
                </div>
                <span className="font-medium text-sm">Overload Index</span>
              </div>
              {(todayStats?.overload_index || 0) > 1 && (
                <Badge variant="destructive" className="gap-1">
                  <Zap className="h-3 w-3" />
                  Alerte
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className={cn(
                  "text-3xl font-bold",
                  (todayStats?.overload_index || 0) > 1 && 'text-destructive'
                )}>
                  {((todayStats?.overload_index || 0) * 100).toFixed(0)}%
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <Progress 
                value={Math.min(100, (todayStats?.overload_index || 0) * 100)} 
                className={cn("h-1.5", (todayStats?.overload_index || 0) > 1 ? 'bg-destructive/20' : undefined)}
              />
              <p className="text-xs text-muted-foreground">
                {(todayStats?.overload_index || 0) > 1 ? '⚠️ Surcharge détectée — IA intervient' : '✓ Charge normale'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS - IMPROVED LAYOUT */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Performance Hebdomadaire
                  </CardTitle>
                  <CardDescription>Taux de completion et adhérence</CardDescription>
                </div>
                <Badge variant="outline">7 jours</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <defs>
                      <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorHabits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip 
                      labelFormatter={(label) => chartData.find(d => d.date === label)?.fullDate || label}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="completion" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Tâches (%)"
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="habits" 
                      stroke="hsl(var(--chart-2))" 
                      strokeWidth={2}
                      name="Habitudes (%)"
                      dot={{ fill: 'hsl(var(--chart-2))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Focus Time Evolution
                  </CardTitle>
                  <CardDescription>Minutes de deep work quotidiennes</CardDescription>
                </div>
                <Badge variant="outline">7 jours</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <defs>
                      <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip 
                      labelFormatter={(label) => chartData.find(d => d.date === label)?.fullDate || label}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="focus"
                      stroke="hsl(var(--chart-3))"
                      fill="url(#colorFocus)"
                      strokeWidth={2}
                      name="Focus (min)"
                    />
                    {/* Reference line for 240 min goal */}
                    <Line 
                      type="monotone" 
                      dataKey={() => 240} 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Objectif"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* WEEK SUMMARY + INSIGHTS */}
      {weekAvg && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Moyennes Semaine
              </CardTitle>
              <CardDescription>Performance moyenne sur 7 jours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Completion Rate
                  </div>
                  <div className="text-2xl font-bold">
                    {(weekAvg.completionRate * 100).toFixed(0)}%
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-1">
                    <Flame className="h-4 w-4" />
                    Habit Adherence
                  </div>
                  <div className="text-2xl font-bold">
                    {(weekAvg.habitAdherence * 100).toFixed(0)}%
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-1">
                    <Clock className="h-4 w-4" />
                    Focus Moyen/Jour
                  </div>
                  <div className="text-2xl font-bold">
                    {weekAvg.avgFocusMinutes.toFixed(0)} min
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-1">
                    <AlertTriangle className={cn(
                      "h-4 w-4",
                      weekAvg.avgOverload > 1 ? "text-destructive" : "text-muted-foreground"
                    )} />
                    Overload Moyen
                  </div>
                  <div className={cn(
                    "text-2xl font-bold",
                    weekAvg.avgOverload > 1 ? "text-destructive" : "text-foreground"
                  )}>
                    {(weekAvg.avgOverload * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Clarity Score
              </CardTitle>
              <CardDescription>Qualité de votre planification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold">
                    {((todayStats?.clarity_score || 0) * 100).toFixed(0)}%
                  </div>
                  <div className={cn(
                    "p-3 rounded-full",
                    (todayStats?.clarity_score || 0) >= 0.8 ? "bg-chart-2/10" : "bg-muted/50"
                  )}>
                    <Target className={cn(
                      "h-6 w-6",
                      (todayStats?.clarity_score || 0) >= 0.8 ? "text-chart-2" : "text-muted-foreground"
                    )} />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Mesure la proportion de tâches avec estimation de temps ET échéance claire
                  </p>

                  <div className="p-3 rounded-lg bg-muted/30 text-xs font-mono">
                    clarity_score = tasks_with(estimate + due_date) / total_tasks
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      (todayStats?.clarity_score || 0) >= 0.8 ? "bg-chart-2" : "bg-chart-4"
                    )} />
                    <span className="text-sm">
                      {(todayStats?.clarity_score || 0) >= 0.8 
                        ? "Excellente clarté — Vous êtes bien organisé" 
                        : "Clarté améliorable — Ajoutez estimations et échéances"}
                    </span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/kanban')}
                >
                  Améliorer mes tâches
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* QUICK ACTIONS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Actions Rapides
          </CardTitle>
          <CardDescription>Explorez vos données en profondeur</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2 hover:bg-primary/5"
              onClick={() => navigate('/bi/executive')}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span className="font-medium">Vue Exécutive</span>
              </div>
              <span className="text-xs text-muted-foreground">Dashboard BI complet</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2 hover:bg-primary/5"
              onClick={() => navigate('/bi/behavior-trends')}
            >
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <span className="font-medium">Tendances</span>
              </div>
              <span className="text-xs text-muted-foreground">Analyse comportement</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2 hover:bg-primary/5"
              onClick={() => navigate('/')}
            >
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <span className="font-medium">Identity</span>
              </div>
              <span className="text-xs text-muted-foreground">Qui je deviens</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2 hover:bg-primary/5"
              onClick={() => navigate('/ai-interventions')}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="font-medium">Interventions IA</span>
              </div>
              <span className="text-xs text-muted-foreground">Actions automatiques</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* NO DATA STATE */}
      {!todayStats && !weekStats?.length && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto">
                <BarChart3 className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Aucune donnée disponible</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Commencez à utiliser l'application pour voir vos statistiques.
                Les données sont calculées automatiquement chaque nuit.
              </p>
              <Button onClick={() => navigate('/kanban')}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Créer mes premières tâches
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
