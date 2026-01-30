import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTodayScore, useScoreHistory, useRecomputeScore } from '@/hooks/useScores';
import { 
  TrendingUp, 
  TrendingDown,
  Minus,
  RefreshCw,
  Loader2,
  Target,
  CheckSquare,
  Wallet,
  Heart,
  Flame,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { cn } from '@/lib/utils';

const scoreColors = {
  habits: 'hsl(var(--primary))',
  tasks: 'hsl(var(--accent))',
  finance: 'hsl(var(--warning))',
  health: 'hsl(var(--success))',
};

export default function ScoresPage() {
  const { data: todayScore, isLoading: scoreLoading } = useTodayScore();
  const { data: history, isLoading: historyLoading } = useScoreHistory(14);
  const recompute = useRecomputeScore();

  const getMomentumIcon = (momentum: number) => {
    if (momentum > 55) return <TrendingUp className="h-4 w-4 text-success" />;
    if (momentum < 45) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getBurnoutLevel = (burnout: number) => {
    if (burnout > 70) return { label: 'Critique', color: 'text-destructive', bg: 'bg-destructive/10' };
    if (burnout > 50) return { label: 'Élevé', color: 'text-warning', bg: 'bg-warning/10' };
    if (burnout > 30) return { label: 'Modéré', color: 'text-info', bg: 'bg-info/10' };
    return { label: 'Faible', color: 'text-success', bg: 'bg-success/10' };
  };

  const chartData = history?.map(s => ({
    date: new Date(s.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    global: s.global_score,
    habits: s.habits_score,
    tasks: s.tasks_score,
    finance: s.finance_score,
    health: s.health_score,
  })) || [];

  const burnoutInfo = todayScore ? getBurnoutLevel(todayScore.burnout_index) : null;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              Scores & Performance
            </h1>
            <p className="text-muted-foreground mt-1">
              Votre tableau de bord de performance personnelle
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => recompute.mutate(undefined)}
            disabled={recompute.isPending}
          >
            {recompute.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Recalculer
          </Button>
        </div>

        {scoreLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !todayScore ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun score disponible</h3>
              <p className="text-muted-foreground text-sm text-center mb-4">
                Commencez à utiliser l'application pour générer vos scores
              </p>
              <Button onClick={() => recompute.mutate(undefined)} disabled={recompute.isPending}>
                {recompute.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Calculer mes scores
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Global Score */}
            <Card className="overflow-hidden">
              <div className="gradient-primary p-6 text-primary-foreground">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-80">Score Global</p>
                    <div className="flex items-baseline gap-3">
                      <span className="text-5xl font-bold">
                        {Math.round(todayScore.global_score)}
                      </span>
                      <span className="text-2xl opacity-80">/ 100</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                      {getMomentumIcon(todayScore.momentum_index)}
                      <span className="text-sm font-medium">
                        Momentum: {Math.round(todayScore.momentum_index)}
                      </span>
                    </div>
                    <Badge className={cn('px-3', burnoutInfo?.bg, burnoutInfo?.color)}>
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Burnout: {burnoutInfo?.label}
                    </Badge>
                  </div>
                </div>
                <Progress 
                  value={todayScore.global_score} 
                  className="mt-4 h-3 bg-white/20"
                />
              </div>
            </Card>

            {/* Subscores Grid */}
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { 
                  label: 'Habitudes', 
                  score: todayScore.habits_score, 
                  icon: Target, 
                  color: 'primary',
                  weight: '35%',
                },
                { 
                  label: 'Tâches', 
                  score: todayScore.tasks_score, 
                  icon: CheckSquare, 
                  color: 'accent',
                  weight: '25%',
                },
                { 
                  label: 'Finances', 
                  score: todayScore.finance_score, 
                  icon: Wallet, 
                  color: 'warning',
                  weight: '20%',
                },
                { 
                  label: 'Santé', 
                  score: todayScore.health_score, 
                  icon: Heart, 
                  color: 'success',
                  weight: '20%',
                },
              ].map((item) => (
                <Card key={item.label} className="hover-lift">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className={cn(
                        'p-2 rounded-lg',
                        item.color === 'primary' && 'bg-primary/10',
                        item.color === 'accent' && 'bg-accent/10',
                        item.color === 'warning' && 'bg-warning/10',
                        item.color === 'success' && 'bg-success/10',
                      )}>
                        <item.icon className={cn(
                          'h-5 w-5',
                          item.color === 'primary' && 'text-primary',
                          item.color === 'accent' && 'text-accent',
                          item.color === 'warning' && 'text-warning',
                          item.color === 'success' && 'text-success',
                        )} />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {item.weight}
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold">{Math.round(item.score)}%</p>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <Progress 
                      value={item.score} 
                      className="mt-2 h-1.5"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Évolution sur 14 jours</CardTitle>
                <CardDescription>
                  Suivi de vos scores au fil du temps
                </CardDescription>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    Pas assez de données
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorGlobal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis domain={[0, 100]} className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="global"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#colorGlobal)"
                        name="Score Global"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Breakdown Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Détail par catégorie</CardTitle>
                <CardDescription>
                  Évolution de chaque sous-score
                </CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    Pas assez de données
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis domain={[0, 100]} className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="habits"
                        stroke={scoreColors.habits}
                        strokeWidth={2}
                        dot={false}
                        name="Habitudes"
                      />
                      <Line
                        type="monotone"
                        dataKey="tasks"
                        stroke={scoreColors.tasks}
                        strokeWidth={2}
                        dot={false}
                        name="Tâches"
                      />
                      <Line
                        type="monotone"
                        dataKey="finance"
                        stroke={scoreColors.finance}
                        strokeWidth={2}
                        dot={false}
                        name="Finances"
                      />
                      <Line
                        type="monotone"
                        dataKey="health"
                        stroke={scoreColors.health}
                        strokeWidth={2}
                        dot={false}
                        name="Santé"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
