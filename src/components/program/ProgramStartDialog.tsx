import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useJoinProgram, useActiveProgram, Program } from '@/hooks/useActiveProgram';

interface ProgramStartDialogProps {
  program: Program;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProgramStartDialog({ program, open, onOpenChange }: ProgramStartDialogProps) {
  const [confirmed, setConfirmed] = useState(false);
  const { data: activeProgram } = useActiveProgram();
  const joinProgram = useJoinProgram();
  
  const hasActiveProgram = !!activeProgram;
  
  const handleStart = async () => {
    await joinProgram.mutateAsync(program.id);
    onOpenChange(false);
    setConfirmed(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{program.icon}</span>
            Démarrer {program.name} ?
          </DialogTitle>
          <DialogDescription>
            {program.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Ce qui va être créé */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <h4 className="flex items-center gap-2 font-medium text-sm mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              Ce qui sera créé automatiquement :
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                Habitudes personnalisées selon tes intérêts
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                Tâches programmées pour chaque phase
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                Objectifs avec suivi de progression
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                Missions quotidiennes guidées par Sage
              </li>
            </ul>
          </div>
          
          {/* Avertissement si programme actif */}
          {hasActiveProgram && (
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Tu as un programme en cours</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    "{activeProgram.programs.name}" sera archivé mais tes données seront conservées 
                    pour l'historique et l'amélioration de l'IA.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Confirmation */}
          <div className="flex items-start gap-3 pt-2">
            <Checkbox
              id="confirm"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked as boolean)}
            />
            <label htmlFor="confirm" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
              Je comprends que mes habitudes, tâches et objectifs seront adaptés à ce programme
              {hasActiveProgram && ' et que mon programme actuel sera archivé'}.
            </label>
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleStart} disabled={!confirmed || joinProgram.isPending}>
            {joinProgram.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Démarrer le programme
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
