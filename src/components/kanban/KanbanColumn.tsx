import { Badge } from '@/components/ui/badge';
import { Sparkles, Layers, Clock, AlertTriangle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KanbanStatus, KanbanTask } from '@/hooks/useKanban';
import { KanbanTaskCard } from './KanbanTaskCard';

interface KanbanColumnProps {
  id: KanbanStatus;
  title: string;
  tasks: KanbanTask[];
  accentColor: string;
  glowColor: string;
  isDropTarget: boolean;
  draggedTaskId?: string;
  projectsMap: Record<string, string>;
  goalsMap: Record<string, string>;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onTaskDragStart: (e: React.DragEvent, task: KanbanTask) => void;
  onTaskDragEnd: () => void;
}

// WIP limits configuration
const WIP_LIMITS: Record<KanbanStatus, number | null> = {
  backlog: null, // No limit
  todo: 10,
  doing: 3, // Strict limit for focus
  done: null,
};

// Calculate task age in days (using created_at since updated_at may not exist)
function getTaskAgeInColumn(task: KanbanTask): number {
  const entryDate = new Date(task.created_at);
  const now = new Date();
  return Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
}

// Get aging status
function getAgingStatus(age: number, columnId: KanbanStatus): { level: 'fresh' | 'aging' | 'stale' | 'critical'; label: string } {
  if (columnId === 'done') return { level: 'fresh', label: '' };
  
  if (columnId === 'doing') {
    if (age >= 7) return { level: 'critical', label: 'Bloquée depuis 7j+' };
    if (age >= 3) return { level: 'stale', label: 'En cours depuis 3j+' };
    if (age >= 1) return { level: 'aging', label: 'En cours depuis hier' };
    return { level: 'fresh', label: '' };
  }
  
  // todo / backlog
  if (age >= 14) return { level: 'critical', label: 'En attente depuis 2 sem.' };
  if (age >= 7) return { level: 'stale', label: 'En attente depuis 1 sem.' };
  if (age >= 3) return { level: 'aging', label: 'En attente 3j+' };
  return { level: 'fresh', label: '' };
}

// Get priority glow class
function getPriorityGlow(priority: string): string {
  switch (priority) {
    case 'urgent': return 'ring-2 ring-destructive/50 shadow-destructive/20';
    case 'high': return 'ring-1 ring-warning/30 shadow-warning/10';
    default: return '';
  }
}

