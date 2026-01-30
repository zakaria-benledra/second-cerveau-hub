import * as React from 'react';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFinanceSnapshots, useDailySpendingTrend, useMonthlyBreakdown } from '@/hooks/useFinanceV2';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area, LineChart, Line, Legend
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Target,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatedContainer } from '@/components/ui/animated-container';
import { Link } from 'react-router-dom';
import { format, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(262 83% 58%)',
  'hsl(142 76% 36%)',
  'hsl(38 92% 50%)',
  'hsl(0 84% 60%)',
  'hsl(199 89% 48%)',
  'hsl(330 81% 60%)',
];

function FinanceVisualDashboardInner() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const { data: snapshots = [] } = useFinanceSnapshots();
  const { data: dailyTrend = [] } = useDailySpendingTrend(60);
  const { data: breakdown } = useMonthlyBreakdown(currentMonth);

  // Monthly burn-down data
  const burndownData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStr = format(date, 'yyyy-MM');
      const monthData = dailyTrend.filter(d => d.date.startsWith(monthStr));
      
      const income = monthData.reduce((sum, d) => sum + d.income, 0);
      const expenses = monthData.reduce((sum, d) => sum + d.expenses, 0);
      
      months.push({
        month: format(date, 'MMM', { locale: fr }),
        income,
        expenses,
        net: income - expenses,
      });
    }
    return months;
  }, [dailyTrend]);

  // Category donut data
  const categoryData = useMemo(() => {
    return breakdown?.categories.slice(0, 8).map((c, i) => ({
      name: c.name,
      value: c.amount,
      color: COLORS[i % COLORS.length],
      percentage: breakdown.totalExpenses > 0 
        ? Math.round((c.amount / breakdown.totalExpenses) * 100) 
        : 0,
    })) || [];
  }, [breakdown]);

  // Anomaly detection from snapshots
  const anomalies = useMemo(() => {
    return snapshots
      .filter(s => s.snapshot_type === 'anomaly')
      .slice(0, 5)
      .map(s => ({
        date: s.date,
        amount: s.amount,
        category: s.category,
        trendIndex: s.trend_index,
      }));
  }, [snapshots]);

  // Income vs Expense trend
  const trendChartData = useMemo(() => {
    return dailyTrend.slice(-30).map(d => ({
      date: format(new Date(d.date), 'dd/MM', { locale: fr }),
      income: d.income,
      expenses: d.expenses,
    }));
  }, [dailyTrend]);

  const totalIncome = breakdown?.totalIncome || 0;
  const totalExpenses = breakdown?.totalExpenses || 0;
  const netSavings = breakdown?.netSavings || 0;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <AnimatedContainer animation="fade-up" delay={0}>
          <Card className="glass-strong hover-lift cursor-pointer" onClick={() => {}}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenus</p>
                  <p className="text-2xl font-bold text-success">
                    +{totalIncome.toLocaleString('fr-FR')} €
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-success/15">
                  <ArrowUpRight className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedContainer>

        <AnimatedContainer animation="fade-up" delay={50}>
          <Card className="glass-strong hover-lift cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Dépenses</p>
                  <p className="text-2xl font-bold text-destructive">
                    -{totalExpenses.toLocaleString('fr-FR')} €
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-destructive/15">
                  <ArrowDownRight className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedContainer>

        <AnimatedContainer animation="fade-up" delay={100}>
          <Card className="glass-strong hover-lift cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Épargne Nette</p>
                  <p className={cn(
                    'text-2xl font-bold',
                    netSavings >= 0 ? 'text-success' : 'text-destructive'
                  )}>
                    {netSavings >= 0 ? '+' : ''}{netSavings.toLocaleString('fr-FR')} €
                  </p>
                </div>
                <div className={cn(
                  'p-3 rounded-xl',
                  netSavings >= 0 ? 'bg-success/15' : 'bg-destructive/15'
                )}>
                  <Target className={cn(
                    'h-6 w-6',
                    netSavings >= 0 ? 'text-success' : 'text-destructive'
                  )} />
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedContainer>

        <AnimatedContainer animation="fade-up" delay={150}>
          <Card className="glass-strong hover-lift cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taux d'épargne</p>
                  <p className={cn(
                    'text-2xl font-bold',
                    savingsRate >= 20 ? 'text-success' : savingsRate >= 10 ? 'text-warning' : 'text-destructive'
                  )}>
                    {savingsRate}%
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-primary/15">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedContainer>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Burn-down */}
        <AnimatedContainer animation="fade-up" delay={200}>
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-primary" />
                Burn-down Mensuel
              </CardTitle>
              <CardDescription>Évolution revenus vs dépenses sur 6 mois</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={burndownData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      formatter={(value: number) => `${value.toLocaleString('fr-FR')} €`}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '2px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="income" name="Revenus" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Dépenses" fill="hsl(0 84% 60%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </AnimatedContainer>

        {/* Category Donut */}
        <AnimatedContainer animation="fade-up" delay={250}>
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-accent" />
                Répartition par Catégorie
              </CardTitle>
              <CardDescription>Distribution des dépenses ce mois</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => `${value.toLocaleString('fr-FR')} €`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 overflow-auto max-h-48">
                  {categoryData.map((cat) => (
                    <Link 
                      key={cat.name} 
                      to={`/finance?category=${cat.name}`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-sm truncate">{cat.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{cat.percentage}%</span>
                    </Link>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedContainer>

        {/* Income vs Expense Trend */}
        <AnimatedContainer animation="fade-up" delay={300}>
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-success" />
                Tendance 30 jours
              </CardTitle>
              <CardDescription>Évolution quotidienne revenus et dépenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      formatter={(value: number) => `${value.toLocaleString('fr-FR')} €`}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '2px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="income" 
                      name="Revenus"
                      stroke="hsl(142 76% 36%)" 
                      fill="hsl(142 76% 36%)" 
                      fillOpacity={0.2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expenses" 
                      name="Dépenses"
                      stroke="hsl(0 84% 60%)" 
                      fill="hsl(0 84% 60%)" 
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </AnimatedContainer>

        {/* Anomaly Timeline */}
        <AnimatedContainer animation="fade-up" delay={350}>
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Anomalies Détectées
              </CardTitle>
              <CardDescription>Transactions inhabituelles à vérifier</CardDescription>
            </CardHeader>
            <CardContent>
              {anomalies.length > 0 ? (
                <div className="space-y-3">
                  {anomalies.map((a, i) => (
                    <div 
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20"
                    >
                      <div>
                        <p className="font-medium">{a.category || 'Non catégorisé'}</p>
                        <p className="text-xs text-muted-foreground">{a.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-warning">
                          {a.amount.toLocaleString('fr-FR')} €
                        </p>
                        {a.trendIndex && (
                          <Badge variant="outline" className="text-xs">
                            {a.trendIndex > 1 ? '+' : ''}{Math.round((a.trendIndex - 1) * 100)}% vs moy.
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune anomalie détectée</p>
                  <p className="text-sm">Vos dépenses sont dans les normes</p>
                </div>
              )}
            </CardContent>
          </Card>
        </AnimatedContainer>
      </div>
    </div>
  );
}

// ForwardRef wrapper for compatibility with Tab content
export const FinanceVisualDashboard = React.forwardRef<HTMLDivElement, Record<string, never>>(
  (_props, _ref) => <FinanceVisualDashboardInner />
);
FinanceVisualDashboard.displayName = 'FinanceVisualDashboard';
