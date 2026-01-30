import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  useAllTasks, 
  useCreateTask, 
  useCompleteTask, 
  useDeleteTask,
  useUpdateTask 
} from '@/hooks/useTasks';
import { Plus, Clock, Loader2, Trash2, CheckCircle2, Circle, PlayCircle, ListTodo } from 'lucide-react';
import type { CreateTaskInput } from '@/lib/api/tasks';
import { cn } from '@/lib/utils';

const priorityColors: Record<string, string> = {
  urgent: 'bg-destructive/10 text-destructive border-destructive/30',
  high: 'bg-warning/10 text-warning border-warning/30',
  medium: 'bg-primary/10 text-primary border-primary/30',
  low: 'bg-muted text-muted-foreground border-muted',
};

const statusLabels: Record<string, string> = {
  todo: 'À faire',
  in_progress: 'En cours',
  done: 'Terminé',
  cancelled: 'Annulé',
};

export default function TasksPage() {
  const { data: tasks, isLoading } = useAllTasks();
  const createTask = useCreateTask();
  const completeTask = useCompleteTask();
  const deleteTask = useDeleteTask();
  const updateTask = useUpdateTask();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState<CreateTaskInput>({
    title: '',
    description: '',
    priority: 'medium',
  });

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;
    
    await createTask.mutateAsync(newTask);
    setNewTask({ title: '', description: '', priority: 'medium' });
    setIsDialogOpen(false);
  };

  const todoTasks = tasks?.filter(t => t.status === 'todo') || [];
  const inProgressTasks = tasks?.filter(t => t.status === 'in_progress') || [];
  const doneTasks = tasks?.filter(t => t.status === 'done') || [];

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const TaskCard = ({ task }: { task: NonNullable<typeof tasks>[0] }) => (
    <div className="flex items-start gap-3 p-4 rounded-xl border hover:bg-muted/50 transition-all group hover-lift">
      <Checkbox
        checked={task.status === 'done'}
        onCheckedChange={() => {
          if (task.status === 'done') {
            updateTask.mutate({ id: task.id, input: { status: 'todo' } });
          } else {
            completeTask.mutate(task.id);
          }
        }}
        className="mt-1 rounded-md"
      />
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium",
          task.status === 'done' && 'line-through text-muted-foreground'
        )}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {task.description}
          </p>
        )}
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge className={priorityColors[task.priority]} variant="outline">
            {task.priority}
          </Badge>
          {task.estimate_min && (
            <Badge variant="muted">
              <Clock className="h-3 w-3 mr-1" />
              {task.estimate_min} min
            </Badge>
          )}
          {task.due_date && (
            <Badge variant="outline">
              {new Date(task.due_date).toLocaleDateString('fr-FR')}
            </Badge>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => deleteTask.mutate(task.id)}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tâches</h1>
            <p className="text-muted-foreground mt-1">
              {tasks?.length || 0} tâches au total
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle tâche
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une tâche</DialogTitle>
                <DialogDescription>
                  Ajoutez une nouvelle tâche à votre liste
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre</Label>
                  <Input
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Ex: Finir le rapport trimestriel"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTask.description || ''}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Détails optionnels..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priorité</Label>
                    <Select
                      value={newTask.priority}
                      onValueChange={(v) => setNewTask({ ...newTask, priority: v as CreateTaskInput['priority'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Basse</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="high">Haute</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimate">Estimation (min)</Label>
                    <Input
                      id="estimate"
                      type="number"
                      value={newTask.estimate_min || ''}
                      onChange={(e) => setNewTask({ ...newTask, estimate_min: parseInt(e.target.value) || undefined })}
                      placeholder="30"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Échéance</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newTask.due_date || ''}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value || undefined })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleCreateTask} 
                  disabled={createTask.isPending || !newTask.title.trim()}
                >
                  {createTask.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Créer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="hover-lift">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ListTodo className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todoTasks.length}</p>
                <p className="text-xs text-muted-foreground">À faire</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-lift">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <PlayCircle className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inProgressTasks.length}</p>
                <p className="text-xs text-muted-foreground">En cours</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-lift">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{doneTasks.length}</p>
                <p className="text-xs text-muted-foreground">Terminé</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="todo" className="w-full">
          <TabsList className="w-full md:w-auto grid grid-cols-3 md:inline-flex">
            <TabsTrigger value="todo" className="gap-2">
              <Circle className="h-3 w-3" />
              À faire ({todoTasks.length})
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="gap-2">
              <PlayCircle className="h-3 w-3" />
              En cours ({inProgressTasks.length})
            </TabsTrigger>
            <TabsTrigger value="done" className="gap-2">
              <CheckCircle2 className="h-3 w-3" />
              Terminé ({doneTasks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="todo" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{statusLabels.todo}</CardTitle>
                <CardDescription>
                  Tâches en attente d'exécution
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {todoTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {todoTasks.length === 0 && (
                  <div className="text-center py-12">
                    <ListTodo className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">Aucune tâche à faire</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="in_progress" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{statusLabels.in_progress}</CardTitle>
                <CardDescription>
                  Tâches actuellement en cours
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {inProgressTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {inProgressTasks.length === 0 && (
                  <div className="text-center py-12">
                    <PlayCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">Aucune tâche en cours</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="done" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{statusLabels.done}</CardTitle>
                <CardDescription>
                  Tâches terminées
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {doneTasks.slice(0, 20).map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {doneTasks.length === 0 && (
                  <div className="text-center py-12">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">Aucune tâche terminée</p>
                  </div>
                )}
                {doneTasks.length > 20 && (
                  <p className="text-center py-4 text-muted-foreground text-sm">
                    +{doneTasks.length - 20} autres tâches terminées
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
