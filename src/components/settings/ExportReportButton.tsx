import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown, Loader2 } from 'lucide-react';
import { useExportPDF } from '@/hooks/useExportPDF';
import { useToast } from '@/hooks/use-toast';

type ExportPeriod = '7d' | '30d' | '90d' | 'all';

export function ExportReportButton() {
  const [period, setPeriod] = useState<ExportPeriod>('30d');
  const exportPDF = useExportPDF();
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      const result = await exportPDF.mutateAsync(period);
      toast({ 
        title: 'Rapport exporté ✅',
        description: `Fichier ${result.filename} téléchargé`,
      });
    } catch (error) {
      toast({ 
        title: 'Erreur d\'export', 
        description: 'Impossible de générer le rapport',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileDown className="h-5 w-5" />
          Export PDF
        </CardTitle>
        <CardDescription>
          Télécharge un rapport complet de ton profil comportemental
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as ExportPeriod)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="90d">90 derniers jours</SelectItem>
              <SelectItem value="all">Tout l'historique</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleExport} 
            disabled={exportPDF.isPending}
            className="flex-1 sm:flex-none"
          >
            {exportPDF.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 mr-2" />
            )}
            {exportPDF.isPending ? 'Génération...' : 'Exporter'}
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-3">
          Le rapport inclut : scores, habitudes, statistiques et recommandations personnalisées.
        </p>
      </CardContent>
    </Card>
  );
}
