import { Badge } from '@/components/ui/badge';
import { Sparkles, Layers } from 'lucide-react';
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
  // For done column, only show last 3 completed (rest accessible via history)
  const displayTasks = id === 'done' ? tasks.slice(0, 3) : tasks;
  const hiddenCount = id === 'done' ? Math.max(0, tasks.length - 3) : 0;

  // Stacked cards visual: show max 5 cards, rest as count badge
  const maxVisibleCards = id === 'done' ? 3 : 5;
  const visibleTasks = displayTasks.slice(0, maxVisibleCards);
  const stackedCount = displayTasks.length - maxVisibleCards;

  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl border transition-all duration-300',
        'bg-gradient-to-b from-card/50 to-card/30 backdrop-blur-sm',
        accentColor,
        isDropTarget && 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]',
        isDropTarget && glowColor
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
      
      {/* Stacked Cards Container */}
      <div className="relative p-3 flex-1 overflow-hidden min-h-[200px] max-h-[calc(100vh-280px)]">
        {/* Stacked cards with visual pile effect */}
        <div className="relative">
          {visibleTasks.map((task, index) => (
            <div 
              key={task.id} 
              className="mb-3 last:mb-0"
              style={{
                // Create subtle stacking effect
                zIndex: visibleTasks.length - index,
              }}
            >
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
          ))}
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
