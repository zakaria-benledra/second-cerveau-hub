import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCategories, useTransactions } from '@/hooks/useFinance';
import { useExportFinanceData } from '@/hooks/useFinanceV2';
import { Download, FileText, Table, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';

interface FinanceExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FinanceExportModal({ open, onOpenChange }: FinanceExportModalProps) {
  const [format_, setFormat] = useState<'csv' | 'json'>('csv');
  const [dateRange, setDateRange] = useState('30');
  const [startDate, setStartDate] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [step, setStep] = useState<'config' | 'preview' | 'success'>('config');
  
  const { data: categories = [] } = useCategories();
  const { data: transactions = [] } = useTransactions();
  const exportMutation = useExportFinanceData();

  const handlePreview = () => {
    // Filter transactions based on selection
    let filtered = [...transactions];
    
    if (dateRange !== 'custom') {
      const days = parseInt(dateRange);
      const start = new Date();
      start.setDate(start.getDate() - days);
      filtered = filtered.filter(t => new Date(t.date) >= start);
    } else {
      filtered = filtered.filter(t => 
        t.date >= startDate && t.date <= endDate
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category_id === selectedCategory);
    }
    
    setPreviewData(filtered.slice(0, 5));
    setStep('preview');
  };

  const handleExport = async () => {
    try {
      const params: any = {
        format: format_,
      };
      
      if (dateRange !== 'custom') {
        const days = parseInt(dateRange);
        const start = new Date();
        start.setDate(start.getDate() - days);
        params.start_date = format(start, 'yyyy-MM-dd');
        params.end_date = format(new Date(), 'yyyy-MM-dd');
      } else {
        params.start_date = startDate;
        params.end_date = endDate;
      }
      
      if (selectedCategory !== 'all') {
        params.category_id = selectedCategory;
      }
      
      const result = await exportMutation.mutateAsync(params);
      
      // Download the file
      const blob = format_ === 'csv' 
        ? new Blob([result], { type: 'text/csv' })
        : new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `second_cerveau_finances_${format(new Date(), 'yyyy-MM-dd')}.${format_}`;
      a.click();
      URL.revokeObjectURL(url);
      
      setStep('success');
      toast.success('Export téléchargé avec succès !');
    } catch (error) {
      toast.error('Erreur lors de l\'export');
    }
  };

  const resetModal = () => {
    setStep('config');
    setPreviewData(null);
  };

  const handleClose = (open: boolean) => {
    if (!open) resetModal();
    onOpenChange(open);
  };

  const getCategoryName = (id: string | null) => {
    if (!id) return 'Non catégorisé';
    return categories.find(c => c.id === id)?.name || 'Inconnu';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass-strong max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Exporter mes finances
          </DialogTitle>
          <DialogDescription>
            {step === 'config' && 'Configurez votre export personnalisé'}
            {step === 'preview' && 'Vérifiez l\'aperçu avant téléchargement'}
            {step === 'success' && 'Export terminé !'}
          </DialogDescription>
        </DialogHeader>

        {step === 'config' && (
          <div className="space-y-6 py-4">
            {/* Format Selection */}
            <div className="space-y-3">
              <Label>Format d'export</Label>
              <RadioGroup 
                value={format_} 
                onValueChange={(v: 'csv' | 'json') => setFormat(v)}
                className="flex gap-4"
              >
                <div className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all flex-1',
                  format_ === 'csv' ? 'border-primary bg-primary/5' : 'border-border'
                )}>
                  <RadioGroupItem value="csv" id="csv" />
                  <Label htmlFor="csv" className="cursor-pointer flex items-center gap-2">
                    <Table className="h-4 w-4" />
                    CSV
                  </Label>
                </div>
                <div className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all flex-1',
                  format_ === 'json' ? 'border-primary bg-primary/5' : 'border-border'
                )}>
                  <RadioGroupItem value="json" id="json" />
                  <Label htmlFor="json" className="cursor-pointer flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    JSON
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Date Range */}
            <div className="space-y-3">
              <Label>Période</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 derniers jours</SelectItem>
                  <SelectItem value="30">30 derniers jours</SelectItem>
                  <SelectItem value="90">3 derniers mois</SelectItem>
                  <SelectItem value="365">12 derniers mois</SelectItem>
                  <SelectItem value="custom">Personnalisé</SelectItem>
                </SelectContent>
              </Select>
              
              {dateRange === 'custom' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Début</Label>
                    <Input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Fin</Label>
                    <Input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Category Filter */}
            <div className="space-y-3">
              <Label>Catégorie</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 'preview' && previewData && (
          <div className="space-y-4 py-4">
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  {previewData.map((t, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="truncate flex-1">{t.description || 'Sans description'}</span>
                      <Badge variant="outline" className="mx-2">{getCategoryName(t.category_id)}</Badge>
                      <span className={cn(
                        'font-mono',
                        t.type === 'income' ? 'text-success' : ''
                      )}>
                        {t.type === 'income' ? '+' : '-'}{Number(t.amount).toFixed(2)} €
                      </span>
                    </div>
                  ))}
                  {transactions.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      + {transactions.length - 5} autres transactions...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Format: <Badge variant="secondary">{format_.toUpperCase()}</Badge></span>
              <span>~{transactions.length} transactions</span>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="py-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <p className="text-lg font-medium">Export réussi !</p>
            <p className="text-sm text-muted-foreground">
              Votre fichier a été téléchargé
            </p>
          </div>
        )}

        <DialogFooter>
          {step === 'config' && (
            <Button onClick={handlePreview} className="gradient-primary w-full">
              Aperçu
            </Button>
          )}
          {step === 'preview' && (
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={() => setStep('config')} className="flex-1">
                Retour
              </Button>
              <Button 
                onClick={handleExport} 
                className="gradient-primary flex-1"
                disabled={exportMutation.isPending}
              >
                {exportMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Export...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </>
                )}
              </Button>
            </div>
          )}
          {step === 'success' && (
            <Button onClick={() => handleClose(false)} className="w-full">
              Fermer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
