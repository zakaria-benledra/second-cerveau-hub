import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { useCategories, useCreateTransaction } from '@/hooks/useFinance';
import { cn } from '@/lib/utils';
import { 
  Upload, 
  FileText, 
  ArrowRight, 
  Check, 
  AlertTriangle, 
  Loader2, 
  ChevronRight,
  ChevronLeft,
  Sparkles,
  TableIcon,
  Eye,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { AnimatedContainer } from '@/components/ui/animated-container';

interface ParsedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category_id: string | null;
  suggestedCategory: string | null;
  isAnomaly: boolean;
  anomalyReason?: string;
  selected: boolean;
}

interface WizardStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const STEPS: WizardStep[] = [
  { id: 1, title: 'Upload', description: 'Déposez votre fichier', icon: <Upload className="h-5 w-5" /> },
  { id: 2, title: 'Aperçu', description: 'Vérifiez les données', icon: <TableIcon className="h-5 w-5" /> },
  { id: 3, title: 'Catégories', description: 'Assignez les catégories', icon: <Sparkles className="h-5 w-5" /> },
  { id: 4, title: 'Confirmation', description: 'Validez l\'import', icon: <Check className="h-5 w-5" /> },
];

export function FinanceImportWizard({ onComplete }: { onComplete?: () => void }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: categories = [] } = useCategories();
  const createTransaction = useCreateTransaction();

  // Simulate file parsing (in production, this would call an edge function)
  const parseFile = useCallback(async (uploadedFile: File) => {
    setIsProcessing(true);
    
    // Simulate parsing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // For demo, generate sample parsed transactions
    const mockTransactions: ParsedTransaction[] = [
      {
        id: '1',
        date: new Date().toISOString().split('T')[0],
        description: 'CARREFOUR MARKET',
        amount: 45.67,
        type: 'expense',
        category_id: null,
        suggestedCategory: 'Alimentation',
        isAnomaly: false,
        selected: true,
      },
      {
        id: '2',
        date: new Date().toISOString().split('T')[0],
        description: 'VIREMENT SALAIRE',
        amount: 2500.00,
        type: 'income',
        category_id: null,
        suggestedCategory: 'Salaire',
        isAnomaly: false,
        selected: true,
      },
      {
        id: '3',
        date: new Date().toISOString().split('T')[0],
        description: 'AMAZON EU SARL',
        amount: 299.99,
        type: 'expense',
        category_id: null,
        suggestedCategory: 'Shopping',
        isAnomaly: true,
        anomalyReason: 'Montant inhabituellement élevé',
        selected: true,
      },
      {
        id: '4',
        date: new Date().toISOString().split('T')[0],
        description: 'UBER *EATS',
        amount: 23.50,
        type: 'expense',
        category_id: null,
        suggestedCategory: 'Restaurant',
        isAnomaly: false,
        selected: true,
      },
      {
        id: '5',
        date: new Date().toISOString().split('T')[0],
        description: 'EDF',
        amount: 85.00,
        type: 'expense',
        category_id: null,
        suggestedCategory: 'Factures',
        isAnomaly: false,
        selected: true,
      },
    ];
    
    setTransactions(mockTransactions);
    setIsProcessing(false);
    setCurrentStep(2);
  }, []);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.pdf'))) {
      setFile(droppedFile);
      parseFile(droppedFile);
    } else {
      toast.error('Format non supporté. Utilisez CSV ou PDF.');
    }
  }, [parseFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  }, [parseFile]);

  const toggleTransaction = (id: string) => {
    setTransactions(prev => 
      prev.map(t => t.id === id ? { ...t, selected: !t.selected } : t)
    );
  };

  const updateCategory = (id: string, categoryId: string) => {
    setTransactions(prev =>
      prev.map(t => t.id === id ? { ...t, category_id: categoryId } : t)
    );
  };

  const handleImport = async () => {
    const selectedTransactions = transactions.filter(t => t.selected);
    setIsProcessing(true);
    
    for (let i = 0; i < selectedTransactions.length; i++) {
      const t = selectedTransactions[i];
      try {
        await createTransaction.mutateAsync({
          amount: t.amount,
          description: t.description,
          category_id: t.category_id,
          type: t.type,
          date: t.date,
        });
        setImportProgress(((i + 1) / selectedTransactions.length) * 100);
      } catch (error) {
        console.error('Failed to import transaction:', error);
      }
    }
    
    setIsProcessing(false);
    toast.success(`${selectedTransactions.length} transactions importées !`);
    onComplete?.();
  };

  const selectedCount = transactions.filter(t => t.selected).length;
  const anomalyCount = transactions.filter(t => t.isAnomaly).length;

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div 
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full transition-all',
                currentStep === step.id 
                  ? 'bg-primary text-primary-foreground'
                  : currentStep > step.id
                    ? 'bg-success/15 text-success'
                    : 'bg-muted text-muted-foreground'
              )}
            >
              {currentStep > step.id ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                step.icon
              )}
              <span className="text-sm font-medium hidden md:inline">{step.title}</span>
            </div>
            {index < STEPS.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground mx-2" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {currentStep === 1 && (
        <AnimatedContainer animation="fade-up">
          <Card className="glass-strong">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Importer un relevé bancaire</CardTitle>
              <CardDescription>
                Glissez-déposez votre fichier CSV ou PDF pour analyser vos transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className={cn(
                  'border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer',
                  'hover:border-primary hover:bg-primary/5',
                  isProcessing ? 'border-primary bg-primary/5' : 'border-border'
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {isProcessing ? (
                  <div className="space-y-4">
                    <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                    <p className="text-muted-foreground">Analyse en cours...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Glissez votre fichier ici</p>
                      <p className="text-sm text-muted-foreground">ou cliquez pour parcourir</p>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Badge variant="outline">CSV</Badge>
                      <Badge variant="outline">PDF</Badge>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </AnimatedContainer>
      )}

      {/* Step 2: Preview */}
      {currentStep === 2 && (
        <AnimatedContainer animation="fade-up">
          <Card className="glass-strong">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Aperçu des transactions
                  </CardTitle>
                  <CardDescription>
                    {transactions.length} transactions détectées • {anomalyCount > 0 && (
                      <span className="text-warning">{anomalyCount} anomalies</span>
                    )}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="gap-1">
                  <FileText className="h-3 w-3" />
                  {file?.name}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12">
                        <Checkbox 
                          checked={transactions.every(t => t.selected)}
                          onCheckedChange={(checked) => {
                            setTransactions(prev => prev.map(t => ({ ...t, selected: !!checked })));
                          }}
                        />
                      </TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="w-12">État</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((t) => (
                      <TableRow 
                        key={t.id} 
                        className={cn(
                          t.isAnomaly && 'bg-warning/5',
                          !t.selected && 'opacity-50'
                        )}
                      >
                        <TableCell>
                          <Checkbox 
                            checked={t.selected}
                            onCheckedChange={() => toggleTransaction(t.id)}
                          />
                        </TableCell>
                        <TableCell className="text-sm">{t.date}</TableCell>
                        <TableCell>
                          <span className="font-medium">{t.description}</span>
                          {t.suggestedCategory && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {t.suggestedCategory}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className={cn(
                          'text-right font-mono font-medium',
                          t.type === 'income' ? 'text-success' : 'text-foreground'
                        )}>
                          {t.type === 'income' ? '+' : '-'}{t.amount.toFixed(2)} €
                        </TableCell>
                        <TableCell>
                          {t.isAnomaly ? (
                            <AlertTriangle className="h-4 w-4 text-warning" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
                <Button onClick={() => setCurrentStep(3)} className="gradient-primary">
                  Continuer
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </AnimatedContainer>
      )}

      {/* Step 3: Categories */}
      {currentStep === 3 && (
        <AnimatedContainer animation="fade-up">
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Assignation des catégories
              </CardTitle>
              <CardDescription>
                Vérifiez et ajustez les catégories suggérées par l'IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.filter(t => t.selected).map((t) => (
                  <div 
                    key={t.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border',
                      t.isAnomaly ? 'border-warning/50 bg-warning/5' : 'border-border'
                    )}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{t.description}</p>
                      <p className={cn(
                        'text-sm',
                        t.type === 'income' ? 'text-success' : 'text-muted-foreground'
                      )}>
                        {t.type === 'income' ? '+' : '-'}{t.amount.toFixed(2)} €
                        {t.isAnomaly && (
                          <span className="ml-2 text-warning">⚠️ {t.anomalyReason}</span>
                        )}
                      </p>
                    </div>
                    <Select 
                      value={t.category_id || ''} 
                      onValueChange={(val) => updateCategory(t.id, val)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder={t.suggestedCategory || 'Catégorie...'} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.filter(c => c.type === t.type).map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
                <Button onClick={() => setCurrentStep(4)} className="gradient-primary">
                  Continuer
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </AnimatedContainer>
      )}

      {/* Step 4: Confirmation */}
      {currentStep === 4 && (
        <AnimatedContainer animation="fade-up">
          <Card className="glass-strong">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Confirmer l'import</CardTitle>
              <CardDescription>
                Vérifiez le résumé avant de valider
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card className="bg-muted/50">
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-primary">{selectedCount}</p>
                    <p className="text-sm text-muted-foreground">Transactions</p>
                  </CardContent>
                </Card>
                <Card className="bg-success/10">
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-success">
                      +{transactions.filter(t => t.selected && t.type === 'income').reduce((sum, t) => sum + t.amount, 0).toFixed(0)} €
                    </p>
                    <p className="text-sm text-muted-foreground">Revenus</p>
                  </CardContent>
                </Card>
                <Card className="bg-destructive/10">
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-destructive">
                      -{transactions.filter(t => t.selected && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0).toFixed(0)} €
                    </p>
                    <p className="text-sm text-muted-foreground">Dépenses</p>
                  </CardContent>
                </Card>
              </div>

              {anomalyCount > 0 && (
                <div className="p-4 rounded-lg bg-warning/10 border border-warning/30 mb-6">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    <span className="font-medium">{anomalyCount} anomalie(s) détectée(s)</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ces transactions seront marquées pour revue
                  </p>
                </div>
              )}

              {isProcessing && (
                <div className="space-y-2 mb-6">
                  <Progress value={importProgress} className="h-2" />
                  <p className="text-sm text-center text-muted-foreground">
                    Import en cours... {Math.round(importProgress)}%
                  </p>
                </div>
              )}
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(3)} disabled={isProcessing}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
                <Button 
                  onClick={handleImport} 
                  className="gradient-primary"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Import en cours...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Valider l'import
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </AnimatedContainer>
      )}
    </div>
  );
}
