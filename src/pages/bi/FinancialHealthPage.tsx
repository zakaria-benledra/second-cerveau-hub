/**
 * Financial Health Dashboard - BI Contract Compliant
 * 
 * IMPORTANT: This dashboard reads ONLY from:
 * - scores_daily (finance_score via useFinanceStatsBI)
 * - monthly_stats (via useFinanceStatsBI)
 * 
 * For operational finance data (transaction entry, budget management),
 * users should use the main Finance page (/finance).
 */

import { useFinanceStatsBI, useScoresDailyBI } from '@/hooks/useBIStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Wallet, TrendingUp, TrendingDown, AlertTriangle, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
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
import { BIBreadcrumb } from '@/components/bi/BIBreadcrumb';
import { EmptyChart } from '@/components/charts/EmptyChart';

export default function FinancialHealthPage() {
  const { financeScores, avgFinanceScore, financeTrend, isLoading } = useFinanceStatsBI(6);
  const { data: scores = [] } = useScoresDailyBI(30);

  // Prepare chart data from scores_daily
  const chartData = financeScores.map(s => ({
    date: format(parseISO(s.date), 'dd/MM', { locale: fr }),
    score: s.score,
  }));

  // Finance score distribution over time
  const weeklyAverages = [];
  for (let i = 0; i < scores.length; i += 7) {
    const week = scores.slice(i, i + 7);
    if (week.length > 0) {
      const avg = Math.round(week.reduce((sum, s) => sum + s.finance_score, 0) / week.length);
      weeklyAverages.push({
        week: `S${Math.floor(i / 7) + 1}`,
        score: avg,
      });
    }
  }

  // Calculate health status based on score
  const getHealthStatus = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-chart-2', bg: 'bg-chart-2/10' };
    if (score >= 60) return { label: 'Bon', color: 'text-chart-4', bg: 'bg-chart-4/10' };
    if (score >= 40) return { label: 'Attention', color: 'text-warning', bg: 'bg-warning/10' };
    return { label: 'Critique', color: 'text-destructive', bg: 'bg-destructive/10' };
  };

  const healthStatus = getHealthStatus(avgFinanceScore);

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
      <BIBreadcrumb currentPage="Santé Financière" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Wallet className="h-8 w-8 text-primary" />
            Santé Financière
            <Badge variant="secondary">BI</Badge>
          </h1>
          <p className="text-muted-foreground mt-1">
            Analyse de votre score financier
          </p>
        </div>
        <Link 
          to="/finance" 
          className="text-sm text-primary hover:underline flex items-center gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          Gérer mes finances
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={healthStatus.bg}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Wallet className={`h-8 w-8 ${healthStatus.color}`} />
              <div>
                <div className={`text-3xl font-bold ${healthStatus.color}`}>
                  {avgFinanceScore}%
                </div>
                <div className="text-sm text-muted-foreground">Score moyen (30j)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {financeTrend >= 0 ? (
                <TrendingUp className="h-8 w-8 text-chart-2" />
              ) : (
                <TrendingDown className="h-8 w-8 text-destructive" />
              )}
              <div>
                <div className={`text-2xl font-bold ${financeTrend >= 0 ? 'text-chart-2' : 'text-destructive'}`}>
                  {financeTrend >= 0 ? '+' : ''}{financeTrend}%
                </div>
                <div className="text-sm text-muted-foreground">Tendance (7j)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${healthStatus.bg}`}>
                <AlertTriangle className={`h-6 w-6 ${healthStatus.color}`} />
              </div>
              <div>
                <div className={`text-xl font-bold ${healthStatus.color}`}>
                  {healthStatus.label}
                </div>
                <div className="text-sm text-muted-foreground">État</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Objectif</span>
                <span className="font-bold">{avgFinanceScore}/100</span>
              </div>
              <Progress value={avgFinanceScore} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Cible: 80%+
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Finance Score Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution du score financier</CardTitle>
          <CardDescription>Données issues de scores_daily (30 jours)</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <EmptyChart height={300} message="Aucune donnée de score disponible" />
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorFinance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    interval={Math.floor(chartData.length / 7)}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }} 
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value}%`, 'Score Finance']}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    fill="url(#colorFinance)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Comparison */}
      {weeklyAverages.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Comparaison hebdomadaire</CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyAverages.length === 0 ? (
              <EmptyChart height={200} message="Pas assez de données hebdomadaires" />
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyAverages}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 4, strokeWidth: 2 }}
                      name="Score moyen"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <BarChart3 className="h-8 w-8 text-primary mt-1" />
            <div>
              <h3 className="font-semibold">Mode BI activé</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Ce dashboard affiche les scores agrégés depuis la table <code className="px-1 py-0.5 bg-muted rounded text-xs">scores_daily</code>.
                Pour gérer vos transactions et budgets, utilisez la{' '}
                <Link to="/finance" className="text-primary hover:underline">page Finance</Link>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
