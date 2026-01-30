import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useKanbanMetrics } from '@/hooks/useAIBehavior';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, Clock, CheckCircle, Activity, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const CHART_COLORS = {
  created: 'hsl(var(--info))',
  completed: 'hsl(var(--success))',
  moved: 'hsl(var(--warning))',
  productivity: 'hsl(var(--primary))'
};

export function KanbanMetricsPanel() {
  const [timeRange, setTimeRange] = useState<number>(30);
  const { data: metrics = [], isLoading } = useKanbanMetrics(timeRange);

  if (isLoading || metrics.length === 0) {
    return (
      <Card className="glass-strong">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Métriques Kanban
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground">
          {isLoading ? 'Chargement...' : 'Aucune donnée disponible'}
        </CardContent>
      </Card>
    );
  }

  // Calculate totals
  const totals = metrics.reduce((acc, m) => ({
    created: acc.created + (m.tasks_created || 0),
    completed: acc.completed + (m.tasks_completed || 0),
    moved: acc.moved + (m.tasks_moved || 0),
    avgProductivity: acc.avgProductivity + (m.productivity_score || 0)
  }), { created: 0, completed: 0, moved: 0, avgProductivity: 0 });

  totals.avgProductivity = Math.round(totals.avgProductivity / metrics.length);

  // Format data for charts
  const chartData = metrics.map(m => ({
    date: format(parseISO(m.date), 'd MMM', { locale: fr }),
    fullDate: m.date,
    created: m.tasks_created || 0,
    completed: m.tasks_completed || 0,
    moved: m.tasks_moved || 0,
    productivity: m.productivity_score || 0
  }));

  // Calculate completion rate
  const completionRate = totals.created > 0 
    ? Math.round((totals.completed / totals.created) * 100) 
    : 0;

  return (
    <Card className="glass-strong">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Métriques Kanban
        </CardTitle>
        <Select value={timeRange.toString()} onValueChange={(v) => setTimeRange(parseInt(v))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 jours</SelectItem>
            <SelectItem value="30">30 jours</SelectItem>
            <SelectItem value="90">90 jours</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-info/10">
            <div className="text-2xl font-bold text-info">{totals.created}</div>
            <div className="text-xs text-muted-foreground">Créées</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-success/10">
            <div className="text-2xl font-bold text-success">{totals.completed}</div>
            <div className="text-xs text-muted-foreground">Terminées</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-warning/10">
            <div className="text-2xl font-bold text-warning">{completionRate}%</div>
            <div className="text-xs text-muted-foreground">Taux</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-primary/10">
            <div className="text-2xl font-bold text-primary">{totals.avgProductivity}</div>
            <div className="text-xs text-muted-foreground">Score</div>
          </div>
        </div>

        {/* Charts */}
        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="activity">Activité</TabsTrigger>
            <TabsTrigger value="productivity">Productivité</TabsTrigger>
          </TabsList>
          
          <TabsContent value="activity" className="mt-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="created" name="Créées" fill={CHART_COLORS.created} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Terminées" fill={CHART_COLORS.completed} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="productivity" className="mt-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <defs>
                    <linearGradient id="productivityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="productivity" 
                    name="Score productivité"
                    stroke={CHART_COLORS.productivity}
                    fill="url(#productivityGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
