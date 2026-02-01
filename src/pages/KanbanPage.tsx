import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { SageCompanion } from '@/components/sage';
import { usePageSage } from '@/hooks/usePageSage';
import { useCelebration } from '@/hooks/useCelebration';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useKanbanTasks, useMoveKanbanTask, type KanbanStatus, type KanbanTask } from '@/hooks/useKanban';
import { useCreateTask } from '@/hooks/useTasks';
import { useProjects, useGoals } from '@/hooks/useProjects';
import { useRecentUndos } from '@/hooks/useUndo';
import { useActiveInterventions } from '@/hooks/useAIInterventions';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { KanbanHeader } from '@/components/kanban/KanbanHeader';
import { KanbanColumn } from '@/components/kanban/KanbanColumn';
import { KanbanMetricsPanel } from '@/components/kanban/KanbanMetricsPanel';
import { KanbanSearchFilters, type SortOption, type PriorityFilter } from '@/components/kanban/KanbanSearchFilters';
import { type TimeRange, useTimeRangeDates } from '@/components/filters/GlobalTimeFilter';
import { Loader2, Undo2, LayoutGrid, BarChart3, Brain, ListTodo } from 'lucide-react';
import type { CreateTaskInput, UpdateTaskInput } from '@/lib/api/tasks';

