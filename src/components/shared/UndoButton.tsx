import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Undo2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface UndoAction {
  id: string;
  type: 'task' | 'habit' | 'journal' | 'transaction';
  action: 'delete' | 'complete' | 'update';
  data: any;
  timestamp: number;
  undo: () => Promise<void>;
}

// Store global pour les actions annulables
const undoStore: UndoAction[] = [];
const MAX_UNDO_HISTORY = 10;

export function addUndoAction(action: Omit<UndoAction, 'id' | 'timestamp'>) {
  const newAction: UndoAction = {
    ...action,
    id: Math.random().toString(36).slice(2),
    timestamp: Date.now(),
  };
  
  undoStore.unshift(newAction);
  if (undoStore.length > MAX_UNDO_HISTORY) {
    undoStore.pop();
  }
  
  // Dispatch event pour mettre à jour les composants
  window.dispatchEvent(new CustomEvent('undo-action-added', { detail: newAction }));
}

export function UndoButton() {
  const [lastAction, setLastAction] = useState<UndoAction | null>(null);
  const [isUndoing, setIsUndoing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleNewAction = (e: CustomEvent<UndoAction>) => {
      setLastAction(e.detail);
      setShowSuccess(false);
    };

    window.addEventListener('undo-action-added', handleNewAction as EventListener);
    return () => window.removeEventListener('undo-action-added', handleNewAction as EventListener);
  }, []);

  // Auto-hide après 10 secondes
  useEffect(() => {
    if (lastAction) {
      const timer = setTimeout(() => {
        setLastAction(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [lastAction]);

  const handleUndo = async () => {
    if (!lastAction || isUndoing) return;
    
    setIsUndoing(true);
    try {
      await lastAction.undo();
      setShowSuccess(true);
      toast({ title: '✅ Action annulée' });
      
      setTimeout(() => {
        setLastAction(null);
        setShowSuccess(false);
      }, 1500);
    } catch (error) {
      toast({ title: 'Erreur lors de l\'annulation', variant: 'destructive' });
    } finally {
      setIsUndoing(false);
    }
  };

  const handleDismiss = () => {
    setLastAction(null);
  };

  if (!lastAction) return null;

  const actionLabels: Record<string, string> = {
    delete: 'Suppression',
    complete: 'Complétion',
    update: 'Modification',
  };

  const typeLabels: Record<string, string> = {
    task: 'tâche',
    habit: 'habitude',
    journal: 'entrée',
    transaction: 'transaction',
  };

  return (
    <div className={cn(
      "fixed bottom-24 left-1/2 -translate-x-1/2 z-50",
      "flex items-center gap-2 px-4 py-2 rounded-full",
      "bg-card border shadow-lg",
      "animate-in slide-in-from-bottom-4 fade-in duration-300"
    )}>
      {showSuccess ? (
        <>
          <Check className="h-4 w-4 text-success" />
          <span className="text-sm font-medium text-success">Annulé !</span>
        </>
      ) : (
        <>
          <span className="text-sm text-muted-foreground">
            {actionLabels[lastAction.action]} {typeLabels[lastAction.type]}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleUndo}
            disabled={isUndoing}
            className="h-7 px-2 text-primary"
          >
            <Undo2 className="h-3 w-3 mr-1" />
            Annuler
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="h-7 w-7 p-0 text-muted-foreground"
          >
            <X className="h-3 w-3" />
          </Button>
        </>
      )}
    </div>
  );
}
