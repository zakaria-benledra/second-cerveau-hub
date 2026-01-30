import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useMonthlyBreakdown, useDailySpendingTrend, useBudgetVsActual, useExportFinanceData } from '@/hooks/useFinanceV2';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area
} from 'recharts';
import { Download, TrendingUp, TrendingDown, PiggyBank, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(220 70% 50%)',
  'hsl(280 70% 50%)',
  'hsl(160 70% 50%)',
  'hsl(30 70% 50%)',
  'hsl(340 70% 50%)',
];

export function FinanceVisuals() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const { data: breakdown, isLoading: breakdownLoading } = useMonthlyBreakdown(selectedMonth);
  const { data: dailyTrend } = useDailySpendingTrend(30);
  const { data: budgetComparison } = useBudgetVsActual(selectedMonth);
  const exportMutation = useExportFinanceData();

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const result = await exportMutation.mutateAsync({ format });
      
      if (format === 'csv') {
        const blob = new Blob([result], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `finance_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `finance_export_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
      
      toast.success(`Export ${format.toUpperCase()} téléchargé`);
    } catch {
      toast.error('Erreur lors de l\'export');
    }
  };

  const categoryData = breakdown?.categories.map((c, i) => ({
    name: c.name,
    value: c.amount,
    color: COLORS[i % COLORS.length],
  })) || [];

  const trendData = dailyTrend?.map((d) => ({
    date: new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    income: d.income,
    expenses: d.expenses,
    net: d.net,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenus</p>
                <p className="text-2xl font-bold text-green-500">
                  {breakdown?.totalIncome.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '0 €'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dépenses</p>
                <p className="text-2xl font-bold text-red-500">
                  {breakdown?.totalExpenses.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '0 €'}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Épargne Nette</p>
                <p className={`text-2xl font-bold ${(breakdown?.netSavings || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {breakdown?.netSavings.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '0 €'}
                </p>
              </div>
              <PiggyBank className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-border">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">Export</p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleExport('csv')}
                  disabled={exportMutation.isPending}
                >
                  <Download className="h-4 w-4 mr-1" />
                  CSV
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleExport('json')}
                  disabled={exportMutation.isPending}
                >
                  <Download className="h-4 w-4 mr-1" />
                  JSON
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="breakdown" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="breakdown">Répartition</TabsTrigger>
          <TabsTrigger value="trend">Tendance</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
        </TabsList>

        {/* Category Breakdown */}
        <TabsContent value="breakdown">
          <Card className="border-2 border-border">
            <CardHeader>
              <CardTitle>Répartition par Catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '2px solid hsl(var(--border))' 
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {categoryData.map((cat, i) => (
                    <div key={cat.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-sm">{cat.name}</span>
                      </div>
                      <span className="font-mono text-sm">
                        {cat.value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Daily Trend */}
        <TabsContent value="trend">
          <Card className="border-2 border-border">
            <CardHeader>
              <CardTitle>Tendance Quotidienne (30j)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      formatter={(value: number) => value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '2px solid hsl(var(--border))' 
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="income" 
                      stackId="1"
                      stroke="hsl(142 76% 36%)" 
                      fill="hsl(142 76% 36%)" 
                      fillOpacity={0.3}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expenses" 
                      stackId="2"
                      stroke="hsl(0 84% 60%)" 
                      fill="hsl(0 84% 60%)" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Budget vs Actual */}
        <TabsContent value="budget">
          <Card className="border-2 border-border">
            <CardHeader>
              <CardTitle>Budget vs Réel</CardTitle>
            </CardHeader>
            <CardContent>
              {budgetComparison && budgetComparison.length > 0 ? (
                <div className="space-y-4">
                  {budgetComparison.map((b) => (
                    <div key={b.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{b.category}</span>
                        <span className={`text-sm ${b.overBudget ? 'text-red-500' : 'text-muted-foreground'}`}>
                          {b.spent.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} / {b.budget.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </span>
                      </div>
                      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${b.overBudget ? 'bg-red-500' : 'bg-primary'}`}
                          style={{ width: `${Math.min(b.percentUsed, 100)}%` }}
                        />
                      </div>
                      {b.overBudget && (
                        <div className="flex items-center gap-1 text-xs text-red-500">
                          <AlertCircle className="h-3 w-3" />
                          Dépassement de {Math.abs(b.remaining).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Aucun budget défini. Créez des budgets pour suivre vos dépenses.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
