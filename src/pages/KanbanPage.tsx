import { useState, useCallback, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { useKanbanTasks, useMoveKanbanTask, type KanbanStatus, type KanbanTask } from '@/hooks/useKanban';
import { useCreateTask } from '@/hooks/useTasks';
import { useProjects, useGoals } from '@/hooks/useProjects';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { KanbanHeader } from '@/components/kanban/KanbanHeader';
import { KanbanColumn } from '@/components/kanban/KanbanColumn';
import { Loader2 } from 'lucide-react';
import type { CreateTaskInput, UpdateTaskInput } from '@/lib/api/tasks';

const COLUMNS: { id: KanbanStatus; title: string; accent: string; glow: string }[] = [
  { id: 'backlog', title: 'Backlog', accent: 'border-muted/50', glow: 'shadow-muted/20' },
  { id: 'todo', title: 'À Faire', accent: 'border-info/30', glow: 'shadow-info/20' },
  { id: 'doing', title: 'En Cours', accent: 'border-warning/30', glow: 'shadow-warning/20' },
  { id: 'done', title: 'Terminé', accent: 'border-success/30', glow: 'shadow-success/20' },
];

// Calculate impact score for a task
function calculateImpactScore(task: KanbanTask): number {
  const priorityScores: Record<string, number> = { urgent: 100, high: 75, medium: 50, low: 25 };
  let score = priorityScores[task.priority] || 50;
  if (task.project_id) score += 15;
  if (task.due_date) {
    const daysUntilDue = Math.ceil((new Date(task.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilDue <= 0) score += 30;
    else if (daysUntilDue <= 1) score += 20;
    else if (daysUntilDue <= 3) score += 10;
  }
  return Math.min(score, 100);
}

export default function KanbanPage() {
  const { data: columns, isLoading } = useKanbanTasks();
  const { data: projects = [] } = useProjects();
  const { data: goals = [] } = useGoals();
  const moveTask = useMoveKanbanTask();
  const createTask = useCreateTask();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [draggedTask, setDraggedTask] = useState<KanbanTask | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<KanbanStatus | null>(null);

  // Create lookup maps for projects and goals
  const projectsMap = useMemo(() => {
    return projects.reduce((acc, p) => ({ ...acc, [p.id]: p.name }), {} as Record<string, string>);
  }, [projects]);

  const goalsMap = useMemo(() => {
    return goals.reduce((acc, g) => ({ ...acc, [g.id]: g.title }), {} as Record<string, string>);
  }, [goals]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!columns) return { total: 0, doing: 0, done: 0, avgImpact: 0 };
    
    const allTasks = [...columns.backlog, ...columns.todo, ...columns.doing, ...columns.done];
    const total = allTasks.length;
    const doing = columns.doing.length;
    const done = columns.done.length;
    
    const avgImpact = total > 0 
      ? Math.round(allTasks.reduce((sum, t) => sum + calculateImpactScore(t), 0) / total)
      : 0;
    
    return { total, doing, done, avgImpact };
  }, [columns]);

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
              <div key={i} className="space-y-3">
                <Skeleton className="h-12 w-full rounded-xl" />
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-40 w-full rounded-xl" />
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
        {/* Header with Stats */}
        <KanbanHeader
          totalTasks={stats.total}
          doingTasks={stats.doing}
          doneTasks={stats.done}
          avgImpactScore={stats.avgImpact}
          onCreateTask={() => setIsCreateDialogOpen(true)}
        />

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map((column) => {
            // Filter out completed tasks from non-done columns
            const tasks = column.id === 'done' 
              ? (columns?.[column.id] || [])
              : (columns?.[column.id] || []).filter(t => t.kanban_status !== 'done');
            
            return (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                tasks={tasks}
                accentColor={column.accent}
                glowColor={column.glow}
                isDropTarget={dragOverColumn === column.id}
                draggedTaskId={draggedTask?.id}
                projectsMap={projectsMap}
                goalsMap={goalsMap}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
                onTaskDragStart={handleDragStart}
                onTaskDragEnd={handleDragEnd}
              />
            );
          })}
        </div>

        {/* Loading Indicator */}
        {moveTask.isPending && (
          <div className="fixed bottom-4 right-4 glass-strong rounded-xl p-3 shadow-xl flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm">Mise à jour...</span>
          </div>
        )}

        {/* Create Task Dialog */}
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
