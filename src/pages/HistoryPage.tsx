import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScoreRing } from '@/components/today/ScoreRing';
import { 
  ArrowLeft, 
  Calendar, 
  TrendingUp, 
  Activity,
  Loader2,
  Target,
  Flame,
  CheckCircle2,
  Brain
} from 'lucide-react';
import { format, subDays, subWeeks, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type MetricType = 'discipline' | 'energy' | 'finance' | 'load' | 'habits' | 'tasks';

const metricLabels: Record<MetricType, string> = {
  discipline: 'Score Discipline',
  energy: 'Niveau Énergie',
  finance: 'Santé Financière',
  load: 'Charge Cognitive',
  habits: 'Habitudes Complétées',
  tasks: 'Tâches Accomplies',
};

const metricIcons: Record<MetricType, typeof TrendingUp> = {
  discipline: Target,
  energy: Activity,
  finance: TrendingUp,
  load: Brain,
  habits: Flame,
  tasks: CheckCircle2,
};

export default function HistoryPage() {
  const [searchParams] = useSearchParams();
  const metric = (searchParams.get('metric') as MetricType) || 'discipline';
  const [range, setRange] = useState<'7' | '30' | '90'>('7');

  // Calculate date range
  const dateRange = useMemo(() => {
    const end = new Date();
    let start: Date;
    switch (range) {
      case '7': start = subDays(end, 7); break;
      case '30': start = subMonths(end, 1); break;
      case '90': start = subMonths(end, 3); break;
      default: start = subDays(end, 7);
    }
    return { start, end };
  }, [range]);

  // Fetch daily stats for the range
  const { data: stats, isLoading } = useQuery({
    queryKey: ['history-stats', metric, range],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_stats')
        .select('*')
        .gte('date', format(dateRange.start, 'yyyy-MM-dd'))
        .lte('date', format(dateRange.end, 'yyyy-MM-dd'))
        .order('date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate averages and trends
  const summary = useMemo(() => {
    if (!stats || stats.length === 0) {
      return { average: 0, trend: 0, best: 0, worst: 100 };
    }

    const getValue = (stat: any): number => {
      switch (metric) {
        case 'habits':
          return stat.habits_total > 0 ? (stat.habits_completed / stat.habits_total) * 100 : 0;
        case 'tasks':
          return stat.tasks_planned > 0 ? (stat.tasks_completed / stat.tasks_planned) * 100 : 0;
        case 'discipline':
          return stat.clarity_score || 50;
        case 'load':
          return stat.overload_index || 50;
        default:
          return 50;
      }
    };

    const values = stats.map(getValue);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const best = Math.max(...values);
    const worst = Math.min(...values);
    
    // Trend: compare last third vs first third
    const third = Math.floor(values.length / 3);
    const firstThird = values.slice(0, third);
    const lastThird = values.slice(-third);
    const firstAvg = firstThird.reduce((a, b) => a + b, 0) / (firstThird.length || 1);
    const lastAvg = lastThird.reduce((a, b) => a + b, 0) / (lastThird.length || 1);
    const trend = lastAvg - firstAvg;

    return { average: Math.round(average), trend: Math.round(trend), best: Math.round(best), worst: Math.round(worst) };
  }, [stats, metric]);

  const Icon = metricIcons[metric];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/today">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gradient flex items-center gap-2">
              <Icon className="h-6 w-6 text-primary" />
              {metricLabels[metric]}
            </h1>
            <p className="text-muted-foreground">
              Historique et tendances
            </p>
          </div>
        </div>

        {/* Range Selector */}
        <Tabs value={range} onValueChange={(v) => setRange(v as '7' | '30' | '90')}>
          <TabsList className="glass-strong">
            <TabsTrigger value="7">7 jours</TabsTrigger>
            <TabsTrigger value="30">30 jours</TabsTrigger>
            <TabsTrigger value="90">90 jours</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="glass-strong">
                <CardContent className="pt-6 text-center">
                  <ScoreRing value={summary.average} size="lg" label="Moyenne" />
                </CardContent>
              </Card>
              
              <Card className="glass-hover">
                <CardContent className="pt-6 text-center">
                  <div className={cn(
                    "text-3xl font-bold",
                    summary.trend > 0 ? 'text-success' : summary.trend < 0 ? 'text-destructive' : 'text-muted-foreground'
                  )}>
                    {summary.trend > 0 ? '+' : ''}{summary.trend}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Tendance</p>
                </CardContent>
              </Card>

              <Card className="glass-hover">
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-success">{summary.best}%</div>
                  <p className="text-xs text-muted-foreground mt-1">Meilleur jour</p>
                </CardContent>
              </Card>

              <Card className="glass-hover">
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-destructive">{summary.worst}%</div>
                  <p className="text-xs text-muted-foreground mt-1">Jour le plus bas</p>
                </CardContent>
              </Card>
            </div>

            {/* Timeline Chart */}
            <Card className="glass-strong">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5" />
                  Évolution sur {range} jours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-1 h-48">
                  {stats?.map((stat, i) => {
                    let value: number;
                    switch (metric) {
                      case 'habits':
                        value = stat.habits_total > 0 ? (stat.habits_completed / stat.habits_total) * 100 : 0;
                        break;
                      case 'tasks':
                        value = stat.tasks_planned > 0 ? (stat.tasks_completed / stat.tasks_planned) * 100 : 0;
                        break;
                      case 'discipline':
                        value = stat.clarity_score || 50;
                        break;
                      case 'load':
                        value = stat.overload_index || 50;
                        break;
                      default:
                        value = 50;
                    }

                    return (
                      <div 
                        key={i}
                        className="flex-1 flex flex-col items-center gap-1 group"
                        title={`${format(new Date(stat.date), 'dd MMM', { locale: fr })}: ${Math.round(value)}%`}
                      >
                        <div 
                          className={cn(
                            'w-full rounded-t transition-all',
                            value >= 70 ? 'bg-success' : value >= 40 ? 'bg-warning' : 'bg-destructive/70',
                            'group-hover:opacity-80'
                          )}
                          style={{ height: `${Math.max(4, value * 1.8)}px` }}
                        />
                        {range === '7' && (
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(stat.date), 'E', { locale: fr })}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  
                  {(!stats || stats.length === 0) && (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                      Aucune donnée pour cette période
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Daily Details */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg">Détails journaliers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {stats?.slice().reverse().map((stat) => {
                    let value: number;
                    let detail: string;
                    switch (metric) {
                      case 'habits':
                        value = stat.habits_total > 0 ? (stat.habits_completed / stat.habits_total) * 100 : 0;
                        detail = `${stat.habits_completed}/${stat.habits_total} complétées`;
                        break;
                      case 'tasks':
                        value = stat.tasks_planned > 0 ? (stat.tasks_completed / stat.tasks_planned) * 100 : 0;
                        detail = `${stat.tasks_completed}/${stat.tasks_planned} accomplies`;
                        break;
                      case 'discipline':
                        value = stat.clarity_score || 50;
                        detail = `Score: ${Math.round(value)}`;
                        break;
                      case 'load':
                        value = stat.overload_index || 50;
                        detail = `Charge: ${Math.round(value)}%`;
                        break;
                      default:
                        value = 50;
                        detail = '';
                    }

                    return (
                      <div 
                        key={stat.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-card/50 hover:bg-card/80 transition-colors"
                      >
                        <span className="text-sm font-medium">
                          {format(new Date(stat.date), 'EEEE d MMMM', { locale: fr })}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">{detail}</span>
                          <Badge className={cn(
                            value >= 70 ? 'bg-success/15 text-success' : 
                            value >= 40 ? 'bg-warning/15 text-warning' : 
                            'bg-destructive/15 text-destructive',
                            'border-0'
                          )}>
                            {Math.round(value)}%
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
