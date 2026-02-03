import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useCompleteTask } from '@/hooks/useTasks';
import { useActiveProgram } from '@/hooks/useActiveProgram';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';
import { 
  Plus, Clock, Trash2, CheckCircle2, Circle, 
  List, Columns, CalendarDays, Target,
  MoreVertical, Pencil, ChevronDown, ChevronRight
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format, isToday, isTomorrow, isPast, parseISO, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Task, CreateTaskInput, UpdateTaskInput } from '@/lib/api/tasks';

const priorityColors: Record<string, string> = {
  urgent: 'bg-destructive/10 text-destructive border-destructive/30',
  high: 'bg-warning/10 text-warning border-warning/30',
  medium: 'bg-primary/10 text-primary border-primary/30',
  low: 'bg-muted text-muted-foreground border-muted',
};

const statusConfig = {
  todo: { label: 'À faire', color: 'bg-muted' },
  in_progress: { label: 'En cours', color: 'bg-warning' },
  done: { label: 'Terminé', color: 'bg-success' },
};

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState('list');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  
  const { data: tasks = [], isLoading } = useTasks();
  const { data: program } = useActiveProgram();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const completeTask = useCompleteTask();

  // Tâches groupées par statut pour Kanban
  const tasksByStatus = useMemo(() => {
    return {
      todo: tasks.filter((t) => t.status === 'todo'),
      in_progress: tasks.filter((t) => t.status === 'in_progress'),
      done: tasks.filter((t) => t.status === 'done'),
    };
  }, [tasks]);

  // Tâches du programme
  const programTasks = useMemo(() => {
    return tasks.filter((t) => (t as any).created_from_program);
  }, [tasks]);

  // Tâches pour la date sélectionnée
  const tasksForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return tasks.filter((t) => {
      if (!t.due_date) return false;
      return startOfDay(parseISO(t.due_date)).getTime() === startOfDay(selectedDate).getTime();
    });
  }, [tasks, selectedDate]);

  // Stats
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'done').length;
    const today = tasks.filter((t) => t.due_date && isToday(parseISO(t.due_date)) && t.status !== 'done').length;
    const overdue = tasks.filter((t) => t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date)) && t.status !== 'done').length;
    return { total, completed, today, overdue, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [tasks]);

  const handleComplete = (task: Task) => {
    if (task.status === 'done') {
      updateTask.mutate({ id: task.id, input: { status: 'todo' } });
    } else {
      completeTask.mutate(task.id);
    }
  };

  const handleDelete = (taskId: string) => {
    deleteTask.mutate(taskId);
  };

  const handleStatusChange = (task: Task, newStatus: string) => {
    updateTask.mutate({ id: task.id, input: { status: newStatus as Task['status'] } });
  };

  // Composant Tâche réutilisable
  const TaskItem = ({ task, showDate = true }: { task: Task; showDate?: boolean }) => {
    const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date)) && task.status !== 'done';
    const isFromProgram = !!(task as any).created_from_program;

    return (
      <div 
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors group cursor-pointer",
          task.status === 'done' && "opacity-60",
          isOverdue && "border-destructive/50 bg-destructive/5"
        )}
        onClick={() => setSelectedTask(task)}
      >
        <Checkbox
          checked={task.status === 'done'}
          onCheckedChange={() => handleComplete(task)}
          className="h-5 w-5"
          onClick={(e) => e.stopPropagation()}
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-medium truncate",
              task.status === 'done' && "line-through text-muted-foreground"
            )}>
              {task.title}
            </span>
            {isFromProgram && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                <Target className="h-2.5 w-2.5 mr-0.5" />
                Programme
              </Badge>
            )}
          </div>
          
          {showDate && task.due_date && (
            <p className={cn(
              "text-xs text-muted-foreground flex items-center gap-1 mt-0.5",
              isOverdue && "text-destructive"
            )}>
              <Clock className="h-3 w-3" />
              {isToday(parseISO(task.due_date)) ? "Aujourd'hui" : 
               isTomorrow(parseISO(task.due_date)) ? "Demain" :
               format(parseISO(task.due_date), 'dd MMM', { locale: fr })}
            </p>
          )}
        </div>

        <Badge variant="outline" className={cn("text-[10px]", priorityColors[task.priority])}>
          {task.priority}
        </Badge>

        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />


        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditingTask(task)}>
              <Pencil className="h-4 w-4 mr-2" /> Modifier
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange(task, task.status === 'in_progress' ? 'todo' : 'in_progress')}>
              <CheckCircle2 className="h-4 w-4 mr-2" /> 
              {task.status === 'in_progress' ? 'Remettre à faire' : 'En cours'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDelete(task.id)} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" /> Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  // Colonne Kanban
  const KanbanColumn = ({ status, title, columnTasks }: { 
    status: string; 
    title: string; 
    columnTasks: Task[] 
  }) => (
    <div className="flex-1 min-w-[280px]">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={cn(
          "h-2 w-2 rounded-full",
          statusConfig[status as keyof typeof statusConfig]?.color
        )} />
        <h3 className="font-medium text-sm">{title}</h3>
        <Badge variant="secondary" className="ml-auto">{columnTasks.length}</Badge>
      </div>

      <div className="space-y-2">
        {columnTasks.map((task) => (
          <TaskItem key={task.id} task={task} showDate={true} />
        ))}
        {columnTasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
            Aucune tâche
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header avec stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <GlobalHeader
            title="Mes Tâches"
            subtitle={`${stats.total} tâche${stats.total > 1 ? 's' : ''} • ${stats.completed} terminée${stats.completed > 1 ? 's' : ''}`}
            icon={<CheckCircle2 className="h-6 w-6 text-primary" />}
          />
          
          <div className="flex items-center gap-2">
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle tâche
            </Button>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-4">
            <div className="text-2xl font-bold text-primary">{stats.today}</div>
            <div className="text-sm text-muted-foreground">Aujourd'hui</div>
          </Card>
          <Card className={cn("p-4", stats.overdue > 0 && "border-destructive/50")}>
            <div className={cn("text-2xl font-bold", stats.overdue > 0 ? "text-destructive" : "text-muted-foreground")}>{stats.overdue}</div>
            <div className="text-sm text-muted-foreground">En retard</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-accent">{programTasks.length}</div>
            <div className="text-sm text-muted-foreground">Du programme</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-success">{stats.percentage}%</span>
              <Progress value={stats.percentage} className="flex-1 h-2" />
            </div>
            <div className="text-sm text-muted-foreground">Complétées</div>
          </Card>
        </div>

        {/* Mission du programme si active */}
        {program?.todayMission && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-primary font-medium">Mission du jour</p>
                  <p className="font-semibold">{program.todayMission.title}</p>
                </div>
                <Badge variant="outline" className="text-primary border-primary/30">
                  {program.programs?.icon} Jour {program.current_day}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Onglets : Liste / Kanban / Calendrier */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="list" className="gap-2">
              <List className="h-4 w-4" />
              Liste
            </TabsTrigger>
            <TabsTrigger value="kanban" className="gap-2">
              <Columns className="h-4 w-4" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Calendrier
            </TabsTrigger>
          </TabsList>

          {/* Vue Liste */}
          <TabsContent value="list" className="space-y-3">
            {tasks.length === 0 ? (
              <Card className="p-12">
                <div className="text-center space-y-4">
                  <Circle className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                  <h3 className="font-semibold">Aucune tâche</h3>
                  <p className="text-muted-foreground text-sm">Commence par en créer une !</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer ma première tâche
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-2">
                {tasks
                  .filter((t) => t.status !== 'done')
                  .sort((a, b) => {
                    const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                  })
                  .map((task) => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                
                {/* Tâches terminées (collapsées) */}
                {tasksByStatus.done.length > 0 && (
                  <Collapsible open={showCompleted} onOpenChange={setShowCompleted}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between text-muted-foreground">
                        <span>{tasksByStatus.done.length} tâche(s) terminée(s)</span>
                        <ChevronDown className={cn("h-4 w-4 transition-transform", showCompleted && "rotate-180")} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 pt-2">
                      {tasksByStatus.done.map((task) => (
                        <TaskItem key={task.id} task={task} />
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            )}
          </TabsContent>

          {/* Vue Kanban */}
          <TabsContent value="kanban">
            <div className="flex gap-4 overflow-x-auto pb-4">
              <KanbanColumn status="todo" title="À faire" columnTasks={tasksByStatus.todo} />
              <KanbanColumn status="in_progress" title="En cours" columnTasks={tasksByStatus.in_progress} />
              <KanbanColumn status="done" title="Terminé" columnTasks={tasksByStatus.done} />
            </div>
          </TabsContent>

          {/* Vue Calendrier */}
          <TabsContent value="calendar">
            <div className="grid md:grid-cols-[auto,1fr] gap-6">
              <Card className="p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={fr}
                  className="pointer-events-auto"
                  modifiers={{
                    hasTasks: tasks
                      .filter((t) => t.due_date)
                      .map((t) => parseISO(t.due_date!)),
                  }}
                  modifiersStyles={{
                    hasTasks: { fontWeight: 'bold', textDecoration: 'underline' },
                  }}
                />
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {selectedDate ? format(selectedDate, 'EEEE d MMMM', { locale: fr }) : 'Sélectionne une date'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tasksForSelectedDate.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">
                      Aucune tâche ce jour
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {tasksForSelectedDate.map((task) => (
                        <TaskItem key={task.id} task={task} showDate={false} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog création */}
      <TaskDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        mode="create"
        onSave={async (data) => {
          await createTask.mutateAsync(data as CreateTaskInput);
          setIsCreateDialogOpen(false);
        }}
        isPending={createTask.isPending}
      />

      {/* Dialog édition */}
      <TaskDialog
        open={!!editingTask}
        onOpenChange={(open) => {
          if (!open) setEditingTask(null);
        }}
        mode="edit"
        task={editingTask}
        onSave={async (data) => {
          if (editingTask) {
            await updateTask.mutateAsync({ id: editingTask.id, input: data as UpdateTaskInput });
            setEditingTask(null);
          }
        }}
        isPending={updateTask.isPending}
      />

      {/* Modal détail tâche */}
      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
        onComplete={() => {
          if (selectedTask) {
            completeTask.mutate(selectedTask.id, {
              onSuccess: () => setSelectedTask(null)
            });
          }
        }}
        isCompleting={completeTask.isPending}
      />
    </AppLayout>
  );
}
