import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  ChevronRight, 
  Clock, 
  ArrowUpRight,
  Sparkles 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'done' | 'cancelled';
  estimateMin?: number;
  goalTitle?: string;
}

interface ImpactTasksCardProps {
  tasks: Task[];
  onComplete: (id: string) => void;
  isLoading?: boolean;
}

const priorityColors: Record<string, string> = {
  urgent: 'bg-destructive/15 text-destructive',
  high: 'bg-warning/15 text-warning',
  medium: 'bg-primary/15 text-primary',
  low: 'bg-muted text-muted-foreground',
};

const priorityDot: Record<string, string> = {
  urgent: 'bg-destructive',
  high: 'bg-warning',
  medium: 'bg-primary',
  low: 'bg-muted-foreground',
};

export function ImpactTasksCard({ tasks, onComplete, isLoading }: ImpactTasksCardProps) {
  // Show only top 3 impact tasks (incomplete)
  const impactTasks = tasks
    .filter(t => t.status !== 'done')
    .slice(0, 3);
  
  const completedToday = tasks.filter(t => t.status === 'done').length;
  const totalToday = tasks.length;

  return (
    <Card className="glass-hover group">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/15">
              <Target className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base">Tâches à Impact</CardTitle>
          </div>
          <Link 
            to="/history?metric=tasks&range=7"
            className="flex items-center gap-1 group-hover:text-primary transition-colors"
          >
            <Badge variant="outline" className="text-muted-foreground">
              {completedToday}/{totalToday}
            </Badge>
            <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-1">
        {impactTasks.length === 0 ? (
          <div className="text-center py-6">
            <Sparkles className="h-10 w-10 mx-auto text-success/50 mb-2" />
            <p className="text-sm font-medium text-success">
              Toutes les tâches terminées !
            </p>
            <Link 
              to="/tasks" 
              className="text-xs text-muted-foreground hover:text-primary mt-1 inline-block"
            >
              Planifier demain →
            </Link>
          </div>
        ) : (
          <>
            {impactTasks.map((task, index) => (
              <div
                key={task.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer group',
                  'hover:bg-muted/50 border border-transparent hover:border-border/50',
                  index === 0 && 'bg-primary/5 border-primary/20'
                )}
                onClick={() => !isLoading && onComplete(task.id)}
              >
                <Checkbox
                  checked={task.status === 'done'}
                  disabled={isLoading}
                  className="rounded-lg"
                />
                
                {/* Priority indicator */}
                <div className={cn(
                  'w-2 h-2 rounded-full flex-shrink-0',
                  priorityDot[task.priority]
                )} />
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm">
                    {task.title}
                  </p>
                  {task.goalTitle && (
                    <p className="text-xs text-muted-foreground truncate">
                      → {task.goalTitle}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {task.estimateMin && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                      <Clock className="h-2.5 w-2.5 mr-1" />
                      {task.estimateMin}m
                    </Badge>
                  )}
                  
                  {task.status === 'in_progress' && (
                    <Badge className="bg-info/15 text-info border-0 text-xs px-2 py-0.5">
                      En cours
                    </Badge>
                  )}

                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                </div>
              </div>
            ))}

            {/* View all */}
            <Link 
              to="/tasks"
              className="flex items-center justify-center gap-1 p-2 text-xs text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted/50 mt-2"
            >
              Voir toutes les tâches
              <ChevronRight className="h-3 w-3" />
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
