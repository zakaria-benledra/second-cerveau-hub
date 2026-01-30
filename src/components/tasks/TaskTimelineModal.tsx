import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  History, 
  Flag, 
  TrendingUp, 
  Target, 
  Battery, 
  Clock, 
  Calendar,
  CheckCircle2,
  Circle,
  PlayCircle,
  Archive
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { KanbanTask } from '@/hooks/useKanban';

interface TaskTimelineModalProps {
  task: KanbanTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName?: string;
  goalTitle?: string;
  onComplete?: (id: string) => void;
  isCompleting?: boolean;
}

const priorityConfig: Record<string, { bg: string; text: string; label: string; score: number }> = {
  urgent: { bg: 'bg-destructive/15', text: 'text-destructive', label: 'Urgent', score: 100 },
  high: { bg: 'bg-warning/15', text: 'text-warning', label: 'Haute', score: 75 },
  medium: { bg: 'bg-primary/15', text: 'text-primary', label: 'Moyenne', score: 50 },
  low: { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Basse', score: 25 },
};

const energyConfig: Record<string, { icon: string; color: string; label: string }> = {
  high: { icon: '🚀', color: 'text-destructive', label: 'Haute' },
  medium: { icon: '⚡', color: 'text-warning', label: 'Moyenne' },
  low: { icon: '🔋', color: 'text-success', label: 'Faible' },
};

const statusConfig: Record<string, { icon: typeof Circle; label: string; color: string }> = {
  backlog: { icon: Archive, label: 'Backlog', color: 'text-muted-foreground' },
  todo: { icon: Circle, label: 'À faire', color: 'text-info' },
  doing: { icon: PlayCircle, label: 'En cours', color: 'text-warning' },
  done: { icon: CheckCircle2, label: 'Terminée', color: 'text-success' },
};

function calculateImpactScore(task: KanbanTask): number {
  let score = priorityConfig[task.priority]?.score || 50;
  if (task.project_id) score += 15;
  if (task.due_date) {
    const daysUntilDue = Math.ceil((new Date(task.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilDue <= 0) score += 30;
    else if (daysUntilDue <= 1) score += 20;
    else if (daysUntilDue <= 3) score += 10;
  }
  return Math.min(score, 100);
}

export function TaskTimelineModal({
  task,
  open,
  onOpenChange,
  projectName,
  goalTitle,
  onComplete,
  isCompleting,
}: TaskTimelineModalProps) {
  if (!task) return null;

  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const energy = energyConfig[task.energy_level || 'medium'];
  const status = statusConfig[task.kanban_status || 'todo'];
  const impactScore = calculateImpactScore(task);
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.kanban_status !== 'done';
  const StatusIcon = status.icon;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Flag className={cn('h-5 w-5', priority.text)} />
            <span className="line-clamp-1">{task.title}</span>
          </SheetTitle>
          <SheetDescription>
            Historique complet et détails de la tâche
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Impact Summary */}
          <div className="glass-strong rounded-2xl p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Score d'Impact
            </h3>
            <div className="flex items-center gap-4">
              <div className={cn(
                'flex items-center justify-center w-16 h-16 rounded-2xl text-2xl font-bold',
                impactScore >= 80 ? 'bg-gradient-to-br from-destructive to-warning text-destructive-foreground' :
                impactScore >= 60 ? 'bg-gradient-to-br from-warning to-amber-400 text-warning-foreground' :
                impactScore >= 40 ? 'bg-gradient-to-br from-primary to-accent text-primary-foreground' :
                'bg-muted text-muted-foreground'
              )}>
                {impactScore}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge className={cn('text-xs', priority.bg, priority.text)}>
                    {priority.label}
                  </Badge>
                  {energy && (
                    <Badge variant="outline" className="text-xs">
                      {energy.icon} Énergie {energy.label}
                    </Badge>
                  )}
                  <Badge variant="outline" className={cn('text-xs', status.color)}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                </div>
                {(goalTitle || projectName) && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Target className="h-3 w-3 text-accent" />
                    Lié à: {goalTitle || projectName}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Task Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Détails</h3>
            {task.description && (
              <p className="text-sm text-muted-foreground bg-muted/30 rounded-xl p-3">
                {task.description}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {task.due_date && (
                <div className="glass-hover rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <Calendar className="h-3 w-3" />
                    Échéance
                  </div>
                  <span className={cn('font-medium', isOverdue && 'text-destructive')}>
                    {format(new Date(task.due_date), 'PPP', { locale: fr })}
                    {isOverdue && ' (En retard)'}
                  </span>
                </div>
              )}
              {task.estimate_min && (
                <div className="glass-hover rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <Clock className="h-3 w-3" />
                    Estimation
                  </div>
                  <span className="font-medium">{task.estimate_min} minutes</span>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <History className="h-4 w-4" />
              Historique
            </h3>
            <div className="relative pl-4 border-l-2 border-border space-y-4">
              {/* Created */}
              <div className="relative">
                <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-primary border-2 border-background" />
                <div className="text-sm">
                  <span className="font-medium">Créée</span>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(task.created_at), 'PPP à HH:mm', { locale: fr })}
                  </p>
                </div>
              </div>
              
              {/* Status changes would come from audit_log - showing current state */}
              {task.kanban_status === 'doing' && (
                <div className="relative">
                  <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-warning border-2 border-background" />
                  <div className="text-sm">
                    <span className="font-medium">Démarrée</span>
                    <p className="text-xs text-muted-foreground">
                      En cours de réalisation
                    </p>
                  </div>
                </div>
              )}

              {task.kanban_status === 'done' && (
                <div className="relative">
                  <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-success border-2 border-background" />
                  <div className="text-sm">
                    <span className="font-medium">Terminée</span>
                    <p className="text-xs text-muted-foreground">
                      Tâche complétée
                    </p>
                  </div>
                </div>
              )}

              {/* Current Status (if not done) */}
              {task.kanban_status !== 'done' && (
                <div className="relative">
                  <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-accent border-2 border-background animate-pulse" />
                  <div className="text-sm">
                    <span className="font-medium">Statut actuel</span>
                    <p className="text-xs text-muted-foreground">
                      {status.label}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {task.kanban_status !== 'done' && onComplete && (
            <div className="pt-4 border-t border-border">
              <Button 
                className="w-full" 
                variant="gradient"
                onClick={() => onComplete(task.id)}
                disabled={isCompleting}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Marquer comme terminée
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
