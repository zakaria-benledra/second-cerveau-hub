import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { SageCompanion } from '@/components/sage';
import { usePageSage } from '@/hooks/usePageSage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useCategories, useCreateCategory, useTransactions, useCreateTransaction, useDeleteTransaction, useBudgets, useCreateBudget, useMonthlySpending } from '@/hooks/useFinance';
import { useDocuments, useDeleteDocument } from '@/hooks/useDocuments';
import { useGoals } from '@/hooks/useProjects';
import { useSavingsGoals, useCreateSavingsGoal, useContributeToGoal, useDeleteSavingsGoal } from '@/hooks/useSavingsGoals';
import { SavingsGoalCard } from '@/components/finance/SavingsGoalCard';
import { FinanceImportWizard } from '@/components/finance/FinanceImportWizard';
import { FinanceVisualDashboard } from '@/components/finance/FinanceVisualDashboard';
import { FinanceExportModal } from '@/components/finance/FinanceExportModal';
import { FinanceDisciplineTab } from '@/components/finance/FinanceDisciplineTab';
import { FinanceDisciplineCard } from '@/components/finance/FinanceDisciplineCard';
import { ScoreRing } from '@/components/today/ScoreRing';
import { useTodayScore } from '@/hooks/useScores';
import { cn } from '@/lib/utils';
import { 
  DollarSign, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank, 
  Trash2, 
  Upload, 
  FileText, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock,
  Target,
  AlertTriangle,
  ChevronRight,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Link2,
  BarChart3,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function FinancePage() {
  const currentMonth = format(new Date(), 'yyyy-MM');
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('transactions');
  const [newTransaction, setNewTransaction] = useState({ amount: '', description: '', category_id: '', type: 'expense', date: format(new Date(), 'yyyy-MM-dd'), goal_id: '' });
  const [newCategory, setNewCategory] = useState({ name: '', type: 'expense' });
  const [newBudget, setNewBudget] = useState({ category_id: '', monthly_limit: '' });

  const { data: categories = [] } = useCategories();
  const { data: transactions = [], isLoading } = useTransactions(currentMonth);
  const { data: budgets = [] } = useBudgets();
  const { data: monthlyStats } = useMonthlySpending(currentMonth);
  const { data: documents = [] } = useDocuments('bank_statement');
  const { data: goals = [] } = useGoals();
  const { data: savingsGoals = [] } = useSavingsGoals();
  const { data: todayScore } = useTodayScore();
  const { mood } = usePageSage('finance');
  const createTransaction = useCreateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const createCategory = useCreateCategory();
  const createBudget = useCreateBudget();
  const deleteDocument = useDeleteDocument();
  const contributeToGoal = useContributeToGoal();
  const deleteSavingsGoal = useDeleteSavingsGoal();

  // Calculate financial health score
  const financialHealth = useMemo(() => {
    const income = monthlyStats?.totalIncome || 0;
    const expenses = monthlyStats?.totalExpenses || 0;
    const savings = monthlyStats?.netSavings || 0;
    
    if (income === 0) return 50;
    
    const savingsRate = (savings / income) * 100;
    if (savingsRate >= 20) return 90;
    if (savingsRate >= 10) return 70;
    if (savingsRate >= 0) return 50;
    return 30;
  }, [monthlyStats]);

  // Budget utilization
  const budgetUtilization = useMemo(() => {
    return budgets.map(budget => {
      const category = categories.find(c => c.id === budget.category_id);
      const spent = transactions
        .filter(t => t.category_id === budget.category_id && t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const percentage = Math.round((spent / Number(budget.monthly_limit)) * 100);
      
      return {
        ...budget,
        categoryName: category?.name || 'Sans catégorie',
        spent,
        percentage: Math.min(percentage, 100),
        overspent: percentage > 100
      };
    });
  }, [budgets, transactions, categories]);

  const handleAddTransaction = () => {
    if (!newTransaction.amount) return;
    createTransaction.mutate({
      amount: parseFloat(newTransaction.amount),
      description: newTransaction.description || null,
      category_id: newTransaction.category_id || null,
      type: newTransaction.type,
      date: newTransaction.date,
    }, {
      onSuccess: () => {
        setNewTransaction({ amount: '', description: '', category_id: '', type: 'expense', date: format(new Date(), 'yyyy-MM-dd'), goal_id: '' });
        setIsTransactionOpen(false);
      }
    });
  };

  const handleAddCategory = () => {
    if (!newCategory.name) return;
    createCategory.mutate(newCategory, {
      onSuccess: () => {
        setNewCategory({ name: '', type: 'expense' });
        setIsCategoryOpen(false);
      }
    });
  };

  const handleAddBudget = () => {
    if (!newBudget.category_id || !newBudget.monthly_limit) return;
    createBudget.mutate({
      category_id: newBudget.category_id,
      monthly_limit: parseFloat(newBudget.monthly_limit),
    }, {
      onSuccess: () => {
        setNewBudget({ category_id: '', monthly_limit: '' });
        setIsBudgetOpen(false);
      }
    });
  };

  // File upload handling is now in FinanceImportWizard

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'processing': return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Spending by category for chart
  const spendingByCategory = useMemo(() => {
    const categoryMap = new Map<string, number>();
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const cat = categories.find(c => c.id === t.category_id)?.name || 'Autre';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + Number(t.amount));
    });
    return Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [transactions, categories]);

  const totalSpending = spendingByCategory.reduce((sum, [, amount]) => sum + amount, 0);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <GlobalHeader
          variant="page"
          title="Tes finances"
          subtitle={format(new Date(), 'MMMM yyyy', { locale: fr })}
          icon={<Wallet className="h-5 w-5 text-white" />}
          showStreak={false}
        />

        {/* Sage Companion */}
        <SageCompanion
          context="finance"
          mood={mood}
          data={{ score: todayScore?.financial_discipline_score || 50 }}
          variant="card"
          className="mb-6"
        />

        {/* Financial Discipline Card - Behavioral Score */}
        {todayScore && (
          <FinanceDisciplineCard
            score={todayScore.financial_discipline_score || 0}
            budgetAdherence={todayScore.budget_adherence || 0}
            impulsiveSpending={todayScore.impulsive_spending || 0}
            savingsRate={todayScore.savings_rate || 0}
          />
        )}

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-4">
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setIsExportOpen(true)}>
              <Download className="h-4 w-4" />
              Exporter
            </Button>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => setActiveTab('import')}
            >
              <Upload className="h-4 w-4" />
              Importer
            </Button>
            <Dialog open={isTransactionOpen} onOpenChange={setIsTransactionOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 gradient-primary">
                  <Plus className="h-4 w-4" />
                  Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-strong">
                <DialogHeader>
                  <DialogTitle>Nouvelle transaction</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={newTransaction.type} onValueChange={(type) => setNewTransaction({ ...newTransaction, type })}>
                      <SelectTrigger className="glass-hover">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">Dépense</SelectItem>
                        <SelectItem value="income">Revenu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Montant *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                      placeholder="0.00"
                      className="glass-hover"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                      placeholder="Courses, loyer..."
                      className="glass-hover"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Catégorie</Label>
                    <Select value={newTransaction.category_id} onValueChange={(category_id) => setNewTransaction({ ...newTransaction, category_id })}>
                      <SelectTrigger className="glass-hover">
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.filter(c => c.type === newTransaction.type).map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      Lier à un objectif
                    </Label>
                    <Select value={newTransaction.goal_id} onValueChange={(goal_id) => setNewTransaction({ ...newTransaction, goal_id })}>
                      <SelectTrigger className="glass-hover">
                        <SelectValue placeholder="Optionnel..." />
                      </SelectTrigger>
                      <SelectContent>
                        {goals.map(goal => (
                          <SelectItem key={goal.id} value={goal.id}>{goal.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={newTransaction.date}
                      onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                      className="glass-hover"
                    />
                  </div>
                  <Button onClick={handleAddTransaction} className="w-full gradient-primary" disabled={createTransaction.isPending}>
                    {createTransaction.isPending ? 'Ajout...' : 'Ajouter'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Financial Health Score & Summary */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="glass-strong md:row-span-2">
            <CardContent className="pt-6 flex flex-col items-center justify-center h-full">
              <ScoreRing
                value={financialHealth}
                size="xl"
                label="Santé"
                sublabel="Financière"
              />
              <div className="flex items-center gap-1 mt-4">
                {financialHealth >= 70 ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : financialHealth >= 50 ? (
                  <TrendingUp className="h-4 w-4 text-warning" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                )}
                <span className="text-xs text-muted-foreground">
                  {financialHealth >= 70 ? 'Excellent' : financialHealth >= 50 ? 'Correct' : 'Attention'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-hover hover-lift">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-success/15">
                  <ArrowUpRight className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-success tabular-nums">
                    +{(monthlyStats?.totalIncome || 0).toFixed(0)} €
                  </p>
                  <p className="text-xs text-muted-foreground">Revenus</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-hover hover-lift">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-destructive/15">
                  <ArrowDownRight className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-destructive tabular-nums">
                    -{(monthlyStats?.totalExpenses || 0).toFixed(0)} €
                  </p>
                  <p className="text-xs text-muted-foreground">Dépenses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-hover hover-lift">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/15">
                  <PiggyBank className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className={cn(
                    "text-2xl font-bold tabular-nums",
                    (monthlyStats?.netSavings || 0) >= 0 ? 'text-success' : 'text-destructive'
                  )}>
                    {(monthlyStats?.netSavings || 0) >= 0 ? '+' : ''}{(monthlyStats?.netSavings || 0).toFixed(0)} €
                  </p>
                  <p className="text-xs text-muted-foreground">Épargne</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-hover hover-lift">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-accent/15">
                  <Wallet className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">
                    {monthlyStats?.transactionCount || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Transactions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Spending by Category Mini Chart */}
          <Card className="glass-hover md:col-span-3">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Top catégories</span>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs text-primary gap-1">
                      Détails <ChevronRight className="h-3 w-3" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="glass-strong">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Dépenses par catégorie
                      </SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-4">
                      {spendingByCategory.map(([category, amount]) => (
                        <div key={category}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{category}</span>
                            <span className="font-medium">{amount.toFixed(0)} €</span>
                          </div>
                          <Progress 
                            value={totalSpending > 0 ? (amount / totalSpending) * 100 : 0} 
                            className="h-2"
                          />
                        </div>
                      ))}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
              <div className="space-y-2">
                {spendingByCategory.slice(0, 3).map(([category, amount]) => (
                  <div key={category} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="truncate">{category}</span>
                        <span className="font-medium tabular-nums">{amount.toFixed(0)} €</span>
                      </div>
                      <Progress 
                        value={totalSpending > 0 ? (amount / totalSpending) * 100 : 0} 
                        className="h-1.5"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="glass-strong flex-wrap">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="discipline">🎯 Discipline</TabsTrigger>
            <TabsTrigger value="visuals">📊 Visuels</TabsTrigger>
            <TabsTrigger value="import">📥 Import</TabsTrigger>
            <TabsTrigger value="savings">Épargne</TabsTrigger>
            <TabsTrigger value="budgets">Budgets</TabsTrigger>
            <TabsTrigger value="statements">Relevés</TabsTrigger>
            <TabsTrigger value="categories">Catégories</TabsTrigger>
          </TabsList>

          {/* Discipline Tab */}
          <TabsContent value="discipline">
            <FinanceDisciplineTab />
          </TabsContent>

          {/* Visual Dashboard Tab */}
          <TabsContent value="visuals">
            <FinanceVisualDashboard />
          </TabsContent>

          {/* Import Wizard Tab */}
          <TabsContent value="import">
            <FinanceImportWizard onComplete={() => setActiveTab('transactions')} />
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                Chargement...
              </div>
            ) : transactions.length === 0 ? (
              <Card className="glass border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    Aucune transaction ce mois-ci.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="glass-strong overflow-hidden">
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-muted/30 group transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2.5 rounded-xl",
                            tx.type === 'income' ? 'bg-success/15' : 'bg-destructive/15'
                          )}>
                            {tx.type === 'income' ? 
                              <ArrowUpRight className="h-4 w-4 text-success" /> : 
                              <ArrowDownRight className="h-4 w-4 text-destructive" />
                            }
                          </div>
                          <div>
                            <p className="font-medium">{tx.description || 'Sans description'}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(tx.date), 'd MMM', { locale: fr })}
                              {(tx as any).finance_categories?.name && ` • ${(tx as any).finance_categories.name}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "font-bold tabular-nums",
                            tx.type === 'income' ? 'text-success' : 'text-destructive'
                          )}>
                            {tx.type === 'income' ? '+' : '-'}{Number(tx.amount).toFixed(2)} €
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 text-destructive h-8 w-8 transition-opacity"
                            onClick={() => deleteTransaction.mutate(tx.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Savings Goals Tab */}
          <TabsContent value="savings" className="space-y-4">
            {savingsGoals.length === 0 ? (
              <Card className="glass border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <PiggyBank className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center mb-4">
                    Aucun objectif d'épargne.<br />
                    Créez des objectifs pour suivre votre progression.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {savingsGoals.map((goal) => (
                  <SavingsGoalCard
                    key={goal.id}
                    goal={goal}
                    onContribute={(goalId, amount) => contributeToGoal.mutate({ goalId, amount })}
                    onDelete={(goalId) => deleteSavingsGoal.mutate(goalId)}
                    isContributing={contributeToGoal.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Budgets Tab */}
          <TabsContent value="budgets" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isBudgetOpen} onOpenChange={setIsBudgetOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 gradient-primary">
                    <Plus className="h-4 w-4" />
                    Nouveau budget
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-strong">
                  <DialogHeader>
                    <DialogTitle>Créer un budget</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Catégorie</Label>
                      <Select value={newBudget.category_id} onValueChange={(v) => setNewBudget({ ...newBudget, category_id: v })}>
                        <SelectTrigger className="glass-hover">
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.filter(c => c.type === 'expense').map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Limite mensuelle (€)</Label>
                      <Input
                        type="number"
                        value={newBudget.monthly_limit}
                        onChange={(e) => setNewBudget({ ...newBudget, monthly_limit: e.target.value })}
                        placeholder="500"
                        className="glass-hover"
                      />
                    </div>
                    <Button onClick={handleAddBudget} className="w-full gradient-primary" disabled={createBudget.isPending}>
                      {createBudget.isPending ? 'Création...' : 'Créer'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {budgetUtilization.length === 0 ? (
              <Card className="glass border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Target className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    Aucun budget défini.<br />
                    Créez des budgets pour suivre vos dépenses.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {budgetUtilization.map((budget) => (
                  <Card key={budget.id} className={cn(
                    "glass-hover",
                    budget.overspent && "border-destructive/50"
                  )}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{budget.categoryName}</CardTitle>
                        {budget.overspent && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Dépassé
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>{budget.spent.toFixed(0)} € dépensés</span>
                          <span className="text-muted-foreground">sur {Number(budget.monthly_limit).toFixed(0)} €</span>
                        </div>
                        <Progress 
                          value={budget.percentage} 
                          className={cn(
                            "h-3",
                            budget.overspent && "[&>div]:bg-destructive"
                          )}
                        />
                        <p className="text-xs text-muted-foreground">
                          {budget.overspent 
                            ? `${(budget.spent - Number(budget.monthly_limit)).toFixed(0)} € de dépassement`
                            : `${(Number(budget.monthly_limit) - budget.spent).toFixed(0)} € restants`
                          }
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Statements Tab */}
          <TabsContent value="statements" className="space-y-4">
            {documents.length === 0 ? (
              <Card className="glass border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center mb-4">
                    Aucun relevé importé.<br />
                    Importez vos relevés bancaires pour analyser vos transactions.
                  </p>
                  <Button onClick={() => setActiveTab('import')} className="gap-2">
                    <Upload className="h-4 w-4" />
                    Importer un relevé
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <Card key={doc.id} className="glass-hover">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(doc.parsed_status || 'pending')}
                        <div>
                          <p className="font-medium">{doc.filename}</p>
                          <p className="text-sm text-muted-foreground">
                            {doc.account_label && `${doc.account_label} • `}
                            {format(new Date(doc.created_at), 'dd MMM yyyy', { locale: fr })}
                            {doc.transactions_count && ` • ${doc.transactions_count} transactions`}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => deleteDocument.mutate(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 gradient-primary">
                    <Plus className="h-4 w-4" />
                    Nouvelle catégorie
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-strong">
                  <DialogHeader>
                    <DialogTitle>Créer une catégorie</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Nom</Label>
                      <Input
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        placeholder="Alimentation, Transport..."
                        className="glass-hover"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={newCategory.type} onValueChange={(type) => setNewCategory({ ...newCategory, type })}>
                        <SelectTrigger className="glass-hover">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="expense">Dépense</SelectItem>
                          <SelectItem value="income">Revenu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddCategory} className="w-full gradient-primary" disabled={createCategory.isPending}>
                      {createCategory.isPending ? 'Création...' : 'Créer'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="glass-strong">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ArrowDownRight className="h-5 w-5 text-destructive" />
                    Dépenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categories.filter(c => c.type === 'expense').map(cat => (
                      <div key={cat.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
                        <span>{cat.name}</span>
                        <Badge variant="outline">Dépense</Badge>
                      </div>
                    ))}
                    {categories.filter(c => c.type === 'expense').length === 0 && (
                      <p className="text-muted-foreground text-center py-4">Aucune catégorie</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-strong">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ArrowUpRight className="h-5 w-5 text-success" />
                    Revenus
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categories.filter(c => c.type === 'income').map(cat => (
                      <div key={cat.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
                        <span>{cat.name}</span>
                        <Badge variant="outline">Revenu</Badge>
                      </div>
                    ))}
                    {categories.filter(c => c.type === 'income').length === 0 && (
                      <p className="text-muted-foreground text-center py-4">Aucune catégorie</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Export Modal */}
        <FinanceExportModal open={isExportOpen} onOpenChange={setIsExportOpen} />
      </div>
    </AppLayout>
  );
}