export function KanbanColumn({
  id,
  title,
  tasks,
  accentColor,
  glowColor,
  isDropTarget,
  draggedTaskId,
  projectsMap,
  goalsMap,
  onDragOver,
  onDragLeave,
  onDrop,
  onTaskDragStart,
  onTaskDragEnd,
}: KanbanColumnProps) {
  // WIP limit check
  const wipLimit = WIP_LIMITS[id];
  const isOverWipLimit = wipLimit !== null && tasks.length > wipLimit;
  const isAtWipLimit = wipLimit !== null && tasks.length === wipLimit;
  
  // For done column, only show last 3 completed (rest accessible via history)
  const displayTasks = id === 'done' ? tasks.slice(0, 3) : tasks;
  const hiddenCount = id === 'done' ? Math.max(0, tasks.length - 3) : 0;

  // Stacked cards visual: show max 5 cards, rest as count badge
  const maxVisibleCards = id === 'done' ? 3 : 5;
  const visibleTasks = displayTasks.slice(0, maxVisibleCards);
  const stackedCount = displayTasks.length - maxVisibleCards;

  // Count stale/critical tasks
  const criticalCount = tasks.filter(t => getAgingStatus(getTaskAgeInColumn(t), id).level === 'critical').length;
  const staleCount = tasks.filter(t => getAgingStatus(getTaskAgeInColumn(t), id).level === 'stale').length;

  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl border transition-all duration-300',
        'bg-gradient-to-b from-card/50 to-card/30 backdrop-blur-sm',
        accentColor,
        isDropTarget && 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]',
        isDropTarget && glowColor,
        isOverWipLimit && 'border-destructive/50 bg-destructive/5'
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm tracking-wide">{title}</h3>
          </div>
          <div className="flex items-center gap-1.5">
            {/* WIP Badge */}
            {wipLimit !== null && (
              <Badge 
                variant={isOverWipLimit ? 'destructive' : isAtWipLimit ? 'warning' : 'outline'} 
                className="text-[10px] px-1.5"
              >
                {tasks.length}/{wipLimit}
              </Badge>
            )}
            {/* Count Badge */}
            <Badge 
              variant="secondary" 
              className={cn(
                'text-xs tabular-nums font-mono',
                id === 'doing' && tasks.length > 0 && 'bg-warning/20 text-warning',
                id === 'done' && tasks.length > 0 && 'bg-success/20 text-success'
              )}
            >
              {tasks.length}
            </Badge>
          </div>
        </div>
        
        {/* Aging indicators */}
        {(criticalCount > 0 || staleCount > 0) && id !== 'done' && (
          <div className="flex items-center gap-2 mt-2">
            {criticalCount > 0 && (
              <div className="flex items-center gap-1 text-destructive text-[10px]">
                <AlertTriangle className="h-3 w-3" />
                <span>{criticalCount} bloquée{criticalCount > 1 ? 's' : ''}</span>
              </div>
            )}
            {staleCount > 0 && (
              <div className="flex items-center gap-1 text-warning text-[10px]">
                <Clock className="h-3 w-3" />
                <span>{staleCount} en retard</span>
              </div>
            )}
          </div>
        )}
        
        {/* WIP Warning */}
        {isOverWipLimit && (
          <div className="flex items-center gap-1 mt-2 text-destructive text-[10px]">
            <Zap className="h-3 w-3" />
            <span>WIP dépassé ! Terminez avant d'ajouter.</span>
          </div>
        )}
      </div>
      
      {/* Stacked Cards Container */}
      <div className="relative p-3 flex-1 overflow-y-auto min-h-[200px] max-h-[calc(100vh-280px)] scrollbar-thin">
        {/* Stacked cards with visual pile effect */}
        <div className="relative space-y-3">
          {visibleTasks.map((task, index) => {
            const age = getTaskAgeInColumn(task);
            const agingStatus = getAgingStatus(age, id);
            const priorityGlow = getPriorityGlow(task.priority);
            
            return (
              <div 
                key={task.id} 
                className={cn(
                  'relative transition-all duration-200',
                  // Priority glow for urgent/high
                  priorityGlow,
                  // Aging visual indicators
                  agingStatus.level === 'critical' && 'ring-2 ring-destructive/40',
                  agingStatus.level === 'stale' && 'ring-1 ring-warning/30'
                )}
                style={{
                  // Create subtle stacking effect
                  zIndex: visibleTasks.length - index,
                }}
              >
                {/* Age indicator badge */}
                {agingStatus.level !== 'fresh' && id !== 'done' && (
                  <div className={cn(
                    'absolute -top-1 -left-1 z-20 px-1.5 py-0.5 rounded text-[9px] font-medium',
                    agingStatus.level === 'critical' && 'bg-destructive text-destructive-foreground',
                    agingStatus.level === 'stale' && 'bg-warning text-warning-foreground',
                    agingStatus.level === 'aging' && 'bg-muted text-muted-foreground'
                  )}>
                    <Clock className="h-2.5 w-2.5 inline mr-0.5" />
                    {age}j
                  </div>
                )}
                
                <KanbanTaskCard
                  task={task}
                  isDragging={draggedTaskId === task.id}
                  isTopInDoing={id === 'doing' && index === 0}
                  projectName={task.project_id ? projectsMap[task.project_id] : undefined}
                  goalTitle={(task as any).goal_id ? goalsMap[(task as any).goal_id] : undefined}
                  onDragStart={(e) => onTaskDragStart(e, task)}
                  onDragEnd={onTaskDragEnd}
                />
              </div>
            );
          })}
        </div>
        
        {/* Hidden count badge for stacked cards */}
        {stackedCount > 0 && (
          <div className="text-center py-3">
            <Badge variant="outline" className="text-xs text-muted-foreground">
              +{stackedCount} autres tâches
            </Badge>
          </div>
        )}
        
        {/* Hidden count for done column */}
        {hiddenCount > 0 && stackedCount <= 0 && (
          <div className="text-center py-2">
            <Badge variant="outline" className="text-xs text-muted-foreground">
              +{hiddenCount} tâches dans l'historique
            </Badge>
          </div>
        )}
        
        {/* Empty State */}
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <Sparkles className="h-8 w-8 mb-2 opacity-30" />
            <span className="text-xs">Aucune tâche</span>
          </div>
        )}
      </div>
    </div>
  );
}