const COLUMNS: { id: KanbanStatus; title: string; accent: string; glow: string }[] = [
  { id: 'backlog', title: 'Backlog', accent: 'border-muted/50', glow: 'shadow-muted/20' },
  { id: 'todo', title: 'À Faire', accent: 'border-info/30', glow: 'shadow-info/20' },
  { id: 'doing', title: 'En Cours', accent: 'border-warning/30', glow: 'shadow-warning/20' },
  { id: 'done', title: 'Terminé', accent: 'border-success/30', glow: 'shadow-success/20' },
];

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

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
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightedTaskId = searchParams.get('task') || undefined;
  
  const { data: columns, isLoading } = useKanbanTasks();
  const { data: projects = [] } = useProjects();
  const { data: goals = [] } = useGoals();
  const { data: todayInterventions } = useActiveInterventions();
  const moveTask = useMoveKanbanTask();
  const createTask = useCreateTask();
  const { recentActions, canUndo, undoLast, isUndoing } = useRecentUndos();
  const { context, mood, data: sageData } = usePageSage('tasks');
  const { celebrate } = useCelebration();
  
  // Flatten all tasks for counting
  const tasks = useMemo(() => {
    if (!columns) return [];
    return [...columns.backlog, ...columns.todo, ...columns.doing, ...columns.done];
  }, [columns]);
  
  // Clear the highlight param after 5 seconds
  useEffect(() => {
    if (highlightedTaskId) {
      const timer = setTimeout(() => {
        setSearchParams(params => {
          params.delete('task');
          return params;
        });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [highlightedTaskId, setSearchParams]);
  
  // Filter interventions related to Kanban reorganization
  const kanbanInterventions = useMemo(() => {
    return todayInterventions?.filter(i => 
      i.intervention_type === 'reduce_load' || 
      i.intervention_type === 'reorganize' ||
      i.intervention_type === 'prioritize'
    ) || [];
  }, [todayInterventions]);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  // BUG #2 FIX: Use refs to prevent state loss during re-renders
  const draggedTaskRef = useRef<KanbanTask | null>(null);
  const dragOverColumnRef = useRef<KanbanStatus | null>(null);
  // Keep state for UI updates
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<KanbanStatus | null>(null);
  const [activeTab, setActiveTab] = useState<'board' | 'metrics'>('board');
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const { startDate } = useTimeRangeDates(timeRange);

  // Create lookup maps for projects and goals
  const projectsMap = useMemo(() => {
    return projects.reduce((acc, p) => ({ ...acc, [p.id]: p.name }), {} as Record<string, string>);
  }, [projects]);

  const goalsMap = useMemo(() => {
    return goals.reduce((acc, g) => ({ ...acc, [g.id]: g.title }), {} as Record<string, string>);
  }, [goals]);

  // Filter and sort tasks
  const filterAndSortTasks = useCallback((tasks: KanbanTask[]) => {
    let filtered = tasks;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
      );
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(t => t.priority === priorityFilter);
    }

    // Time range filter (by created_at)
    filtered = filtered.filter(t => t.created_at >= startDate);

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'due_date':
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        case 'priority':
          return (PRIORITY_ORDER[a.priority] || 2) - (PRIORITY_ORDER[b.priority] || 2);
        case 'impact':
          return calculateImpactScore(b) - calculateImpactScore(a);
        case 'created':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return sorted;
  }, [searchQuery, priorityFilter, startDate, sortBy]);

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (priorityFilter !== 'all') count++;
    if (timeRange !== '30d') count++;
    if (sortBy !== 'priority') count++;
    return count;
  }, [searchQuery, priorityFilter, timeRange, sortBy]);

  const clearFilters = () => {
    setSearchQuery('');
    setPriorityFilter('all');
    setTimeRange('30d');
    setSortBy('priority');
  };

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

  // BUG #2 FIX: Use refs to maintain drag state across re-renders
  const handleDragStart = useCallback((e: React.DragEvent, task: KanbanTask) => {
    draggedTaskRef.current = task;
    setDraggedTaskId(task.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, columnId: KanbanStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    dragOverColumnRef.current = columnId;
    setDragOverColumn(columnId);
  }, []);

  const handleDragLeave = useCallback(() => {
    dragOverColumnRef.current = null;
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, newStatus: KanbanStatus) => {
    e.preventDefault();
    dragOverColumnRef.current = null;
    setDragOverColumn(null);
    
    // BUG #2 FIX: Use ref instead of state
    const task = draggedTaskRef.current;
    if (task && task.kanban_status !== newStatus) {
      moveTask.mutate({
        taskId: task.id,
        newStatus,
      }, {
        onSuccess: () => {
          if (newStatus === 'done') {
            celebrate('task_complete', task.title);
          }
        }
      });
    }
    draggedTaskRef.current = null;
    setDraggedTaskId(null);
  }, [moveTask, celebrate]);

  const handleDragEnd = useCallback(() => {
    draggedTaskRef.current = null;
    dragOverColumnRef.current = null;
    setDraggedTaskId(null);
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
        {/* Global Header */}
        <GlobalHeader
          variant="page"
          title="Tes tâches"
          subtitle={`${tasks?.filter(t => t.kanban_status !== 'done').length || 0} en cours`}
          icon={<ListTodo className="h-5 w-5 text-white" />}
        />

        {/* Sage Companion */}
        <SageCompanion
          context={context}
          mood={mood}
          data={sageData}
          variant="inline"
          className="mb-6"
        />

        {/* Header with Stats */}
        <KanbanHeader
          totalTasks={stats.total}
          doingTasks={stats.doing}
          doneTasks={stats.done}
          avgImpactScore={stats.avgImpact}
          onCreateTask={() => setIsCreateDialogOpen(true)}
        />

        {/* AI Intervention Alert */}
        {kanbanInterventions.length > 0 && (
          <Alert className="glass border-primary/30 bg-primary/5">
            <Brain className="h-4 w-4 text-primary" />
            <AlertTitle className="text-foreground">L'IA a Réorganisé Ton Kanban</AlertTitle>
            <AlertDescription>
              <div className="space-y-2 mt-2">
                {kanbanInterventions.map(intervention => (
                  <div key={intervention.id} className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs capitalize">
                      {intervention.intervention_type.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {intervention.reason || intervention.ai_message}
                    </span>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'board' | 'metrics')}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <TabsList className="glass">
              <TabsTrigger value="board" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                Board
              </TabsTrigger>
              <TabsTrigger value="metrics" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Métriques
              </TabsTrigger>
            </TabsList>

            {activeTab === 'board' && (
              <div className="flex-1 min-w-[300px]">
                <KanbanSearchFilters
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  timeRange={timeRange}
                  onTimeRangeChange={setTimeRange}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  priorityFilter={priorityFilter}
                  onPriorityChange={setPriorityFilter}
                  activeFiltersCount={activeFiltersCount}
                  onClearFilters={clearFilters}
                />
              </div>
            )}
          </div>

          <TabsContent value="board" className="mt-4">
            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {COLUMNS.map((column) => {
                const rawTasks = columns?.[column.id] || [];
                const tasks = filterAndSortTasks(rawTasks);
                
                return (
                  <KanbanColumn
                    key={column.id}
                    id={column.id}
                    title={column.title}
                    tasks={tasks}
                    accentColor={column.accent}
                    glowColor={column.glow}
                    isDropTarget={dragOverColumn === column.id}
                    draggedTaskId={draggedTaskId || undefined}
                    highlightedTaskId={highlightedTaskId}
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
          </TabsContent>

          <TabsContent value="metrics" className="mt-4">
            <KanbanMetricsPanel />
          </TabsContent>
        </Tabs>

        {/* Loading Indicator + Undo Button */}
        <div className="fixed bottom-4 right-4 flex items-center gap-2">
          {canUndo && (
            <Button
              variant="outline"
              size="sm"
              onClick={undoLast}
              disabled={isUndoing}
              className="glass-strong shadow-xl gap-2"
            >
              {isUndoing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Undo2 className="h-4 w-4" />
              )}
              Annuler
            </Button>
          )}
          {moveTask.isPending && (
            <div className="glass-strong rounded-xl p-3 shadow-xl flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm">Mise à jour...</span>
            </div>
          )}
        </div>

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
