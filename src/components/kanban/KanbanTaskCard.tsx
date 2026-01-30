import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { 
  GripVertical, 
  Clock, 
  Target,
  TrendingUp,
  Battery,
  Calendar,
  History,
  ChevronRight,
  Zap,
  Flag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KanbanTask } from '@/hooks/useKanban';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface KanbanTaskCardProps {
  task: KanbanTask;
  isDragging: boolean;
  isTopInDoing?: boolean;
  projectName?: string;
  goalTitle?: string;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

const priorityConfig: Record<string, { bg: string; text: string; dot: string; label: string; score: number }> = {
  urgent: { bg: 'bg-destructive/15', text: 'text-destructive', dot: 'bg-destructive', label: 'Urgent', score: 100 },
  high: { bg: 'bg-warning/15', text: 'text-warning', dot: 'bg-warning', label: 'Haute', score: 75 },
  medium: { bg: 'bg-primary/15', text: 'text-primary', dot: 'bg-primary', label: 'Moyenne', score: 50 },
  low: { bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-muted-foreground', label: 'Basse', score: 25 },
};

const energyConfig: Record<string, { icon: string; color: string; label: string; cost: string }> = {
  high: { icon: '🚀', color: 'text-destructive', label: 'Haute', cost: '3' },
  medium: { icon: '⚡', color: 'text-warning', label: 'Moyenne', cost: '2' },
  low: { icon: '🔋', color: 'text-success', label: 'Faible', cost: '1' },
};

// Calculate impact score based on priority, due date, and goal linkage
function calculateImpactScore(task: KanbanTask): number {
  let score = priorityConfig[task.priority]?.score || 50;
  
  // Bonus for having a goal
  if (task.project_id) score += 15;
  
  // Urgency bonus based on due date
  if (task.due_date) {
    const daysUntilDue = Math.ceil((new Date(task.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilDue <= 0) score += 30; // Overdue
    else if (daysUntilDue <= 1) score += 20;
    else if (daysUntilDue <= 3) score += 10;
  }
  
  return Math.min(score, 100);
}

export function KanbanTaskCard({
  task,
  isDragging,
  isTopInDoing,
  projectName,
  goalTitle,
  onDragStart,
  onDragEnd,
}: KanbanTaskCardProps) {
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const energy = energyConfig[task.energy_level || 'medium'];
  const impactScore = calculateImpactScore(task);
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.kanban_status !== 'done';

  return (
    <>
      <div
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onClick={() => setIsTimelineOpen(true)}
        className={cn(
          'group relative cursor-grab active:cursor-grabbing',
          'rounded-2xl border border-border/50 p-4',
          'bg-card/80 backdrop-blur-sm',
          'hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5',
          'transition-all duration-300 ease-out',
          isDragging && 'opacity-50 scale-95 ring-2 ring-primary',
          isTopInDoing && 'ring-1 ring-warning/50 bg-warning/5'
        )}
      >
        {/* Impact Score Badge - Top Right */}
        <div className="absolute -top-2 -right-2 z-10">
          <div className={cn(
            'flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold',
            'shadow-lg transition-transform group-hover:scale-110',
            impactScore >= 80 ? 'bg-gradient-to-br from-destructive to-warning text-destructive-foreground' :
            impactScore >= 60 ? 'bg-gradient-to-br from-warning to-amber-400 text-warning-foreground' :
            impactScore >= 40 ? 'bg-gradient-to-br from-primary to-accent text-primary-foreground' :
            'bg-muted text-muted-foreground'
          )}>
            {impactScore}
          </div>
        </div>

        {/* Header Row */}
        <div className="flex items-start gap-2 mb-3">
          <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors mt-0.5 shrink-0" />
          
          <div className="flex-1 min-w-0">
            {/* Priority + Title */}
            <div className="flex items-center gap-2 mb-1">
              <div className={cn('w-2 h-2 rounded-full shrink-0', priority.dot)} />
              <h4 className="font-semibold text-sm line-clamp-2 leading-tight">
                {task.title}
              </h4>
            </div>
            
            {/* Related Goal/Objective */}
            {(goalTitle || projectName) && (
              <div className="flex items-center gap-1.5 text-xs text-accent mt-1">
                <Target className="h-3 w-3" />
                <span className="truncate">{goalTitle || projectName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3 pl-6">
            {task.description}
          </p>
        )}

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-2 pl-6">
          {/* Energy Cost */}
          <div className="flex items-center gap-1.5">
            <Battery className={cn('h-3.5 w-3.5', energy?.color || 'text-muted-foreground')} />
            <span className="text-xs text-muted-foreground">
              Coût: <span className="font-medium text-foreground">{energy?.cost || '?'}</span>
            </span>
          </div>

          {/* Time Estimate */}
          {task.estimate_min && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {task.estimate_min}min
              </span>
            </div>
          )}

          {/* Due Date */}
          {task.due_date && (
            <div className={cn(
              'flex items-center gap-1.5 col-span-2',
              isOverdue && 'text-destructive'
            )}>
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">
                {format(new Date(task.due_date), 'd MMM', { locale: fr })}
                {isOverdue && ' • En retard'}
              </span>
            </div>
          )}
        </div>

        {/* View Timeline Indicator */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <History className="h-3 w-3" />
            <ChevronRight className="h-3 w-3" />
          </div>
        </div>
      </div>

      {/* Timeline Sheet */}
      <Sheet open={isTimelineOpen} onOpenChange={setIsTimelineOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Flag className={cn('h-5 w-5', priority.text)} />
              {task.title}
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
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge className={cn('text-xs', priority.bg, priority.text)}>
                      {priority.label}
                    </Badge>
                    {energy && (
                      <Badge variant="outline" className="text-xs">
                        {energy.icon} Énergie {energy.label}
                      </Badge>
                    )}
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
                <p className="text-sm text-muted-foreground">{task.description}</p>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {task.due_date && (
                  <div className="glass-hover rounded-xl p-3">
                    <span className="text-xs text-muted-foreground block">Échéance</span>
                    <span className={cn('font-medium', isOverdue && 'text-destructive')}>
                      {format(new Date(task.due_date), 'PPP', { locale: fr })}
                    </span>
                  </div>
                )}
                {task.estimate_min && (
                  <div className="glass-hover rounded-xl p-3">
                    <span className="text-xs text-muted-foreground block">Estimation</span>
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
                
                {/* Current Status */}
                <div className="relative">
                  <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-accent border-2 border-background" />
                  <div className="text-sm">
                    <span className="font-medium">Statut actuel</span>
                    <p className="text-xs text-muted-foreground capitalize">
                      {task.kanban_status === 'backlog' ? 'Backlog' :
                       task.kanban_status === 'todo' ? 'À faire' :
                       task.kanban_status === 'doing' ? 'En cours' : 'Terminée'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
