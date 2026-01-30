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
import { Plus, Clock, Loader2, Trash2 } from 'lucide-react';
import type { CreateTaskInput } from '@/lib/api/tasks';

const priorityColors: Record<string, string> = {
  urgent: 'border-destructive bg-destructive/10 text-destructive',
  high: 'border-orange-500 bg-orange-500/10 text-orange-700',
  medium: 'border-primary bg-primary/10 text-primary',
  low: 'border-muted-foreground bg-muted text-muted-foreground',
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
    <div className="flex items-start gap-3 p-3 border-2 hover:bg-accent transition-colors group">
      <Checkbox
        checked={task.status === 'done'}
        onCheckedChange={() => {
          if (task.status === 'done') {
            updateTask.mutate({ id: task.id, input: { status: 'todo' } });
          } else {
            completeTask.mutate(task.id);
          }
        }}
        className="mt-1 border-2"
      />
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
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
            <Badge variant="outline" className="border-2">
              <Clock className="h-3 w-3 mr-1" />
              {task.estimate_min} min
            </Badge>
          )}
          {task.due_date && (
            <Badge variant="outline" className="border-2">
              {new Date(task.due_date).toLocaleDateString('fr-FR')}
            </Badge>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => deleteTask.mutate(task.id)}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tâches</h1>
            <p className="text-muted-foreground">
              {tasks?.length || 0} tâches au total
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="border-2">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle tâche
              </Button>
            </DialogTrigger>
            <DialogContent className="border-2">
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
                    className="border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTask.description || ''}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Détails optionnels..."
                    className="border-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priorité</Label>
                    <Select
                      value={newTask.priority}
                      onValueChange={(v) => setNewTask({ ...newTask, priority: v as CreateTaskInput['priority'] })}
                    >
                      <SelectTrigger className="border-2">
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
                      className="border-2"
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
                    className="border-2"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-2">
                  Annuler
                </Button>
                <Button 
                  onClick={handleCreateTask} 
                  disabled={createTask.isPending || !newTask.title.trim()}
                  className="border-2"
                >
                  {createTask.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Créer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="todo" className="w-full">
          <TabsList className="border-2 w-full md:w-auto">
            <TabsTrigger value="todo" className="flex-1 md:flex-none">
              À faire ({todoTasks.length})
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="flex-1 md:flex-none">
              En cours ({inProgressTasks.length})
            </TabsTrigger>
            <TabsTrigger value="done" className="flex-1 md:flex-none">
              Terminé ({doneTasks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="todo" className="mt-4">
            <Card className="border-2">
              <CardHeader>
                <CardTitle>{statusLabels.todo}</CardTitle>
                <CardDescription>
                  Tâches en attente d'exécution
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {todoTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {todoTasks.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">
                    Aucune tâche à faire
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="in_progress" className="mt-4">
            <Card className="border-2">
              <CardHeader>
                <CardTitle>{statusLabels.in_progress}</CardTitle>
                <CardDescription>
                  Tâches actuellement en cours
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {inProgressTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {inProgressTasks.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">
                    Aucune tâche en cours
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="done" className="mt-4">
            <Card className="border-2">
              <CardHeader>
                <CardTitle>{statusLabels.done}</CardTitle>
                <CardDescription>
                  Tâches terminées
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {doneTasks.slice(0, 20).map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {doneTasks.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">
                    Aucune tâche terminée
                  </p>
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
