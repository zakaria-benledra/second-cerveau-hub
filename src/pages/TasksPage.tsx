import { useState } from 'react';
import { format } from 'date-fns';
import {
  Plus,
  CheckCircle2,
  Clock,
  Zap,
  Filter,
  SortAsc,
  MoreHorizontal,
  Trash2,
  Edit2,
  Calendar,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';
import type { Priority, TaskStatus } from '@/types';

export default function TasksPage() {
  const { tasks, addTask, updateTask, completeTask, deleteTask } = useAppStore();
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as Priority,
    estimateMin: 30,
  });

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  const todoTasks = filteredTasks.filter((t) => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'in_progress');
  const doneTasks = filteredTasks.filter((t) => t.status === 'done');

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-destructive text-destructive-foreground';
      case 'high':
        return 'bg-foreground text-background';
      case 'medium':
        return 'bg-accent text-accent-foreground border border-border';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleAddTask = () => {
    if (!newTask.title.trim()) return;
    addTask({
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      status: 'todo',
      estimateMin: newTask.estimateMin,
      dueDate: new Date(),
    });
    setNewTask({ title: '', description: '', priority: 'medium', estimateMin: 30 });
    setIsAddOpen(false);
  };

  const TaskCard = ({ task }: { task: typeof tasks[0] }) => (
    <div
      className={cn(
        'group flex items-start gap-3 p-4 border-2 transition-all',
        task.status === 'done'
          ? 'border-muted bg-muted/30 opacity-60'
          : 'border-border hover:shadow-xs'
      )}
    >
      <button
        onClick={() => completeTask(task.id)}
        className={cn(
          'mt-1 h-5 w-5 border-2 flex-shrink-0 transition-colors flex items-center justify-center',
          task.status === 'done'
            ? 'bg-foreground border-foreground text-background'
            : 'border-foreground hover:bg-foreground hover:text-background'
        )}
      >
        {task.status === 'done' && <CheckCircle2 className="h-3 w-3" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'font-medium',
              task.status === 'done' && 'line-through'
            )}
          >
            {task.title}
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-2 shadow-sm">
              <DropdownMenuItem className="gap-2">
                <Edit2 className="h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 text-destructive"
                onClick={() => deleteTask(task.id)}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {task.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Badge className={cn('text-xs', getPriorityStyles(task.priority))}>
            {task.priority}
          </Badge>
          {task.estimateMin && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {task.estimateMin}m
            </span>
          )}
          {task.energyLevel && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Zap className="h-3 w-3" />
              {task.energyLevel}
            </span>
          )}
          {task.dueDate && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(task.dueDate), 'MMM d')}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground">
              {tasks.length} total · {tasks.filter((t) => t.status !== 'done').length} active
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <SelectTrigger className="w-32 border-2">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-2 shadow-sm">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 border-2 shadow-xs">
                  <Plus className="h-4 w-4" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent className="border-2 shadow-md">
                <DialogHeader>
                  <DialogTitle>Add New Task</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      placeholder="What needs to be done?"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      className="border-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Add details..."
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      className="border-2 min-h-20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select
                        value={newTask.priority}
                        onValueChange={(v) => setNewTask({ ...newTask, priority: v as Priority })}
                      >
                        <SelectTrigger className="border-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-2 shadow-sm">
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Estimate (min)</Label>
                      <Input
                        type="number"
                        value={newTask.estimateMin}
                        onChange={(e) =>
                          setNewTask({ ...newTask, estimateMin: parseInt(e.target.value) || 0 })
                        }
                        className="border-2"
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddTask} className="w-full border-2 shadow-xs">
                    Add Task
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Task Lists */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* To Do */}
          <Card className="border-2 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="h-2 w-2 bg-muted-foreground" />
                To Do
                <Badge variant="outline" className="ml-auto">
                  {todoTasks.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {todoTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
              {todoTasks.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No tasks to do
                </p>
              )}
            </CardContent>
          </Card>

          {/* In Progress */}
          <Card className="border-2 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="h-2 w-2 bg-foreground" />
                In Progress
                <Badge variant="outline" className="ml-auto">
                  {inProgressTasks.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {inProgressTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
              {inProgressTasks.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nothing in progress
                </p>
              )}
            </CardContent>
          </Card>

          {/* Done */}
          <Card className="border-2 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="h-2 w-2 bg-muted" />
                Done
                <Badge variant="outline" className="ml-auto">
                  {doneTasks.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {doneTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
              {doneTasks.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No completed tasks
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
