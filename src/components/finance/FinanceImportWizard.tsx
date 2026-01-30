import * as React from 'react';
import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useCategories } from '@/hooks/useFinance';
import { useUploadStatement } from '@/hooks/useDocuments';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { 
  Upload, 
  FileText, 
  Check, 
  AlertTriangle, 
  Loader2, 
  ChevronRight,
  ChevronLeft,
  Eye,
  CheckCircle2,
  XCircle,
  X,
  Trash2,
  AlertCircle
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
  categoryName: string | null;
  isValid: boolean;
  validationError?: string;
}

interface WizardStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const STEPS: WizardStep[] = [
  { id: 1, title: 'Upload', description: 'Déposez votre fichier', icon: <Upload className="h-5 w-5" /> },
  { id: 2, title: 'Aperçu', description: 'Vérifiez et éditez', icon: <Eye className="h-5 w-5" /> },
  { id: 3, title: 'Confirmation', description: 'Importez', icon: <Check className="h-5 w-5" /> },
];

interface FinanceImportWizardProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

// Validate a transaction row
function validateTransaction(t: ParsedTransaction): { isValid: boolean; error?: string } {
  // Date validation
  if (!t.date || !/^\d{4}-\d{2}-\d{2}$/.test(t.date)) {
    return { isValid: false, error: 'Date invalide (format: YYYY-MM-DD)' };
  }
  const dateObj = new Date(t.date);
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: 'Date invalide' };
  }
  
  // Amount validation
  if (isNaN(t.amount) || t.amount === 0) {
    return { isValid: false, error: 'Montant invalide' };
  }
  
  // Description validation
  if (!t.description || t.description.trim().length < 2) {
    return { isValid: false, error: 'Description trop courte' };
  }
  
  return { isValid: true };
}

