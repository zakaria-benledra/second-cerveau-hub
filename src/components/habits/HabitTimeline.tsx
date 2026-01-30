import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useHabitHistory, useHabitsKPIs } from '@/hooks/useHabitsKPI';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Flame, TrendingUp, Award, Target } from 'lucide-react';

interface HabitTimelineProps {
  days?: number;
}

export function HabitTimeline({ days = 7 }: HabitTimelineProps) {
  const { data: history, isLoading: historyLoading } = useHabitHistory(days);
  const { data: kpis, isLoading: kpisLoading } = useHabitsKPIs();

  if (historyLoading || kpisLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  // Calculate weekly stats
  const avgRate = history && history.length > 0
    ? Math.round(history.reduce((sum, d) => sum + d.rate, 0) / history.length)
    : 0;

  const bestDay = history?.reduce((best, day) => 
    day.rate > best.rate ? day : best, 
    { date: new Date(), rate: 0 }
  );

  const perfectDays = history?.filter(d => d.rate === 100).length || 0;

  return (
    <div className="space-y-4">
      {/* Timeline Chart */}
      <Card className="glass-strong">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Derniers {days} jours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-1 h-24 mb-4">
            {history?.map((day, i) => (
              <div 
                key={i}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div 
                  className={cn(
                    'w-full rounded-sm transition-all',
                    day.rate >= 100 ? 'bg-success' : 
                    day.rate >= 75 ? 'bg-primary' :
                    day.rate >= 50 ? 'bg-warning' : 
                    day.rate > 0 ? 'bg-muted-foreground/50' :
                    'bg-muted-foreground/20'
                  )}
                  style={{ height: `${Math.max(8, day.rate)}%` }}
                  title={`${day.completed}/${day.total} (${Math.round(day.rate)}%)`}
                />
                <span className="text-[10px] text-muted-foreground">
                  {format(day.date, 'E', { locale: fr })}
                </span>
              </div>
            ))}
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-between text-sm border-t pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary tabular-nums">{avgRate}%</p>
              <p className="text-xs text-muted-foreground">Moyenne</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold tabular-nums">{perfectDays}</p>
              <p className="text-xs text-muted-foreground">Jours parfaits</p>
            </div>
            {bestDay && bestDay.rate > 0 && (
              <div className="text-center">
                <p className="text-sm font-medium text-success">
                  {format(bestDay.date, 'EEEE', { locale: fr })}
                </p>
                <p className="text-xs text-muted-foreground">Meilleur jour</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Per-Habit KPIs */}
      {kpis && kpis.length > 0 && (
        <Card className="glass">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-accent" />
              Performance par habitude
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {kpis.map((kpi) => (
              <div 
                key={kpi.habitId}
                className="flex items-center gap-3 p-3 rounded-lg glass-hover"
              >
                <span className="text-xl">{kpi.habitIcon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{kpi.habitName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {kpi.currentStreak > 0 && (
                      <Badge variant="outline" className="bg-warning/15 text-warning border-0 text-xs">
                        <Flame className="h-3 w-3 mr-1" />
                        {kpi.currentStreak}j
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {kpi.completedThisWeek}/7 cette semaine
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-lg font-bold tabular-nums",
                    kpi.consistency7d >= 80 ? "text-success" :
                    kpi.consistency7d >= 50 ? "text-primary" : 
                    "text-muted-foreground"
                  )}>
                    {kpi.consistency7d}%
                  </p>
                  <p className="text-xs text-muted-foreground">7j</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
