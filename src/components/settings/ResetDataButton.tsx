import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, Trash2, ShieldCheck, Brain } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useResetData } from '@/hooks/useResetData';

export function ResetDataButton() {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const resetData = useResetData();

  const canReset = confirmation === 'RESET';

  const handleReset = async () => {
    await resetData.mutateAsync();
    setOpen(false);
    setConfirmation('');
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10">
          <Trash2 className="h-4 w-4 mr-2" />
          Réinitialiser mes données
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Réinitialiser toutes mes données ?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 text-left">
              <p className="text-sm text-muted-foreground">
                Cette action va supprimer définitivement :
              </p>
              
              {/* Ce qui sera supprimé */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-destructive">❌ Sera supprimé :</p>
                <div className="flex flex-wrap gap-1">
                  {['Habitudes', 'Tâches', 'Objectifs', 'Journal', 'Transactions', 'Scores', 'XP', 'Badges', 'Streak', 'Programme actif'].map(item => (
                    <Badge key={item} variant="outline" className="text-xs border-destructive/30 text-destructive">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Ce qui sera préservé */}
              <div className="space-y-2 p-3 rounded-lg bg-success/10 border border-success/20">
                <p className="text-sm font-medium text-success flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Sera préservé (pour l'apprentissage AI) :
                </p>
                <div className="flex flex-wrap gap-1">
                  {['Profil IA', 'Feedback', 'Préférences', 'Personnalisation', 'Historique programmes'].map(item => (
                    <Badge key={item} variant="secondary" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                <div className="flex items-start gap-2">
                  <Brain className="h-4 w-4 text-accent mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Sage conservera ce qu'il a appris sur toi pour mieux t'accompagner lors de ton nouveau départ.
                  </p>
                </div>
              </div>

              {/* Confirmation */}
              <div className="space-y-2">
                <Label htmlFor="confirmation" className="text-sm">
                  Tape RESET pour confirmer :
                </Label>
                <Input
                  id="confirmation"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value.toUpperCase())}
                  placeholder="RESET"
                  className="font-mono"
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmation('')}>
            Annuler
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleReset}
            disabled={!canReset || resetData.isPending}
          >
            {resetData.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Réinitialisation...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Réinitialiser tout
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
