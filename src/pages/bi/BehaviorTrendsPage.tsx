import { useScoreHistory } from '@/hooks/useScores';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function BehaviorTrendsPage() {
  const { data: scoreHistory = [], isLoading } = useScoreHistory(14);

  // Transform data for charts
  const chartData = scoreHistory.map(s => ({
    date: format(new Date(s.date), 'dd/MM', { locale: fr }),
    fullDate: s.date,
    global: s.global_score || 0,
    habits: s.habits_score || 0,
    tasks: s.tasks_score || 0,
    finance: s.finance_score || 0,
    health: s.health_score || 0,
    momentum: s.momentum_index || 50,
    burnout: s.burnout_index || 0,
  }));

  // Calculate trends
  const calculateTrend = (key: 'global' | 'habits' | 'tasks' | 'momentum') => {
    if (chartData.length < 2) return 0;
    const recent = chartData.slice(-3);
    const older = chartData.slice(0, 3);
    const recentAvg = recent.reduce((a, b) => a + b[key], 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b[key], 0) / older.length;
    return recentAvg - olderAvg;
  };

  const trends = {
    global: calculateTrend('global'),
    habits: calculateTrend('habits'),
    tasks: calculateTrend('tasks'),
    momentum: calculateTrend('momentum'),
  };

  const TrendIndicator = ({ value }: { value: number }) => {
    if (value > 5) return <TrendingUp className="h-4 w-4 text-chart-2" />;
    if (value < -5) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
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
      <div>
        <h1 className="text-3xl font-bold">Tendances Comportementales</h1>
        <p className="text-muted-foreground mt-1">
          Analyse de l'évolution de vos habitudes et performances
        </p>
      </div>

      {/* Trend Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Score Global</div>
                <div className="text-2xl font-bold flex items-center gap-2">
                  {trends.global > 0 ? '+' : ''}{trends.global.toFixed(1)}
                  <TrendIndicator value={trends.global} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Habitudes</div>
                <div className="text-2xl font-bold flex items-center gap-2">
                  {trends.habits > 0 ? '+' : ''}{trends.habits.toFixed(1)}
                  <TrendIndicator value={trends.habits} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Tâches</div>
                <div className="text-2xl font-bold flex items-center gap-2">
                  {trends.tasks > 0 ? '+' : ''}{trends.tasks.toFixed(1)}
                  <TrendIndicator value={trends.tasks} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Momentum</div>
                <div className="text-2xl font-bold flex items-center gap-2">
                  {trends.momentum > 0 ? '+' : ''}{trends.momentum.toFixed(1)}
                  <TrendIndicator value={trends.momentum} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart - All Scores */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution des scores</CardTitle>
          <CardDescription>Tous les indicateurs sur 14 jours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
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
                <Legend />
                <Line type="monotone" dataKey="habits" name="Habitudes" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="tasks" name="Tâches" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="finance" name="Finance" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="health" name="Santé" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Momentum vs Burnout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Momentum</CardTitle>
            <CardDescription>Tendance positive = amélioration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="momentum"
                    stroke="hsl(var(--chart-2))"
                    fill="hsl(var(--chart-2))"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Indice de Burnout</CardTitle>
            <CardDescription>À surveiller si supérieur à 60%</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="burnout"
                    stroke="hsl(var(--destructive))"
                    fill="hsl(var(--destructive))"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Comparaison quotidienne</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="global" name="Score Global" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
