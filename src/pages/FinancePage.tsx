import { useState, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useCategories, useCreateCategory, useTransactions, useCreateTransaction, useDeleteTransaction, useBudgets, useCreateBudget, useMonthlySpending } from '@/hooks/useFinance';
import { useDocuments, useUploadStatement, useDeleteDocument } from '@/hooks/useDocuments';
import { DollarSign, Plus, TrendingUp, TrendingDown, Wallet, PiggyBank, Trash2, Upload, FileText, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function FinancePage() {
  const currentMonth = format(new Date(), 'yyyy-MM');
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState({ amount: '', description: '', category_id: '', type: 'expense', date: format(new Date(), 'yyyy-MM-dd') });
  const [newCategory, setNewCategory] = useState({ name: '', type: 'expense' });
  const [newBudget, setNewBudget] = useState({ category_id: '', monthly_limit: '' });
  const [uploadForm, setUploadForm] = useState({ accountLabel: '', dateFrom: '', dateTo: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: categories = [] } = useCategories();
  const { data: transactions = [], isLoading } = useTransactions(currentMonth);
  const { data: budgets = [] } = useBudgets();
  const { data: monthlyStats } = useMonthlySpending(currentMonth);
  const { data: documents = [] } = useDocuments('bank_statement');
  const createTransaction = useCreateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const createCategory = useCreateCategory();
  const createBudget = useCreateBudget();
  const uploadStatement = useUploadStatement();
  const deleteDocument = useDeleteDocument();

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    uploadStatement.mutate({
      file,
      accountLabel: uploadForm.accountLabel || undefined,
      dateFrom: uploadForm.dateFrom || undefined,
      dateTo: uploadForm.dateTo || undefined,
    }, {
      onSuccess: () => {
        setUploadForm({ accountLabel: '', dateFrom: '', dateTo: '' });
        setIsUploadOpen(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'processing': return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Finances</h1>
            <p className="text-muted-foreground">{format(new Date(), 'MMMM yyyy', { locale: fr })}</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Revenus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-500">
                +{monthlyStats?.totalIncome.toFixed(2) || '0.00'} €
              </p>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Dépenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-500">
                -{monthlyStats?.totalExpenses.toFixed(2) || '0.00'} €
              </p>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <PiggyBank className="h-4 w-4 text-primary" />
                Épargne nette
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${(monthlyStats?.netSavings || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {(monthlyStats?.netSavings || 0) >= 0 ? '+' : ''}{monthlyStats?.netSavings.toFixed(2) || '0.00'} €
              </p>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {monthlyStats?.transactionCount || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList className="glass">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="statements">Relevés</TabsTrigger>
            <TabsTrigger value="budgets">Budgets</TabsTrigger>
            <TabsTrigger value="categories">Catégories</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isTransactionOpen} onOpenChange={setIsTransactionOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Transaction
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nouvelle transaction</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={newTransaction.type} onValueChange={(type) => setNewTransaction({ ...newTransaction, type })}>
                        <SelectTrigger>
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
                      <Select value={newTransaction.category_id} onValueChange={(category_id) => setNewTransaction({ ...newTransaction, category_id })}>
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
                    <Button onClick={handleAddTransaction} className="w-full" disabled={createTransaction.isPending}>
                      {createTransaction.isPending ? 'Ajout...' : 'Ajouter'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Chargement...</div>
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
              <Card className="glass">
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-muted/50 group">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${tx.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                            {tx.type === 'income' ? 
                              <TrendingUp className="h-4 w-4 text-green-500" /> : 
                              <TrendingDown className="h-4 w-4 text-red-500" />
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
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${tx.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                            {tx.type === 'income' ? '+' : '-'}{Number(tx.amount).toFixed(2)} €
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 text-destructive h-8 w-8"
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

          {/* NEW: Bank Statements Tab */}
          <TabsContent value="statements" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Upload className="h-4 w-4" />
                    Importer un relevé
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Importer un relevé bancaire</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Fichier (CSV ou PDF)</Label>
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.pdf"
                        onChange={handleFileUpload}
                        disabled={uploadStatement.isPending}
                      />
                      <p className="text-xs text-muted-foreground">
                        Format CSV recommandé pour l'import automatique. Les PDF nécessitent une saisie manuelle.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Compte (optionnel)</Label>
                      <Input
                        value={uploadForm.accountLabel}
                        onChange={(e) => setUploadForm({ ...uploadForm, accountLabel: e.target.value })}
                        placeholder="Compte courant, Livret A..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Du</Label>
                        <Input
                          type="date"
                          value={uploadForm.dateFrom}
                          onChange={(e) => setUploadForm({ ...uploadForm, dateFrom: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Au</Label>
                        <Input
                          type="date"
                          value={uploadForm.dateTo}
                          onChange={(e) => setUploadForm({ ...uploadForm, dateTo: e.target.value })}
                        />
                      </div>
                    </div>
                    {uploadStatement.isPending && (
                      <div className="flex items-center gap-2 text-primary">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Import en cours...
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {documents.length === 0 ? (
              <Card className="glass border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    Aucun relevé importé.<br />
                    Importez vos relevés bancaires pour analyser vos transactions.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <Card key={doc.id} className="glass">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-medium">{doc.filename}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(doc.created_at), 'd MMM yyyy', { locale: fr })}
                            {doc.account_label && ` • ${doc.account_label}`}
                            {doc.transactions_count > 0 && ` • ${doc.transactions_count} transactions`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(doc.parsed_status)}
                          <Badge variant={doc.parsed_status === 'completed' ? 'default' : doc.parsed_status === 'failed' ? 'destructive' : 'secondary'}>
                            {doc.parsed_status === 'completed' ? 'Traité' : doc.parsed_status === 'failed' ? 'Échec' : doc.parsed_status === 'processing' ? 'En cours' : 'En attente'}
                          </Badge>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive h-8 w-8"
                          onClick={() => deleteDocument.mutate(doc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="budgets" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isBudgetOpen} onOpenChange={setIsBudgetOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Budget
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer un budget</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Catégorie</Label>
                      <Select value={newBudget.category_id} onValueChange={(category_id) => setNewBudget({ ...newBudget, category_id })}>
                        <SelectTrigger>
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
                        step="0.01"
                        value={newBudget.monthly_limit}
                        onChange={(e) => setNewBudget({ ...newBudget, monthly_limit: e.target.value })}
                        placeholder="500"
                      />
                    </div>
                    <Button onClick={handleAddBudget} className="w-full" disabled={createBudget.isPending}>
                      {createBudget.isPending ? 'Création...' : 'Créer'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {budgets.length === 0 ? (
              <Card className="glass border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <PiggyBank className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    Aucun budget défini.<br />
                    Créez des budgets pour suivre vos dépenses.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {budgets.map((budget) => {
                  const spent = transactions
                    .filter(t => t.category_id === budget.category_id && t.type === 'expense')
                    .reduce((sum, t) => sum + Number(t.amount), 0);
                  const percentage = Math.min(100, (spent / Number(budget.monthly_limit)) * 100);
                  const isOver = spent > Number(budget.monthly_limit);

                  return (
                    <Card key={budget.id} className="glass">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            {(budget as any).finance_categories?.name || 'Catégorie'}
                          </CardTitle>
                          <Badge variant={isOver ? 'destructive' : 'outline'}>
                            {isOver ? 'Dépassé' : `${percentage.toFixed(0)}%`}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Progress value={percentage} className={isOver ? '[&>div]:bg-destructive' : ''} />
                        <div className="flex justify-between text-sm">
                          <span>{spent.toFixed(2)} € dépensés</span>
                          <span className="text-muted-foreground">{Number(budget.monthly_limit).toFixed(2)} € max</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
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
                      <Select value={newCategory.type} onValueChange={(type) => setNewCategory({ ...newCategory, type })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="expense">Dépense</SelectItem>
                          <SelectItem value="income">Revenu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddCategory} className="w-full" disabled={createCategory.isPending}>
                      {createCategory.isPending ? 'Création...' : 'Créer'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    Dépenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categories.filter(c => c.type === 'expense').map(cat => (
                      <div key={cat.id} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                        <span>{cat.name}</span>
                      </div>
                    ))}
                    {categories.filter(c => c.type === 'expense').length === 0 && (
                      <p className="text-muted-foreground text-sm">Aucune catégorie</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Revenus
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categories.filter(c => c.type === 'income').map(cat => (
                      <div key={cat.id} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                        <span>{cat.name}</span>
                      </div>
                    ))}
                    {categories.filter(c => c.type === 'income').length === 0 && (
                      <p className="text-muted-foreground text-sm">Aucune catégorie</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
