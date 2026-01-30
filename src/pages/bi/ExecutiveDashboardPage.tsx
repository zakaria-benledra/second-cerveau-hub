import { useNavigate } from 'react-router-dom';
import { useTodayScore, useScoreHistory } from '@/hooks/useScores';
import { useAllTasks } from '@/hooks/useTasks';
import { useHabitsWithLogs } from '@/hooks/useHabits';
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
  const { data: todayScore, isLoading } = useTodayScore();
  const { data: scoreHistory = [] } = useScoreHistory(7);
  const { data: tasks = [] } = useAllTasks();
  const { data: habitsData = [] } = useHabitsWithLogs();

  const habits = habitsData;
  const activeTasks = tasks.filter(t => t.status !== 'done');
  const completedToday = tasks.filter(t => 
    t.status === 'done' && 
    t.completed_at && 
    new Date(t.completed_at).toDateString() === new Date().toDateString()
  );

  // Radar data for score breakdown
  const radarData = todayScore ? [
    { subject: 'Habitudes', value: todayScore.habits_score || 0, fullMark: 100 },
    { subject: 'Tâches', value: todayScore.tasks_score || 0, fullMark: 100 },
    { subject: 'Finance', value: todayScore.finance_score || 0, fullMark: 100 },
    { subject: 'Santé', value: todayScore.health_score || 0, fullMark: 100 },
  ] : [];

  // Weekly trend data
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
            Vue d'ensemble de votre performance
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/bi/behavior')}>
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

      {/* KPI Cards */}
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
                <div className="text-2xl font-bold">{todayScore?.habits_score?.toFixed(0) || 0}%</div>
                <div className="text-sm text-muted-foreground">Habitudes</div>
              </div>
            </div>
            <Progress value={todayScore?.habits_score || 0} className="mt-3 h-1" />
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
                <div className="text-2xl font-bold">{todayScore?.tasks_score?.toFixed(0) || 0}%</div>
                <div className="text-sm text-muted-foreground">Tâches</div>
              </div>
            </div>
            <Progress value={todayScore?.tasks_score || 0} className="mt-3 h-1" />
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => navigate('/finance')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-3/10">
                <Wallet className="h-6 w-6 text-chart-3" />
              </div>
              <div>
                <div className="text-2xl font-bold">{todayScore?.finance_score?.toFixed(0) || 0}%</div>
                <div className="text-sm text-muted-foreground">Finance</div>
              </div>
            </div>
            <Progress value={todayScore?.finance_score || 0} className="mt-3 h-1" />
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => navigate('/focus')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-4/10">
                <Heart className="h-6 w-6 text-chart-4" />
              </div>
              <div>
                <div className="text-2xl font-bold">{todayScore?.health_score?.toFixed(0) || 0}%</div>
                <div className="text-sm text-muted-foreground">Santé</div>
              </div>
            </div>
            <Progress value={todayScore?.health_score || 0} className="mt-3 h-1" />
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trend */}
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{activeTasks.length}</div>
                <div className="text-sm text-muted-foreground">Tâches actives</div>
              </div>
              <CheckSquare className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{completedToday.length}</div>
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
                <div className="text-3xl font-bold">{habits.filter((h: any) => h.is_active).length}</div>
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
