import { useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useKanbanTasks, useMoveKanbanTask, type KanbanStatus, type KanbanTask } from '@/hooks/useKanban';
import { useCreateTask } from '@/hooks/useTasks';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { Plus, GripVertical, Clock, Calendar, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CreateTaskInput, UpdateTaskInput } from '@/lib/api/tasks';

const COLUMNS: { id: KanbanStatus; title: string; color: string }[] = [
  { id: 'backlog', title: 'Backlog', color: 'bg-muted' },
  { id: 'todo', title: 'À faire', color: 'bg-blue-500/10' },
  { id: 'doing', title: 'En cours', color: 'bg-yellow-500/10' },
  { id: 'done', title: 'Terminé', color: 'bg-green-500/10' },
];

const priorityColors: Record<string, string> = {
  urgent: 'bg-destructive text-destructive-foreground',
  high: 'bg-orange-500 text-white',
  medium: 'bg-primary text-primary-foreground',
  low: 'bg-muted text-muted-foreground',
};

export default function KanbanPage() {
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
              <Card key={i} className="min-h-[400px]">
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <Skeleton key={j} className="h-24 w-full" />
                  ))}
                </CardContent>
              </Card>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tableau Kanban</h1>
            <p className="text-muted-foreground mt-1">
              Glissez-déposez les tâches entre les colonnes
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle tâche
          </Button>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-h-[600px]">
          {COLUMNS.map((column) => {
            const tasks = columns?.[column.id] || [];
            const isOver = dragOverColumn === column.id;
            
            return (
              <Card
                key={column.id}
                className={cn(
                  'transition-all duration-200',
                  isOver && 'ring-2 ring-primary ring-offset-2'
                )}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <CardHeader className={cn('py-3', column.color)}>
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span>{column.title}</span>
                    <Badge variant="secondary" className="ml-2">
                      {tasks.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 space-y-2 min-h-[400px]">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        'p-3 rounded-lg border bg-card hover:shadow-md transition-all cursor-grab active:cursor-grabbing',
                        draggedTask?.id === task.id && 'opacity-50 ring-2 ring-primary'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-2">{task.title}</p>
                          {task.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
                            <Badge 
                              variant="secondary" 
                              className={cn('text-xs', priorityColors[task.priority])}
                            >
                              {task.priority}
                            </Badge>
                            {task.estimate_min && (
                              <Badge variant="outline" className="text-xs gap-1">
                                <Clock className="h-3 w-3" />
                                {task.estimate_min}m
                              </Badge>
                            )}
                            {task.due_date && (
                              <Badge variant="outline" className="text-xs gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(task.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {tasks.length === 0 && (
                    <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                      Aucune tâche
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {moveTask.isPending && (
          <div className="fixed bottom-4 right-4 bg-card border rounded-lg p-3 shadow-lg flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
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
