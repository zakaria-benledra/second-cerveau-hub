import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Flame, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface Habit {
  id: string;
  name: string;
  icon?: string;
  completed: boolean;
  streak?: number;
}

interface CriticalHabitsCardProps {
  habits: Habit[];
  onToggle: (id: string) => void;
  isToggling?: boolean;
}

export function CriticalHabitsCard({ habits, onToggle, isToggling }: CriticalHabitsCardProps) {
  // Show only top 3 critical habits
  const criticalHabits = habits.slice(0, 3);
  const completedCount = criticalHabits.filter(h => h.completed).length;
  const allCompleted = completedCount === criticalHabits.length && criticalHabits.length > 0;

  return (
    <Card className={cn(
      'glass-hover transition-all duration-300 group',
      allCompleted && 'border-success/30 bg-success/5'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              'p-1.5 rounded-lg',
              allCompleted ? 'bg-success/15' : 'bg-warning/15'
            )}>
              {allCompleted ? (
                <Sparkles className="h-4 w-4 text-success" />
              ) : (
                <Flame className="h-4 w-4 text-warning" />
              )}
            </div>
            <CardTitle className="text-base">Habitudes Critiques</CardTitle>
          </div>
          <Link 
            to="/history?metric=habits&range=7"
            className="flex items-center gap-1 group-hover:text-primary transition-colors"
          >
            <Badge 
              variant={allCompleted ? 'default' : 'outline'}
              className={cn(
                allCompleted && 'bg-success text-success-foreground'
              )}
            >
              {completedCount}/{criticalHabits.length}
            </Badge>
            <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-1">
        {criticalHabits.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Aucune habitude configurée
            </p>
            <Link 
              to="/habits" 
              className="text-xs text-primary hover:underline mt-1 inline-block"
            >
              Créer des habitudes →
            </Link>
          </div>
        ) : (
          <>
            {criticalHabits.map((habit) => (
              <div
                key={habit.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer group',
                  habit.completed 
                    ? 'bg-success/10 border border-success/20' 
                    : 'hover:bg-muted/50 border border-transparent hover:border-border/50'
                )}
                onClick={() => !isToggling && onToggle(habit.id)}
              >
                <Checkbox
                  checked={habit.completed}
                  disabled={isToggling}
                  className={cn(
                    'rounded-lg transition-all duration-200',
                    habit.completed && 'bg-success border-success'
                  )}
                />
                
                <span className="text-xl">{habit.icon || '✨'}</span>
                
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'font-medium truncate transition-all duration-200',
                    habit.completed && 'text-success line-through opacity-70'
                  )}>
                    {habit.name}
                  </p>
                </div>

                {habit.streak && habit.streak > 0 && (
                  <div className="flex items-center gap-1 text-warning">
                    <Flame className="h-3.5 w-3.5" />
                    <span className="text-xs font-bold">{habit.streak}</span>
                  </div>
                )}
              </div>
            ))}

            {/* View all link */}
            {habits.length > 3 && (
              <Link 
                to="/habits"
                className="flex items-center justify-center gap-1 p-2 text-xs text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted/50 mt-2"
              >
                Voir les {habits.length} habitudes
                <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
