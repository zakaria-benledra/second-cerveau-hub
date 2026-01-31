import { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  GripVertical, 
  Clock, 
  Target,
  Battery,
  Calendar,
  History,
  ChevronRight,
  ListChecks
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KanbanTask } from '@/hooks/useKanban';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TaskActionsSheet } from './TaskActionsSheet';
import { useTaskChecklist } from '@/hooks/useTaskChecklist';

interface KanbanTaskCardProps {
  task: KanbanTask;
  isDragging: boolean;
  isHighlighted?: boolean;
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
  isHighlighted,
  isTopInDoing,
  projectName,
  goalTitle,
  onDragStart,
  onDragEnd,
}: KanbanTaskCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isLocalDragging, setIsLocalDragging] = useState(false);
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const energy = energyConfig[task.energy_level || 'medium'];
  const impactScore = calculateImpactScore(task);
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.kanban_status !== 'done';
  
  // Fetch checklist for progress indicator
  const { data: checklistItems = [] } = useTaskChecklist(task.id);
  const checklistTotal = checklistItems.length;
  const checklistCompleted = checklistItems.filter(item => item.completed).length;
  
  // Task aging calculation
  const age = differenceInDays(new Date(), new Date(task.created_at));
  const isAging = age > 7 && task.kanban_status !== 'done';
  const isStale = age > 14 && task.kanban_status !== 'done';

  // Auto-scroll and pulse effect when highlighted
  useEffect(() => {
    if (isHighlighted && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isHighlighted]);

  // ISSUE #11 FIX: Better visual feedback for dragging
  const handleDragStart = (e: React.DragEvent) => {
    setIsLocalDragging(true);
    
    // Create custom drag image
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.opacity = '0.8';
    dragImage.style.transform = 'scale(1.02)';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => dragImage.remove(), 0);
    
    onDragStart(e);
  };

  const handleDragEnd = () => {
    setIsLocalDragging(false);
    onDragEnd();
  };

  const actualDragging = isDragging || isLocalDragging;

  return (
    <>
      <div
        ref={cardRef}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={() => setIsSheetOpen(true)}
        className={cn(
          'group relative cursor-grab active:cursor-grabbing',
          'rounded-2xl border border-border/50 p-4',
          'bg-card/80 backdrop-blur-sm',
          'hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5',
          'transition-all duration-300 ease-out',
          // ISSUE #11 FIX: Enhanced dragging visual
          actualDragging && 'opacity-40 scale-95 ring-2 ring-primary shadow-xl shadow-primary/20',
          isTopInDoing && 'ring-1 ring-warning/50 bg-warning/5',
          // Highlighted task (from URL param)
          isHighlighted && 'ring-2 ring-primary ring-offset-2 ring-offset-background animate-pulse bg-primary/10 shadow-xl shadow-primary/30'
        )}
      >
        {/* Checklist indicator on card - inside draggable container */}
        {checklistTotal > 0 && (
          <div className="absolute top-2 left-2 z-10 pointer-events-none">
            <Badge 
              variant="outline" 
              className={cn(
                'text-[10px] px-1.5 py-0.5',
                checklistCompleted === checklistTotal && 'bg-success/20 text-success border-success/30'
              )}
            >
              <ListChecks className="h-3 w-3 mr-1" />
              {checklistCompleted}/{checklistTotal}
            </Badge>
          </div>
        )}

        {/* Impact Score Badge - Top Right */}
        <div className="absolute -top-2 -right-2 z-10 pointer-events-none">
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

        {/* Task Aging Indicator */}
        {isAging && (
          <div className={cn(
            "flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg mt-3 ml-6",
            isStale 
              ? "bg-destructive/10 text-destructive border border-destructive/20" 
              : "bg-warning/10 text-warning border border-warning/20"
          )}>
            <Clock className="h-3 w-3" />
            <span>Créée il y a {age} jours</span>
            {isStale && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                Stagnante
              </Badge>
            )}
          </div>
        )}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <History className="h-3 w-3" />
            <ChevronRight className="h-3 w-3" />
          </div>
        </div>
      </div>

      {/* Task Actions Sheet */}
      <TaskActionsSheet
        task={task}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        impactScore={impactScore}
        priorityConfig={priority}
        energyConfig={energy}
        projectName={projectName}
        goalTitle={goalTitle}
        isOverdue={!!isOverdue}
      />
    </>
  );
}
