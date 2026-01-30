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
import { useCategories } from '@/hooks/useFinance';
import { useUploadStatement } from '@/hooks/useDocuments';
import { supabase } from '@/integrations/supabase/client';
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
  XCircle,
  X
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

interface FinanceImportWizardProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function FinanceImportWizard({ onComplete, onCancel }: FinanceImportWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: categories = [] } = useCategories();
  const uploadStatement = useUploadStatement();

  // Real file upload and parsing via edge function
  const uploadAndParseFile = useCallback(async (uploadedFile: File) => {
    setIsProcessing(true);
    setParseError(null);
    
    try {
      // Check file type
      const isPDF = uploadedFile.name.toLowerCase().endsWith('.pdf');
      const isCSV = uploadedFile.name.toLowerCase().endsWith('.csv');
      
      if (!isPDF && !isCSV) {
        throw new Error('Format non supporté. Utilisez CSV ou PDF.');
      }
      
      // Upload to Supabase storage first
      const result = await uploadStatement.mutateAsync({
        file: uploadedFile,
        accountLabel: undefined,
        dateFrom: undefined,
        dateTo: undefined,
      });
      
      if (!result?.document?.id) {
        throw new Error('Upload failed - no document ID returned');
      }
      
      setDocumentId(result.document.id);
      
      // Call the appropriate parsing edge function
      const parseFunction = isPDF ? 'parse-statement-pdf' : 'parse-statement-csv';
      
      const { data: parseResult, error: parseError } = await supabase.functions.invoke(parseFunction, {
        body: { documentId: result.document.id }
      });
      
      if (parseError) throw parseError;
      
      // If PDF requires manual entry
      if (parseResult?.requires_manual_entry) {
        setParseError('Les fichiers PDF nécessitent une saisie manuelle. Veuillez exporter votre relevé en CSV.');
        setIsProcessing(false);
        return;
      }
      
      // Fetch parsed transactions from DB
      const { data: parsedTxns, error: fetchError } = await supabase
        .from('finance_transactions')
        .select('*, finance_categories(name)')
        .eq('document_id', result.document.id)
        .order('date', { ascending: false });
      
      if (fetchError) throw fetchError;
      
      // Transform to wizard format
      const wizardTransactions: ParsedTransaction[] = (parsedTxns || []).map((t, idx) => ({
        id: t.id,
        date: t.date,
        description: t.description || `Transaction ${idx + 1}`,
        amount: Number(t.amount),
        type: t.type as 'income' | 'expense',
        category_id: t.category_id,
        suggestedCategory: (t.finance_categories as any)?.name || null,
        isAnomaly: Number(t.amount) > 500, // Flag high amounts
        anomalyReason: Number(t.amount) > 500 ? 'Montant élevé' : undefined,
        selected: true,
      }));
      
      if (wizardTransactions.length === 0) {
        setParseError('Aucune transaction trouvée dans le fichier.');
        setIsProcessing(false);
        return;
      }
      
      setTransactions(wizardTransactions);
      setIsProcessing(false);
      setCurrentStep(2);
      
      toast.success(`${wizardTransactions.length} transactions importées !`);
      
    } catch (err) {
      console.error('Upload/parse error:', err);
      setParseError((err as Error).message || 'Erreur lors du traitement du fichier');
      setIsProcessing(false);
    }
  }, [uploadStatement]);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.pdf'))) {
      setFile(droppedFile);
      uploadAndParseFile(droppedFile);
    } else {
      toast.error('Format non supporté. Utilisez CSV ou PDF.');
    }
  }, [uploadAndParseFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      uploadAndParseFile(selectedFile);
    }
  }, [uploadAndParseFile]);

  const toggleTransaction = (id: string) => {
    setTransactions(prev => 
      prev.map(t => t.id === id ? { ...t, selected: !t.selected } : t)
    );
  };

  const updateCategory = async (id: string, categoryId: string) => {
    // Update local state
    setTransactions(prev =>
      prev.map(t => t.id === id ? { ...t, category_id: categoryId } : t)
    );
    
    // Update in database
    await supabase
      .from('finance_transactions')
      .update({ category_id: categoryId })
      .eq('id', id);
  };

  const handleComplete = () => {
    toast.success('Import terminé avec succès !');
    onComplete?.();
  };

  const handleCancel = () => {
    // Reset state
    setCurrentStep(1);
    setFile(null);
    setDocumentId(null);
    setTransactions([]);
    setParseError(null);
    setImportProgress(0);
    onCancel?.();
  };

  const selectedCount = transactions.filter(t => t.selected).length;
  const anomalyCount = transactions.filter(t => t.isAnomaly).length;
  const totalAmount = transactions.filter(t => t.selected).reduce((sum, t) => 
    t.type === 'income' ? sum + t.amount : sum - t.amount, 0
  );

  return (
    <div className="space-y-6">
      {/* Cancel Button - Always visible */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-2">
          <X className="h-4 w-4" />
          Annuler
        </Button>
      </div>

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
                Glissez-déposez votre fichier CSV pour analyser vos transactions
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
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {isProcessing ? (
                  <div className="space-y-4">
                    <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                    <p className="text-muted-foreground">Analyse en cours...</p>
                    <p className="text-xs text-muted-foreground">
                      Upload, parsing et catégorisation automatique
                    </p>
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
                      <Badge variant="default">CSV</Badge>
                      <Badge variant="outline" className="text-muted-foreground">PDF (bientôt)</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Les transactions seront automatiquement catégorisées
                    </p>
                  </div>
                )}
              </div>

              {parseError && (
                <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex items-center gap-2 text-destructive">
                    <XCircle className="h-5 w-5" />
                    <span className="font-medium">Erreur</span>
                  </div>
                  <p className="text-sm text-destructive/80 mt-1">{parseError}</p>
                </div>
              )}
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
                    {transactions.length} transactions importées
                    {anomalyCount > 0 && (
                      <span className="text-warning ml-2">• {anomalyCount} anomalies</span>
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
              <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
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
                Vérifier les catégories
              </CardTitle>
              <CardDescription>
                Les catégories ont été assignées automatiquement. Ajustez si nécessaire.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
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
              <CardTitle className="text-2xl">Import terminé !</CardTitle>
              <CardDescription>
                Vos transactions ont été importées avec succès
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card className="bg-muted/50">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-primary">{selectedCount}</p>
                    <p className="text-sm text-muted-foreground">Transactions</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="p-4 text-center">
                    <p className={cn(
                      "text-3xl font-bold",
                      totalAmount >= 0 ? 'text-success' : 'text-destructive'
                    )}>
                      {totalAmount >= 0 ? '+' : ''}{totalAmount.toFixed(0)} €
                    </p>
                    <p className="text-sm text-muted-foreground">Solde net</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-warning">{anomalyCount}</p>
                    <p className="text-sm text-muted-foreground">Anomalies</p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-success/10 border border-success/20">
                <CheckCircle2 className="h-6 w-6 text-success" />
                <span className="font-medium text-success">Transactions enregistrées dans votre base de données</span>
              </div>
              
              <div className="flex justify-center mt-6">
                <Button onClick={handleComplete} className="gradient-primary px-8">
                  <Check className="h-4 w-4 mr-2" />
                  Terminer
                </Button>
              </div>
            </CardContent>
          </Card>
        </AnimatedContainer>
      )}
    </div>
  );
}