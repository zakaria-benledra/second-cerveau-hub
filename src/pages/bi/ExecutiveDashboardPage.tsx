/**
 * Executive Dashboard - BI Contract Compliant
 * 
 * IMPORTANT: This dashboard reads ONLY from:
 * - scores_daily (via useTodayScore, useScoreHistory)
 * - daily_stats (via useExecutiveKPIs)
 * 
 * It does NOT query core tables (tasks, habits, etc.) directly.
 */

import { useNavigate } from 'react-router-dom';
import { useTodayScore, useScoreHistory } from '@/hooks/useScores';
import { useExecutiveKPIs, useDailyStats } from '@/hooks/useBIStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  CheckSquare,
  Wallet,
  Heart,
  Brain,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Zap,
  Clock,
  Activity,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ExecutiveDashboardPage() {
  const navigate = useNavigate();
  const { data: todayScore, isLoading: scoreLoading } = useTodayScore();
  const { data: scoreHistory = [] } = useScoreHistory(7);
  const { kpis, isLoading: kpisLoading } = useExecutiveKPIs();
  const { data: dailyStats = [] } = useDailyStats(7);

  const isLoading = scoreLoading || kpisLoading;

  // Radar data for score breakdown (from scores_daily)
  const radarData = todayScore ? [
    { subject: 'Habitudes', value: todayScore.habits_score || 0, fullMark: 100 },
    { subject: 'Tâches', value: todayScore.tasks_score || 0, fullMark: 100 },
    { subject: 'Finance', value: todayScore.finance_score || 0, fullMark: 100 },
    { subject: 'Santé', value: todayScore.health_score || 0, fullMark: 100 },
  ] : [];

  // Weekly trend data (from scores_daily)
  const weeklyData = scoreHistory.map(s => ({
    date: format(new Date(s.date), 'EEE', { locale: fr }),
    score: s.global_score || 0,
  }));

  const getTrendIcon = () => {
    if (!todayScore) return <Minus className="h-5 w-5" />;
    const momentum = todayScore.momentum_index || 50;
    if (momentum > 55) return <TrendingUp className="h-5 w-5 text-chart-2" />;
    if (momentum < 45) return <TrendingDown className="h-5 w-5 text-destructive" />;
    return <Minus className="h-5 w-5 text-muted-foreground" />;
  };

  // Get active task/habit counts from daily_stats (last day)
  const latestStats = dailyStats.length > 0 ? dailyStats[dailyStats.length - 1] : null;
  const todayCompleted = latestStats?.tasks_completed || 0;
  const activeTasks = latestStats?.tasks_planned || 0;
  const activeHabits = latestStats?.habits_total || 0;

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Dashboard Exécutif
          </h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble de votre performance (BI Mode)
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/bi/behavior-trends')}>
          Tendances
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Main Score Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Score Global</CardTitle>
            <CardDescription>Performance quotidienne</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="relative">
                <div className="text-6xl font-bold text-primary">
                  {todayScore?.global_score?.toFixed(0) || 0}
                </div>
                <div className="absolute -right-8 top-0">
                  {getTrendIcon()}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-xl font-bold">{todayScore?.momentum_index?.toFixed(0) || 50}%</div>
                <div className="text-xs text-muted-foreground">Momentum</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-xl font-bold">{todayScore?.burnout_index?.toFixed(0) || 0}%</div>
                <div className="text-xs text-muted-foreground">Burnout</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Répartition des scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards - Using BI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card 
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => navigate('/habits')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-1/10">
                <Target className="h-6 w-6 text-chart-1" />
              </div>
              <div>
                <div className="text-2xl font-bold">{kpis.habitAdherence}%</div>
                <div className="text-sm text-muted-foreground">Habitudes (7j)</div>
              </div>
            </div>
            <Progress value={kpis.habitAdherence} className="mt-3 h-1" />
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => navigate('/tasks')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-2/10">
                <CheckSquare className="h-6 w-6 text-chart-2" />
              </div>
              <div>
                <div className="text-2xl font-bold">{kpis.taskCompletionRate}%</div>
                <div className="text-sm text-muted-foreground">Tâches (7j)</div>
              </div>
            </div>
            <Progress value={kpis.taskCompletionRate} className="mt-3 h-1" />
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => navigate('/focus')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-3/10">
                <Clock className="h-6 w-6 text-chart-3" />
              </div>
              <div>
                <div className="text-2xl font-bold">{kpis.avgFocusPerDay} min</div>
                <div className="text-sm text-muted-foreground">Focus/jour</div>
              </div>
            </div>
            <Progress value={Math.min(100, (kpis.avgFocusPerDay / 240) * 100)} className="mt-3 h-1" />
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => navigate('/finance')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-4/10">
                <Wallet className="h-6 w-6 text-chart-4" />
              </div>
              <div>
                <div className="text-2xl font-bold">{todayScore?.finance_score?.toFixed(0) || 0}%</div>
                <div className="text-sm text-muted-foreground">Finance</div>
              </div>
            </div>
            <Progress value={todayScore?.finance_score || 0} className="mt-3 h-1" />
          </CardContent>
        </Card>
      </div>

      {/* Quick Links - Analyses Détaillées */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Analyses Détaillées</CardTitle>
          <CardDescription>
            Explorez vos données en profondeur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => navigate('/bi/behavior-trends')}
            >
              <Activity className="mr-2 h-4 w-4" />
              Tendances Comportement
            </Button>
            
            <Button 
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/bi/financial-health')}
            >
              <Wallet className="mr-2 h-4 w-4" />
              Santé Financière
            </Button>
            
            <Button 
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/bi/habit-stability')}
            >
              <Target className="mr-2 h-4 w-4" />
              Stabilité Habitudes
            </Button>
            
            <Button 
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/bi/decision-impact')}
            >
              <Zap className="mr-2 h-4 w-4" />
              Impact Décisions
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tendance sur 7 jours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats from daily_stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{activeTasks}</div>
                <div className="text-sm text-muted-foreground">Tâches planifiées</div>
              </div>
              <CheckSquare className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{todayCompleted}</div>
                <div className="text-sm text-muted-foreground">Complétées aujourd'hui</div>
              </div>
              <Zap className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{activeHabits}</div>
                <div className="text-sm text-muted-foreground">Habitudes actives</div>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {todayScore && (todayScore.burnout_index > 60 || todayScore.momentum_index < 40) && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <h3 className="font-semibold">Attention requise</h3>
                <p className="text-sm text-muted-foreground">
                  {todayScore.burnout_index > 60 && "Risque de burnout élevé. "}
                  {todayScore.momentum_index < 40 && "Momentum en baisse. "}
                  Consultez l'AI Coach pour des recommandations.
                </p>
              </div>
              <Button variant="outline" className="ml-auto" onClick={() => navigate('/ai-coach')}>
                <Brain className="h-4 w-4 mr-2" />
                Consulter
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
