import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScoreRing } from '@/components/today/ScoreRing';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTodayScore, useScoreHistory } from '@/hooks/useScores';
import { useTransactions } from '@/hooks/useFinance';
import { cn } from '@/lib/utils';
import { 
  Target, 
  TrendingUp, 
  TrendingDown,
  PiggyBank,
  ShoppingBag,
  AlertTriangle,
  Sparkles,
  Clock,
  Calendar,
  CreditCard,
  Coffee,
  PartyPopper,
  Moon,
  Sun,
  Loader2,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { format, getDay, getHours, parseISO, isWeekend, isFriday, isMonday, startOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SpendingPattern {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  type: 'warning' | 'positive' | 'info';
  frequency?: number;
}

export function FinanceDisciplineTab() {
  const currentMonth = format(new Date(), 'yyyy-MM');
  const { data: todayScore, isLoading: isLoadingScore } = useTodayScore();
  const { data: scoreHistory = [] } = useScoreHistory(30);
  const { data: transactions = [], isLoading: isLoadingTransactions } = useTransactions(currentMonth);

  // Get financial discipline metrics from today's score
  const disciplineMetrics = useMemo(() => {
    if (!todayScore) {
      return {
        score: 0,
        budgetAdherence: 0,
        impulsiveSpending: 0,
        savingsRate: 0,
      };
    }

    // Access the new fields from scores_daily
    return {
      score: (todayScore as any).financial_discipline_score || 0,
      budgetAdherence: (todayScore as any).budget_adherence || 0,
      impulsiveSpending: (todayScore as any).impulsive_spending || 0,
      savingsRate: (todayScore as any).savings_rate || 0,
    };
  }, [todayScore]);

  // Analyze spending patterns
  const spendingPatterns = useMemo(() => {
    const patterns: SpendingPattern[] = [];
    
    if (transactions.length === 0) return patterns;

    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    
    if (expenseTransactions.length === 0) return patterns;

    // Analyze by day of week
    const dayOfWeekSpending: Record<number, { count: number; total: number }> = {};
    expenseTransactions.forEach(t => {
      const day = getDay(parseISO(t.date));
      if (!dayOfWeekSpending[day]) {
        dayOfWeekSpending[day] = { count: 0, total: 0 };
      }
      dayOfWeekSpending[day].count++;
      dayOfWeekSpending[day].total += Number(t.amount);
    });

    // Find highest spending day
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    let maxDay = 0;
    let maxAvg = 0;
    Object.entries(dayOfWeekSpending).forEach(([day, data]) => {
      const avg = data.total / Math.max(1, data.count);
      if (avg > maxAvg) {
        maxAvg = avg;
        maxDay = parseInt(day);
      }
    });

    // Weekend spending pattern
    const weekendSpending = expenseTransactions.filter(t => isWeekend(parseISO(t.date)));
    const weekdaySpending = expenseTransactions.filter(t => !isWeekend(parseISO(t.date)));
    const weekendAvg = weekendSpending.reduce((sum, t) => sum + Number(t.amount), 0) / Math.max(1, weekendSpending.length);
    const weekdayAvg = weekdaySpending.reduce((sum, t) => sum + Number(t.amount), 0) / Math.max(1, weekdaySpending.length);

    if (weekendAvg > weekdayAvg * 1.5 && weekendSpending.length > 2) {
      patterns.push({
        id: 'weekend-spending',
        icon: PartyPopper,
        title: 'Dépenses élevées le weekend',
        description: `Tu dépenses ${Math.round((weekendAvg / weekdayAvg - 1) * 100)}% de plus les weekends`,
        type: 'warning',
        frequency: weekendSpending.length,
      });
    }

    // Friday evening spending
    const fridayTransactions = expenseTransactions.filter(t => isFriday(parseISO(t.date)));
    if (fridayTransactions.length > 3) {
      const fridayTotal = fridayTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const avgTransaction = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0) / expenseTransactions.length;
      const fridayAvg = fridayTotal / fridayTransactions.length;
      
      if (fridayAvg > avgTransaction * 1.3) {
        patterns.push({
          id: 'friday-spending',
          icon: Moon,
          title: 'Dépenses impulsives le vendredi',
          description: 'Les vendredis sont tes jours les plus dépensiers',
          type: 'warning',
          frequency: fridayTransactions.length,
        });
      }
    }

    // Monday spending (start of week discipline)
    const mondayTransactions = expenseTransactions.filter(t => isMonday(parseISO(t.date)));
    if (mondayTransactions.length >= 2) {
      const mondayAvg = mondayTransactions.reduce((sum, t) => sum + Number(t.amount), 0) / mondayTransactions.length;
      const overallAvg = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0) / expenseTransactions.length;
      
      if (mondayAvg < overallAvg * 0.7) {
        patterns.push({
          id: 'monday-discipline',
          icon: Sun,
          title: 'Discipline du lundi ✓',
          description: 'Tu commences bien tes semaines avec des dépenses maîtrisées',
          type: 'positive',
        });
      }
    }

    // Small recurring expenses (coffee, subscriptions)
    const smallExpenses = expenseTransactions.filter(t => Number(t.amount) < 15);
    const smallExpensesTotal = smallExpenses.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    
    if (smallExpenses.length > 10 && smallExpensesTotal > totalExpenses * 0.15) {
      patterns.push({
        id: 'small-expenses',
        icon: Coffee,
        title: 'Attention aux petites dépenses',
        description: `${smallExpenses.length} petits achats (<15€) représentent ${Math.round(smallExpensesTotal / totalExpenses * 100)}% du total`,
        type: 'warning',
        frequency: smallExpenses.length,
      });
    }

    // Uncategorized transactions (impulsive indicator)
    const uncategorized = expenseTransactions.filter(t => !t.category_id);
    if (uncategorized.length > expenseTransactions.length * 0.3 && uncategorized.length > 3) {
      patterns.push({
        id: 'uncategorized',
        icon: ShoppingBag,
        title: 'Achats non planifiés',
        description: `${uncategorized.length} transactions sans catégorie (possible achats impulsifs)`,
        type: 'info',
        frequency: uncategorized.length,
      });
    }

    // Consistent spending pattern (positive)
    const dailyTotals = new Map<string, number>();
    expenseTransactions.forEach(t => {
      const current = dailyTotals.get(t.date) || 0;
      dailyTotals.set(t.date, current + Number(t.amount));
    });
    
    const dailyAmounts = Array.from(dailyTotals.values());
    if (dailyAmounts.length >= 7) {
      const mean = dailyAmounts.reduce((a, b) => a + b, 0) / dailyAmounts.length;
      const variance = dailyAmounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / dailyAmounts.length;
      const stdDev = Math.sqrt(variance);
      const cv = stdDev / mean; // Coefficient of variation
      
      if (cv < 0.5) {
        patterns.push({
          id: 'consistent-spending',
          icon: Target,
          title: 'Dépenses régulières ✓',
          description: 'Tes dépenses quotidiennes sont stables et prévisibles',
          type: 'positive',
        });
      }
    }

    // Check for budget improvements
    if (disciplineMetrics.budgetAdherence >= 80) {
      patterns.push({
        id: 'budget-adherence',
        icon: CheckCircle2,
        title: 'Respect du budget ✓',
        description: `${Math.round(disciplineMetrics.budgetAdherence)}% de tes catégories sont dans le budget`,
        type: 'positive',
      });
    }

    return patterns;
  }, [transactions, disciplineMetrics.budgetAdherence]);

  // Generate AI alerts
  const aiAlerts = useMemo(() => {
    const alerts: { title: string; description: string; severity: 'warning' | 'destructive' }[] = [];

    if (disciplineMetrics.impulsiveSpending > 50) {
      alerts.push({
        title: '⚠️ Achats impulsifs détectés',
        description: `${Math.round(disciplineMetrics.impulsiveSpending)}% de tes dépenses semblent non planifiées. Essaie de catégoriser tes transactions et de planifier tes achats.`,
        severity: 'warning',
      });
    }

    if (disciplineMetrics.savingsRate < 5 && disciplineMetrics.savingsRate >= 0) {
      alerts.push({
        title: '💰 Épargne insuffisante',
        description: `Ton taux d'épargne est de ${Math.round(disciplineMetrics.savingsRate)}%. L'objectif recommandé est de 20% minimum.`,
        severity: 'warning',
      });
    }

    if (disciplineMetrics.savingsRate < 0) {
      alerts.push({
        title: '🚨 Dépenses supérieures aux revenus',
        description: 'Tu dépenses plus que tu ne gagnes ce mois-ci. Revois ton budget immédiatement.',
        severity: 'destructive',
      });
    }

    if (disciplineMetrics.budgetAdherence < 50 && disciplineMetrics.budgetAdherence > 0) {
      alerts.push({
        title: '📊 Budgets dépassés',
        description: `Seulement ${Math.round(disciplineMetrics.budgetAdherence)}% de tes catégories respectent le budget. Ajuste tes limites ou réduis tes dépenses.`,
        severity: 'warning',
      });
    }

    return alerts;
  }, [disciplineMetrics]);

  // Trend from score history
  const trend = useMemo(() => {
    if (scoreHistory.length < 7) return null;
    
    const recent = scoreHistory.slice(-7);
    const firstHalf = recent.slice(0, 3).map(s => (s as any).financial_discipline_score || 0);
    const secondHalf = recent.slice(-3).map(s => (s as any).financial_discipline_score || 0);
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    return {
      direction: secondAvg >= firstAvg ? 'up' : 'down',
      change: Math.abs(secondAvg - firstAvg),
    };
  }, [scoreHistory]);

  const isLoading = isLoadingScore || isLoadingTransactions;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Score & Breakdown */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Central Score */}
        <Card className="glass-strong md:row-span-2">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg">Score de Discipline</CardTitle>
            <CardDescription>Basé sur ton comportement financier</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-4">
            <ScoreRing
              value={disciplineMetrics.score}
              size="xl"
              label="Discipline"
              sublabel="Financière"
            />
            {trend && (
              <div className="flex items-center gap-1 mt-4">
                {trend.direction === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <span className="text-xs text-muted-foreground">
                  {trend.direction === 'up' ? '+' : '-'}{trend.change.toFixed(1)}% cette semaine
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Breakdown Cards */}
        <Card className="glass-hover hover-lift">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-primary/15">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Respect du budget</p>
                <p className="text-2xl font-bold">{Math.round(disciplineMetrics.budgetAdherence)}%</p>
              </div>
            </div>
            <Progress 
              value={disciplineMetrics.budgetAdherence} 
              className={cn(
                "h-2",
                disciplineMetrics.budgetAdherence >= 80 && "[&>div]:bg-success",
                disciplineMetrics.budgetAdherence >= 50 && disciplineMetrics.budgetAdherence < 80 && "[&>div]:bg-warning",
                disciplineMetrics.budgetAdherence < 50 && "[&>div]:bg-destructive"
              )}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Catégories dans les limites budgétaires
            </p>
          </CardContent>
        </Card>

        <Card className="glass-hover hover-lift">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-warning/15">
                <ShoppingBag className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Dépenses impulsives</p>
                <p className="text-2xl font-bold">{Math.round(disciplineMetrics.impulsiveSpending)}%</p>
              </div>
            </div>
            <Progress 
              value={100 - disciplineMetrics.impulsiveSpending} 
              className={cn(
                "h-2",
                disciplineMetrics.impulsiveSpending <= 20 && "[&>div]:bg-success",
                disciplineMetrics.impulsiveSpending > 20 && disciplineMetrics.impulsiveSpending <= 40 && "[&>div]:bg-warning",
                disciplineMetrics.impulsiveSpending > 40 && "[&>div]:bg-destructive"
              )}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Transactions non planifiées / sans catégorie
            </p>
          </CardContent>
        </Card>

        <Card className="glass-hover hover-lift">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-success/15">
                <PiggyBank className="h-5 w-5 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Taux d'épargne</p>
                <p className={cn(
                  "text-2xl font-bold",
                  disciplineMetrics.savingsRate >= 20 && "text-success",
                  disciplineMetrics.savingsRate >= 10 && disciplineMetrics.savingsRate < 20 && "text-warning",
                  disciplineMetrics.savingsRate < 10 && "text-destructive"
                )}>
                  {Math.round(disciplineMetrics.savingsRate)}%
                </p>
              </div>
            </div>
            <Progress 
              value={Math.max(0, Math.min(100, disciplineMetrics.savingsRate * 2))} 
              className={cn(
                "h-2",
                disciplineMetrics.savingsRate >= 20 && "[&>div]:bg-success",
                disciplineMetrics.savingsRate >= 10 && disciplineMetrics.savingsRate < 20 && "[&>div]:bg-warning",
                disciplineMetrics.savingsRate < 10 && "[&>div]:bg-destructive"
              )}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Objectif recommandé : 20%+
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Alerts */}
      {aiAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Alertes IA
          </h3>
          {aiAlerts.map((alert, index) => (
            <Alert key={index} variant={alert.severity === 'destructive' ? 'destructive' : 'default'} className="glass-hover">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{alert.title}</AlertTitle>
              <AlertDescription>{alert.description}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Spending Patterns */}
      <Card className="glass-strong">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Tes Patterns de Dépenses
          </CardTitle>
          <CardDescription>
            Analyse comportementale basée sur tes transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {spendingPatterns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Pas assez de données pour détecter des patterns.</p>
              <p className="text-sm">Continue à enregistrer tes transactions !</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {spendingPatterns.map((pattern) => (
                <div
                  key={pattern.id}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-xl border transition-colors",
                    pattern.type === 'warning' && "bg-warning/5 border-warning/20",
                    pattern.type === 'positive' && "bg-success/5 border-success/20",
                    pattern.type === 'info' && "bg-primary/5 border-primary/20"
                  )}
                >
                  <div className={cn(
                    "p-2.5 rounded-xl",
                    pattern.type === 'warning' && "bg-warning/15",
                    pattern.type === 'positive' && "bg-success/15",
                    pattern.type === 'info' && "bg-primary/15"
                  )}>
                    <pattern.icon className={cn(
                      "h-5 w-5",
                      pattern.type === 'warning' && "text-warning",
                      pattern.type === 'positive' && "text-success",
                      pattern.type === 'info' && "text-primary"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{pattern.title}</h4>
                      {pattern.frequency && (
                        <Badge variant="outline" className="text-xs">
                          {pattern.frequency}x
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {pattern.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
