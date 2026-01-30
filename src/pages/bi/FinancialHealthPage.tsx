import { useTransactions, useCategories, useBudgets } from '@/hooks/useFinance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Wallet, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function FinancialHealthPage() {
  const { data: transactions = [], isLoading: txLoading } = useTransactions();
  const { data: categories = [] } = useCategories();
  const { data: budgets = [] } = useBudgets();

  const isLoading = txLoading;

  // Calculate totals
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = income - expenses;
  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.monthly_limit), 0);
  const budgetUsage = totalBudget > 0 ? (expenses / totalBudget) * 100 : 0;

  // Expenses by category
  const expensesByCategory = categories
    .filter(c => c.type === 'expense')
    .map((category, index) => {
      const categoryExpenses = transactions
        .filter(t => t.category_id === category.id && t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      return {
        name: category.name,
        value: categoryExpenses,
        color: category.color || COLORS[index % COLORS.length],
      };
    })
    .filter(c => c.value > 0);

  // Budget status per category
  const budgetStatus = budgets.map(budget => {
    const category = categories.find(c => c.id === budget.category_id);
    const spent = transactions
      .filter(t => t.category_id === budget.category_id && t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const percentage = (spent / Number(budget.monthly_limit)) * 100;
    return {
      category: category?.name || 'Sans catégorie',
      limit: Number(budget.monthly_limit),
      spent,
      percentage: Math.min(percentage, 100),
      overBudget: percentage > 100,
    };
  });

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
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Wallet className="h-8 w-8 text-primary" />
          Santé Financière
        </h1>
        <p className="text-muted-foreground mt-1">
          Analyse de vos finances et budgets
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-chart-2" />
              <div>
                <div className="text-2xl font-bold text-chart-2">{income.toLocaleString('fr-FR')} €</div>
                <div className="text-sm text-muted-foreground">Revenus</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-8 w-8 text-destructive" />
              <div>
                <div className="text-2xl font-bold text-destructive">{expenses.toLocaleString('fr-FR')} €</div>
                <div className="text-sm text-muted-foreground">Dépenses</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Wallet className="h-8 w-8 text-primary" />
              <div>
                <div className={`text-2xl font-bold ${balance >= 0 ? 'text-chart-2' : 'text-destructive'}`}>
                  {balance.toLocaleString('fr-FR')} €
                </div>
                <div className="text-sm text-muted-foreground">Balance</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={budgetUsage > 90 ? 'border-destructive' : ''}>
          <CardContent className="pt-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Budget utilisé</span>
                <span className="font-bold">{budgetUsage.toFixed(0)}%</span>
              </div>
              <Progress value={budgetUsage} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart - Expenses by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des dépenses</CardTitle>
          </CardHeader>
          <CardContent>
            {expensesByCategory.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Aucune dépense enregistrée
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => `${value.toLocaleString('fr-FR')} €`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget Status */}
        <Card>
          <CardHeader>
            <CardTitle>État des budgets</CardTitle>
          </CardHeader>
          <CardContent>
            {budgetStatus.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Aucun budget configuré
              </div>
            ) : (
              <div className="space-y-4">
                {budgetStatus.map((budget, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{budget.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {budget.spent.toLocaleString('fr-FR')} / {budget.limit.toLocaleString('fr-FR')} €
                        </span>
                        {budget.overBudget && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    </div>
                    <Progress 
                      value={budget.percentage} 
                      className={`h-2 ${budget.overBudget ? '[&>div]:bg-destructive' : ''}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {budgetStatus.some(b => b.overBudget) && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <h3 className="font-semibold">Budgets dépassés</h3>
                <p className="text-sm text-muted-foreground">
                  {budgetStatus.filter(b => b.overBudget).map(b => b.category).join(', ')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
