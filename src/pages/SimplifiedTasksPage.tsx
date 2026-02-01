import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { SageCompanion } from '@/components/sage';
import { usePageSage } from '@/hooks/usePageSage';
import { useTodayTasks, useCompleteTask, useCreateTask } from '@/hooks/useTasks';
import { useCelebration } from '@/hooks/useCelebration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Loader2,
  Plus,
  ListTodo,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SimplifiedTasksPage() {
  const navigate = useNavigate();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const { context, mood, data: sageData } = usePageSage('tasks');
  
  const { data: tasks, isLoading } = useTodayTasks();
  const completeTask = useCompleteTask();
  const createTask = useCreateTask();
  const { celebrate } = useCelebration();
  
  const actionRef = useRef<string | null>(null);

  const pendingTasks = tasks?.filter(t => t.status !== 'done') || [];
  const completedTasks = tasks?.filter(t => t.status === 'done') || [];

  const handleComplete = useCallback((id: string, title: string) => {
    if (actionRef.current === id) return;
    actionRef.current = id;
    
    completeTask.mutate(id, {
      onSuccess: () => {
        if (pendingTasks.length === 1) {
          celebrate('all_tasks_done');
        } else {
          celebrate('task_complete', title);
        }
        actionRef.current = null;
      },
      onError: () => {
        actionRef.current = null;
      }
    });
  }, [completeTask, pendingTasks, celebrate]);

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    createTask.mutate(
      { title: newTaskTitle.trim(), priority: 'medium' },
      {
        onSuccess: () => {
          setNewTaskTitle('');
        }
      }
    );
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive" className="text-xs">Urgent</Badge>;
      case 'high':
        return <Badge variant="secondary" className="text-xs">Prioritaire</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 pb-8">
        <GlobalHeader
          variant="page"
          title="Tes tâches"
          subtitle={`${pendingTasks.length} en cours`}
          icon={<ListTodo className="h-5 w-5 text-white" />}
        />

        <SageCompanion
          context={context}
          mood={mood}
          data={sageData}
          variant="inline"
          className="mb-4"
        />

        {/* Ajout rapide */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ajouter une tâche..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                className="flex-1"
              />
              <Button onClick={handleAddTask} disabled={createTask.isPending || !newTaskTitle.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tâches en cours */}
        {pendingTasks.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">À faire</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={false}
                    onCheckedChange={() => handleComplete(task.id, task.title)}
                    disabled={completeTask.isPending}
                    className="shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getPriorityBadge(task.priority)}
                      {task.due_date && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(task.due_date).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleComplete(task.id, task.title)}
                    disabled={completeTask.isPending}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Tâches terminées */}
        {completedTasks.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-muted-foreground">
                Terminées ({completedTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {completedTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-2 opacity-60"
                >
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  <span className="text-sm line-through text-muted-foreground truncate">
                    {task.title}
                  </span>
                </div>
              ))}
              {completedTasks.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  +{completedTasks.length - 5} autres
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* État vide */}
        {tasks?.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="font-medium mb-2">Pas de tâches</p>
              <p className="text-sm text-muted-foreground">
                Ajoute ta première tâche pour commencer.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Lien vers Kanban complet */}
        <div className="flex justify-center pt-4">
          <Button variant="ghost" className="text-muted-foreground" onClick={() => navigate('/kanban')}>
            Voir le Kanban complet →
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
