import { useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useKanbanTasks, useMoveKanbanTask, type KanbanStatus, type KanbanTask } from '@/hooks/useKanban';
import { useCreateTask } from '@/hooks/useTasks';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { 
  Plus, 
  GripVertical, 
  Clock, 
  Target,
  TrendingUp,
  Loader2,
  Sparkles,
  History,
  Battery,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import type { CreateTaskInput, UpdateTaskInput } from '@/lib/api/tasks';

const COLUMNS: { id: KanbanStatus; title: string; color: string; glow: string }[] = [
  { id: 'backlog', title: 'Backlog', color: 'bg-muted/30 border-muted', glow: '' },
  { id: 'todo', title: 'À faire', color: 'bg-info/5 border-info/30', glow: 'hover:shadow-info/10' },
  { id: 'doing', title: 'En cours', color: 'bg-warning/5 border-warning/30', glow: 'hover:shadow-warning/10' },
  { id: 'done', title: 'Terminé', color: 'bg-success/5 border-success/30', glow: 'hover:shadow-success/10' },
];

const priorityStyles: Record<string, { bg: string; text: string; dot: string }> = {
  urgent: { bg: 'bg-destructive/15', text: 'text-destructive', dot: 'bg-destructive' },
  high: { bg: 'bg-warning/15', text: 'text-warning', dot: 'bg-warning' },
  medium: { bg: 'bg-primary/15', text: 'text-primary', dot: 'bg-primary' },
  low: { bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-muted-foreground' },
};

const energyColors: Record<string, string> = {
  high: 'text-success',
  medium: 'text-warning',
  low: 'text-muted-foreground',
};

export default function KanbanPage() {
  const navigate = useNavigate();
  const { data: columns, isLoading } = useKanbanTasks();
  const moveTask = useMoveKanbanTask();
  const createTask = useCreateTask();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [draggedTask, setDraggedTask] = useState<KanbanTask | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<KanbanStatus | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, task: KanbanTask) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, columnId: KanbanStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, newStatus: KanbanStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (draggedTask && draggedTask.kanban_status !== newStatus) {
      moveTask.mutate({
        taskId: draggedTask.id,
        newStatus,
      });
    }
    setDraggedTask(null);
  }, [draggedTask, moveTask]);

  const handleDragEnd = useCallback(() => {
    setDraggedTask(null);
    setDragOverColumn(null);
  }, []);

  const handleCreateTask = async (data: CreateTaskInput | UpdateTaskInput) => {
    await createTask.mutateAsync(data as CreateTaskInput);
    setIsCreateDialogOpen(false);
  };

  // Calculate board stats
  const totalTasks = Object.values(columns || {}).flat().length;
  const doneTasks = columns?.done?.length || 0;
  const doingTasks = columns?.doing?.length || 0;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-12 w-full rounded-xl" />
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-32 w-full rounded-xl" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 h-full">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gradient">
              Tableau Kanban
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualisez et gérez le flux de vos tâches
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Quick Stats */}
            <div className="glass-hover px-4 py-2 rounded-xl flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-warning" />
                <span className="text-muted-foreground">En cours:</span>
                <span className="font-semibold">{doingTasks}</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="text-muted-foreground">Terminé:</span>
                <span className="font-semibold">{doneTasks}/{totalTasks}</span>
              </div>
            </div>
            
            <Button 
              className="gradient-primary text-primary-foreground shadow-lg"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle tâche
            </Button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-h-[600px]">
          {COLUMNS.map((column) => {
            const tasks = columns?.[column.id] || [];
            const isOver = dragOverColumn === column.id;
            
            return (
              <div
                key={column.id}
                className={cn(
                  'rounded-2xl border transition-all duration-200 flex flex-col',
                  column.color,
                  isOver && 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]'
                )}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column Header */}
                <div className="p-4 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">{column.title}</h3>
                    <Badge 
                      variant="secondary" 
                      className="text-xs tabular-nums"
                    >
                      {tasks.length}
                    </Badge>
                  </div>
                </div>
                
                {/* Stacked Cards */}
                <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                  {tasks.map((task, index) => {
                    const priority = priorityStyles[task.priority];
                    
                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          'glass-hover p-4 rounded-xl cursor-grab active:cursor-grabbing group',
                          'hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200',
                          draggedTask?.id === task.id && 'opacity-50 ring-2 ring-primary scale-95',
                          index === 0 && column.id === 'doing' && 'border-warning/30 bg-warning/5'
                        )}
                        onClick={() => navigate(`/tasks?id=${task.id}`)}
                      >
                        {/* Drag handle + Priority dot */}
                        <div className="flex items-center gap-2 mb-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                          <div className={cn('w-2 h-2 rounded-full', priority.dot)} />
                          <Badge className={cn('text-xs border-0', priority.bg, priority.text)}>
                            {task.priority}
                          </Badge>
                          {task.project_id && (
                            <Target className="h-3 w-3 text-accent ml-auto" />
                          )}
                        </div>
                        
                        {/* Task Title */}
                        <h4 className="font-medium text-sm line-clamp-2 mb-2">
                          {task.title}
                        </h4>
                        
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                            {task.description}
                          </p>
                        )}
                        
                        {/* Metadata Row */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {task.estimate_min && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5 gap-1">
                              <Clock className="h-2.5 w-2.5" />
                              {task.estimate_min}m
                            </Badge>
                          )}
                          
                          {task.energy_level && (
                            <Badge variant="outline" className={cn('text-xs px-2 py-0.5 gap-1 border-0', energyColors[task.energy_level])}>
                              <Battery className="h-2.5 w-2.5" />
                              {task.energy_level === 'high' ? 'Haute' : task.energy_level === 'medium' ? 'Moy.' : 'Basse'}
                            </Badge>
                          )}
                          
                          {task.due_date && (
                            <Badge 
                              variant="outline" 
                              className={cn(
                                'text-xs px-2 py-0.5',
                                new Date(task.due_date) < new Date() && task.kanban_status !== 'done' && 'text-destructive border-destructive/30'
                              )}
                            >
                              {new Date(task.due_date).toLocaleDateString('fr-FR', { 
                                day: 'numeric', 
                                month: 'short' 
                              })}
                            </Badge>
                          )}
                        </div>

                        {/* Impact score (if linked to project) */}
                        {task.project_id && (
                          <div className="mt-3 pt-2 border-t border-border/30 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              Projet lié
                            </span>
                            <Target className="h-3 w-3 text-accent" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {tasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                      <Sparkles className="h-8 w-8 mb-2 opacity-30" />
                      <span className="text-xs">Aucune tâche</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* History Link */}
        <div className="flex justify-center">
          <Link 
            to="/tasks"
            className="glass-hover px-4 py-2 rounded-full flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <History className="h-4 w-4" />
            Voir l'historique des tâches
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {moveTask.isPending && (
          <div className="fixed bottom-4 right-4 glass-strong rounded-xl p-3 shadow-xl flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm">Mise à jour...</span>
          </div>
        )}

        <TaskDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          mode="create"
          onSave={handleCreateTask}
          isPending={createTask.isPending}
        />
      </div>
    </AppLayout>
  );
}