function FinanceImportWizardInner({ onComplete, onCancel }: FinanceImportWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [parseErrors, setParseErrors] = useState<Array<{ line: number; reason: string }>>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: categories = [] } = useCategories();
  const uploadStatement = useUploadStatement();

  // Parse CSV locally for preview (no DB import yet)
  const parseCSVForPreview = useCallback(async (uploadedFile: File) => {
    setIsProcessing(true);
    setGlobalError(null);
    setParseErrors([]);
    
    try {
      // Validate file type
      const isCSV = uploadedFile.name.toLowerCase().endsWith('.csv');
      if (!isCSV) {
        throw new Error('Format non supporté. Utilisez un fichier CSV.');
      }
      
      // Validate file size (10MB max)
      if (uploadedFile.size > 10 * 1024 * 1024) {
        throw new Error('Fichier trop volumineux (max 10MB).');
      }
      
      // Read file content
      const content = await uploadedFile.text();
      const lines = content.split(/\r?\n/).filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('Le fichier doit contenir au moins un en-tête et une ligne de données.');
      }
      
      // Parse header to find columns
      const header = lines[0].toLowerCase();
      const delimiter = header.includes(';') ? ';' : ',';
      const headerCols = header.split(delimiter).map(h => h.trim().replace(/"/g, ''));
      
      // Find column indices
      const dateIdx = headerCols.findIndex(h => 
        h.includes('date') || h === 'dt' || h.includes('opération')
      );
      const descIdx = headerCols.findIndex(h => 
        h.includes('libellé') || h.includes('libelle') || h.includes('description') || 
        h.includes('label') || h.includes('motif') || h.includes('intitulé')
      );
      const amountIdx = headerCols.findIndex(h => 
        h.includes('montant') || h.includes('amount') || h.includes('somme') || 
        h.includes('débit') || h.includes('crédit') || h.includes('valeur')
      );
      
      if (dateIdx === -1 || amountIdx === -1) {
        throw new Error('Colonnes requises non trouvées: date et montant sont obligatoires.');
      }
      
      const parsedTxns: ParsedTransaction[] = [];
      const errors: Array<{ line: number; reason: string }> = [];
      
      // Parse each data row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        
        const cols = line.split(delimiter).map(c => c.trim().replace(/"/g, ''));
        
        try {
          // Parse date
          let dateStr = cols[dateIdx] || '';
          let parsedDate: Date | null = null;
          
          // Try different date formats
          const dateFormats = [
            /^(\d{4})-(\d{2})-(\d{2})$/, // ISO: 2024-01-15
            /^(\d{2})\/(\d{2})\/(\d{4})$/, // EU: 15/01/2024
            /^(\d{2})-(\d{2})-(\d{4})$/, // EU dash: 15-01-2024
            /^(\d{2})\/(\d{2})\/(\d{2})$/, // Short EU: 15/01/24
          ];
          
          for (const fmt of dateFormats) {
            const match = dateStr.match(fmt);
            if (match) {
              if (fmt === dateFormats[0]) {
                parsedDate = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
              } else if (fmt === dateFormats[1] || fmt === dateFormats[2]) {
                parsedDate = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
              } else if (fmt === dateFormats[3]) {
                const year = parseInt(match[3]) + 2000;
                parsedDate = new Date(year, parseInt(match[2]) - 1, parseInt(match[1]));
              }
              break;
            }
          }
          
          if (!parsedDate || isNaN(parsedDate.getTime())) {
            errors.push({ line: i + 1, reason: `Date invalide: "${dateStr}"` });
            continue;
          }
          
          const formattedDate = parsedDate.toISOString().split('T')[0];
          
          // Parse amount
          let amountStr = cols[amountIdx] || '0';
          amountStr = amountStr.replace(/[€$\s]/g, '').replace(',', '.');
          const amount = parseFloat(amountStr);
          
          if (isNaN(amount) || amount === 0) {
            errors.push({ line: i + 1, reason: `Montant invalide: "${cols[amountIdx]}"` });
            continue;
          }
          
          // Parse description
          const description = descIdx >= 0 ? (cols[descIdx] || `Transaction ${i}`) : `Transaction ${i}`;
          
          // Determine type
          const type: 'income' | 'expense' = amount > 0 ? 'income' : 'expense';
          
          const txn: ParsedTransaction = {
            id: `temp-${i}-${Date.now()}`,
            date: formattedDate,
            description: description.substring(0, 255),
            amount: Math.abs(amount),
            type,
            category_id: null,
            categoryName: null,
            isValid: true,
          };
          
          // Validate
          const validation = validateTransaction(txn);
          txn.isValid = validation.isValid;
          txn.validationError = validation.error;
          
          parsedTxns.push(txn);
          
        } catch (e) {
          errors.push({ line: i + 1, reason: `Erreur de parsing: ${(e as Error).message}` });
        }
      }
      
      if (parsedTxns.length === 0) {
        throw new Error('Aucune transaction valide trouvée dans le fichier.');
      }
      
      setTransactions(parsedTxns);
      setParseErrors(errors);
      setIsProcessing(false);
      setCurrentStep(2);
      
      toast.success(`${parsedTxns.length} transactions parsées !`);
      if (errors.length > 0) {
        toast.warning(`${errors.length} lignes ignorées avec des erreurs.`);
      }
      
    } catch (err) {
      console.error('Parse error:', err);
      setGlobalError((err as Error).message || 'Erreur lors du traitement du fichier');
      setIsProcessing(false);
    }
  }, []);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.toLowerCase().endsWith('.csv')) {
      setFile(droppedFile);
      parseCSVForPreview(droppedFile);
    } else {
      toast.error('Format non supporté. Utilisez un fichier CSV.');
    }
  }, [parseCSVForPreview]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseCSVForPreview(selectedFile);
    }
  }, [parseCSVForPreview]);

  // Update a transaction field
  const updateTransaction = (id: string, field: keyof ParsedTransaction, value: string | number) => {
    setTransactions(prev => prev.map(t => {
      if (t.id !== id) return t;
      
      const updated = { ...t, [field]: value };
      
      // Re-validate after edit
      const validation = validateTransaction(updated);
      updated.isValid = validation.isValid;
      updated.validationError = validation.error;
      
      // Update type based on amount sign (if amount changed)
      if (field === 'amount') {
        const numValue = typeof value === 'number' ? value : parseFloat(value);
        updated.amount = Math.abs(numValue);
      }
      
      return updated;
    }));
  };

  // Update category
  const updateCategory = (id: string, categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    setTransactions(prev =>
      prev.map(t => t.id === id 
        ? { ...t, category_id: categoryId, categoryName: category?.name || null } 
        : t
      )
    );
  };

  // Delete a transaction
  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Toggle transaction type
  const toggleType = (id: string) => {
    setTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, type: t.type === 'income' ? 'expense' : 'income' } : t
    ));
  };

  // Final import to database
  const handleFinalImport = async () => {
    const validTxns = transactions.filter(t => t.isValid);
    
    if (validTxns.length === 0) {
      toast.error('Aucune transaction valide à importer.');
      return;
    }
    
    setIsImporting(true);
    
    try {
      // First upload the file
      const result = await uploadStatement.mutateAsync({
        file: file!,
        accountLabel: undefined,
        dateFrom: undefined,
        dateTo: undefined,
      });
      
      if (!result?.document?.id) {
        throw new Error('Upload failed - no document ID returned');
      }
      
      const documentId = result.document.id;
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');
      
      // Insert transactions
      const insertData = validTxns.map(t => ({
        user_id: user.id,
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type,
        category_id: t.category_id,
        document_id: documentId,
        source: 'integration' as const,
      }));
      
      const { error: insertError } = await supabase
        .from('finance_transactions')
        .insert(insertData);
      
      if (insertError) throw insertError;
      
      // Update document with transaction count
      await supabase
        .from('documents')
        .update({ 
          parsed_status: 'completed',
          transactions_count: validTxns.length,
          parsed_at: new Date().toISOString()
        })
        .eq('id', documentId);
      
      setIsImporting(false);
      setCurrentStep(3);
      
      toast.success(`${validTxns.length} transactions importées avec succès !`);
      
    } catch (err) {
      console.error('Import error:', err);
      toast.error((err as Error).message || 'Erreur lors de l\'import');
      setIsImporting(false);
    }
  };

  const handleComplete = () => {
    toast.success('Import terminé !');
    onComplete?.();
  };

  const handleCancel = () => {
    setCurrentStep(1);
    setFile(null);
    setTransactions([]);
    setParseErrors([]);
    setGlobalError(null);
    onCancel?.();
  };

  // Stats
  const validCount = transactions.filter(t => t.isValid).length;
  const invalidCount = transactions.filter(t => !t.isValid).length;
  const totalIncome = transactions.filter(t => t.isValid && t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.isValid && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      {/* Cancel Button */}
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
                Glissez-déposez votre fichier CSV pour prévisualiser les transactions
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
                    <Badge variant="default">CSV</Badge>
                    <p className="text-xs text-muted-foreground">
                      Vous pourrez prévisualiser et modifier les transactions avant l'import
                    </p>
                  </div>
                )}
              </div>

              {globalError && (
                <Alert variant="destructive" className="mt-4">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Erreur</AlertTitle>
                  <AlertDescription>{globalError}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </AnimatedContainer>
      )}

      {/* Step 2: Preview & Edit */}
      {currentStep === 2 && (
        <AnimatedContainer animation="fade-up">
          <Card className="glass-strong">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Prévisualisation des transactions
                  </CardTitle>
                  <CardDescription>
                    Vérifiez et corrigez les données avant l'import
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="gap-1">
                    <FileText className="h-3 w-3" />
                    {file?.name}
                  </Badge>
                  <div className="flex gap-2">
                    <Badge variant="success" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {validCount} valides
                    </Badge>
                    {invalidCount > 0 && (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        {invalidCount} erreurs
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Parse Errors Alert */}
              {parseErrors.length > 0 && (
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{parseErrors.length} lignes ignorées</AlertTitle>
                  <AlertDescription>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm">Voir les détails</summary>
                      <ul className="mt-2 text-xs space-y-1 max-h-32 overflow-y-auto">
                        {parseErrors.slice(0, 10).map((err, idx) => (
                          <li key={idx}>Ligne {err.line}: {err.reason}</li>
                        ))}
                        {parseErrors.length > 10 && (
                          <li>...et {parseErrors.length - 10} autres erreurs</li>
                        )}
                      </ul>
                    </details>
                  </AlertDescription>
                </Alert>
              )}

              {/* Transactions Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-[450px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-muted/90 backdrop-blur-sm z-10">
                      <TableRow>
                        <TableHead className="w-32">Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-32">Montant</TableHead>
                        <TableHead className="w-24">Type</TableHead>
                        <TableHead className="w-44">Catégorie</TableHead>
                        <TableHead className="w-16">État</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((t) => (
                        <TableRow 
                          key={t.id} 
                          className={cn(
                            !t.isValid && 'bg-destructive/5'
                          )}
                        >
                          <TableCell>
                            <Input
                              type="date"
                              value={t.date}
                              onChange={(e) => updateTransaction(t.id, 'date', e.target.value)}
                              className={cn(
                                'h-8 text-sm',
                                !t.isValid && t.validationError?.includes('Date') && 'border-destructive'
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={t.description}
                              onChange={(e) => updateTransaction(t.id, 'description', e.target.value)}
                              className={cn(
                                'h-8 text-sm',
                                !t.isValid && t.validationError?.includes('Description') && 'border-destructive'
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={t.amount}
                              onChange={(e) => updateTransaction(t.id, 'amount', parseFloat(e.target.value) || 0)}
                              className={cn(
                                'h-8 text-sm font-mono',
                                !t.isValid && t.validationError?.includes('Montant') && 'border-destructive'
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleType(t.id)}
                              className={cn(
                                'h-8 text-xs font-medium',
                                t.type === 'income' ? 'text-success' : 'text-destructive'
                              )}
                            >
                              {t.type === 'income' ? '+Revenu' : '-Dépense'}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={t.category_id || ''} 
                              onValueChange={(val) => updateCategory(t.id, val)}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Catégorie..." />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.filter(c => c.type === t.type).map(cat => (
                                  <SelectItem key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {t.isValid ? (
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            ) : (
                              <div title={t.validationError}>
                                <AlertTriangle className="h-4 w-4 text-destructive" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => deleteTransaction(t.id)}
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              {/* Summary */}
              <div className="flex items-center justify-between mt-4 p-3 rounded-lg bg-muted/50">
                <div className="flex gap-6 text-sm">
                  <span>
                    <span className="text-muted-foreground">Revenus:</span>{' '}
                    <span className="font-medium text-success">+{totalIncome.toFixed(2)} €</span>
                  </span>
                  <span>
                    <span className="text-muted-foreground">Dépenses:</span>{' '}
                    <span className="font-medium text-destructive">-{totalExpense.toFixed(2)} €</span>
                  </span>
                  <span>
                    <span className="text-muted-foreground">Solde:</span>{' '}
                    <span className={cn('font-medium', netBalance >= 0 ? 'text-success' : 'text-destructive')}>
                      {netBalance >= 0 ? '+' : ''}{netBalance.toFixed(2)} €
                    </span>
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
                <Button 
                  onClick={handleFinalImport} 
                  disabled={validCount === 0 || isImporting}
                  className="gradient-primary"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Import en cours...
                    </>
                  ) : (
                    <>
                      Importer {validCount} transactions
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </AnimatedContainer>
      )}

      {/* Step 3: Confirmation */}
      {currentStep === 3 && (
        <AnimatedContainer animation="fade-up">
          <Card className="glass-strong">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <CardTitle className="text-2xl">Import terminé !</CardTitle>
              <CardDescription>
                Vos transactions ont été importées avec succès
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card className="bg-muted/50">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-primary">{validCount}</p>
                    <p className="text-sm text-muted-foreground">Transactions importées</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="p-4 text-center">
                    <p className={cn(
                      "text-3xl font-bold",
                      netBalance >= 0 ? 'text-success' : 'text-destructive'
                    )}>
                      {netBalance >= 0 ? '+' : ''}{netBalance.toFixed(0)} €
                    </p>
                    <p className="text-sm text-muted-foreground">Solde net</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-success">+{totalIncome.toFixed(0)} €</p>
                    <p className="text-sm text-muted-foreground">Revenus</p>
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

// Wrap with forwardRef for compatibility with Tab content
export const FinanceImportWizard = React.forwardRef<HTMLDivElement, FinanceImportWizardProps>(
  (props, _ref) => <FinanceImportWizardInner {...props} />
);
FinanceImportWizard.displayName = 'FinanceImportWizard';
