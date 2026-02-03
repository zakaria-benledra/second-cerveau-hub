import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategories, useCreateCategory, useTransactions, useCreateTransaction, useDeleteTransaction, useMonthlySpending } from '@/hooks/useFinance';
import { useCelebration } from '@/hooks/useCelebration';
import { cn } from '@/lib/utils';
import { 
  Wallet, Plus, TrendingUp, TrendingDown, PiggyBank, 
  ArrowUpRight, ArrowDownRight, Trash2, Loader2, Calendar
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function FinancePageSimplified() {
  const currentMonth = format(new Date(), 'yyyy-MM');
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState({ 
    amount: '', 
    description: '', 
    category_id: '', 
    type: 'expense' as 'expense' | 'income', 
    date: format(new Date(), 'yyyy-MM-dd') 
  });
  const [newCategory, setNewCategory] = useState({ name: '', type: 'expense' as 'expense' | 'income' });

  const { data: categories = [] } = useCategories();
  const { data: transactions = [], isLoading } = useTransactions(currentMonth);
  const { data: monthlyStats } = useMonthlySpending(currentMonth);
  const { celebrate } = useCelebration();
  const createTransaction = useCreateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const createCategory = useCreateCategory();

  // Financial health score
  const financialHealth = useMemo(() => {
    const income = monthlyStats?.totalIncome || 0;
    const savings = monthlyStats?.netSavings || 0;
    if (income === 0) return 0;
    const savingsRate = (savings / income) * 100;
    if (savingsRate >= 20) return 90;
    if (savingsRate >= 10) return 70;
    if (savingsRate >= 0) return 50;
    return 30;
  }, [monthlyStats]);

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
        setNewTransaction({ amount: '', description: '', category_id: '', type: 'expense', date: format(new Date(), 'yyyy-MM-dd') });
        setIsTransactionOpen(false);
        celebrate('task_complete', 'Transaction enregistrée');
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

  const recentTransactions = transactions.slice(0, 10);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <GlobalHeader
          variant="page"
          title="Finances"
          subtitle={format(new Date(), 'MMMM yyyy', { locale: fr })}
          icon={<Wallet className="h-5 w-5 text-white" />}
          showStreak={false}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <ArrowUpRight className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-xl font-bold text-success">
                    +{(monthlyStats?.totalIncome || 0).toFixed(0)} €
                  </p>
                  <p className="text-xs text-muted-foreground">Revenus</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <ArrowDownRight className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="text-xl font-bold text-destructive">
                    -{(monthlyStats?.totalExpenses || 0).toFixed(0)} €
                  </p>
                  <p className="text-xs text-muted-foreground">Dépenses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <PiggyBank className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className={cn(
                    "text-xl font-bold",
                    (monthlyStats?.netSavings || 0) >= 0 ? 'text-success' : 'text-destructive'
                  )}>
                    {(monthlyStats?.netSavings || 0) >= 0 ? '+' : ''}{(monthlyStats?.netSavings || 0).toFixed(0)} €
                  </p>
                  <p className="text-xs text-muted-foreground">Épargne</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  {financialHealth >= 50 ? (
                    <TrendingUp className="h-4 w-4 text-success" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  )}
                </div>
                <div>
                  <p className="text-xl font-bold">{financialHealth}%</p>
                  <p className="text-xs text-muted-foreground">Santé</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Dialog open={isTransactionOpen} onOpenChange={setIsTransactionOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1 gap-2">
                <Plus className="h-4 w-4" />
                Nouvelle transaction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle transaction</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={newTransaction.type === 'expense' ? 'default' : 'outline'}
                    onClick={() => setNewTransaction({ ...newTransaction, type: 'expense' })}
                    className="gap-2"
                  >
                    <ArrowDownRight className="h-4 w-4" />
                    Dépense
                  </Button>
                  <Button
                    type="button"
                    variant={newTransaction.type === 'income' ? 'default' : 'outline'}
                    onClick={() => setNewTransaction({ ...newTransaction, type: 'income' })}
                    className="gap-2"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    Revenu
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Montant *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                    placeholder="0.00 €"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                    placeholder="Courses, loyer..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select 
                    value={newTransaction.category_id} 
                    onValueChange={(category_id) => setNewTransaction({ ...newTransaction, category_id })}
                  >
                    <SelectTrigger>
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
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newTransaction.date}
                    onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                  />
                </div>
                <Button 
                  onClick={handleAddTransaction} 
                  className="w-full" 
                  disabled={createTransaction.isPending || !newTransaction.amount}
                >
                  {createTransaction.isPending ? 'Ajout...' : 'Ajouter'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Catégorie
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle catégorie</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    placeholder="Alimentation, Transport..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select 
                    value={newCategory.type} 
                    onValueChange={(type: 'expense' | 'income') => setNewCategory({ ...newCategory, type })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Dépense</SelectItem>
                      <SelectItem value="income">Revenu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleAddCategory} 
                  className="w-full" 
                  disabled={createCategory.isPending || !newCategory.name}
                >
                  {createCategory.isPending ? 'Création...' : 'Créer'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Transactions récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {recentTransactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Wallet className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Aucune transaction ce mois</p>
                  <p className="text-sm mt-2">Commence par ajouter une transaction</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentTransactions.map((transaction) => {
                    const category = categories.find(c => c.id === transaction.category_id);
                    const isExpense = transaction.type === 'expense';
                    return (
                      <div 
                        key={transaction.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            isExpense ? 'bg-destructive/10' : 'bg-success/10'
                          )}>
                            {isExpense ? (
                              <ArrowDownRight className="h-4 w-4 text-destructive" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-success" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {transaction.description || 'Sans description'}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{format(parseISO(transaction.date), 'd MMM', { locale: fr })}</span>
                              {category && (
                                <Badge variant="secondary" className="text-xs">
                                  {category.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-semibold",
                            isExpense ? 'text-destructive' : 'text-success'
                          )}>
                            {isExpense ? '-' : '+'}{Number(transaction.amount).toFixed(0)} €
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteTransaction.mutate(transaction.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
