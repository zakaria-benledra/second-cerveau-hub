import { AppLayout } from '@/components/layout/AppLayout';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMetricRegistry, useUsageLedger, useTotalUsage, useAIMetrics, useSystemHealth, useAdminDashboardStats } from '@/hooks/useAdmin';
import { Settings, Activity, Database, Cpu, Users, CheckSquare, Repeat, Bot, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function SettingsPage() {
  const { data: metrics = [] } = useMetricRegistry();
  const { data: usage = [] } = useUsageLedger();
  const { data: totalUsage } = useTotalUsage();
  const { data: aiMetrics = [] } = useAIMetrics();
  const { data: systemHealth = [] } = useSystemHealth();
  const { data: adminStats } = useAdminDashboardStats();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const usageChartData = usage.slice(0, 14).reverse().map(u => ({
    date: format(new Date(u.day), 'd MMM', { locale: fr }),
    tokensIn: u.tokens_in,
    tokensOut: u.tokens_out,
  }));

  return (
    <AppLayout>
      <div className="space-y-6">
        <GlobalHeader
          variant="page"
          title="Paramètres"
          subtitle="Personnalise ton expérience"
          icon={<Settings className="h-5 w-5 text-white" />}
        />

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Utilisateurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{adminStats?.totalUsers || 0}</p>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Tâches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{adminStats?.totalTasks || 0}</p>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Repeat className="h-4 w-4" />
                Habitudes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{adminStats?.totalHabits || 0}</p>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Actions IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{adminStats?.totalAgentActions || 0}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="health" className="space-y-4">
          <TabsList className="glass">
            <TabsTrigger value="health" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Santé Système
            </TabsTrigger>
            <TabsTrigger value="usage" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Usage IA
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Registre Métriques
            </TabsTrigger>
          </TabsList>

          <TabsContent value="health" className="space-y-4">
            {systemHealth.length === 0 ? (
              <Card className="glass">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                  <p className="font-medium">Tous les systèmes opérationnels</p>
                  <p className="text-muted-foreground text-sm">Aucune alerte active</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {systemHealth.map((service) => (
                  <Card key={service.id} className="glass">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {getStatusIcon(service.status)}
                          {service.service}
                        </CardTitle>
                        <Badge variant={
                          service.status === 'healthy' ? 'default' :
                          service.status === 'degraded' ? 'outline' : 'destructive'
                        }>
                          {service.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {service.message && (
                        <p className="text-sm text-muted-foreground mb-2">{service.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Dernière vérification: {format(new Date(service.last_check), 'd MMM HH:mm', { locale: fr })}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Card className="glass">
              <CardHeader>
                <CardTitle>Statut des services</CardTitle>
                <CardDescription>Vue d'ensemble de l'infrastructure</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['Base de données', 'API', 'Agent IA', 'Scheduler'].map((service) => (
                    <div key={service} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span>{service}</span>
                      </div>
                      <Badge variant="outline" className="text-green-500">Opérationnel</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="glass">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Tokens Entrée</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {totalUsage?.totalTokensIn.toLocaleString() || 0}
                  </p>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Tokens Sortie</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {totalUsage?.totalTokensOut.toLocaleString() || 0}
                  </p>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Coût Estimé</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {totalUsage?.totalCost.toFixed(2) || '0.00'} €
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="glass">
              <CardHeader>
                <CardTitle>Usage des tokens (14 derniers jours)</CardTitle>
              </CardHeader>
              <CardContent>
                {usageChartData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={usageChartData}>
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))' 
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="tokensIn" 
                          stackId="1"
                          stroke="hsl(var(--primary))" 
                          fill="hsl(var(--primary) / 0.3)"
                          name="Entrée"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="tokensOut" 
                          stackId="1"
                          stroke="hsl(var(--accent))" 
                          fill="hsl(var(--accent) / 0.3)"
                          name="Sortie"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    Aucune donnée d'usage
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Registre des Métriques</CardTitle>
                <CardDescription>
                  Définitions canoniques des KPIs — Source unique de vérité
                </CardDescription>
              </CardHeader>
              <CardContent>
                {metrics.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune métrique enregistrée
                  </div>
                ) : (
                  <div className="space-y-4">
                    {metrics.map((metric) => (
                      <div key={metric.id} className="p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono bg-primary/10 px-2 py-1 rounded">
                              {metric.key}@v{metric.version}
                            </code>
                            <Badge variant={metric.status === 'active' ? 'default' : 'outline'}>
                              {metric.status}
                            </Badge>
                          </div>
                        </div>
                        {metric.description && (
                          <p className="text-sm text-muted-foreground mb-2">{metric.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Formule: <code className="bg-muted px-1 rounded">{metric.formula}</code></span>
                          <span>Sources: {metric.source_tables.join(', ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle>Formules BI Canoniques</CardTitle>
                <CardDescription>
                  Ces formules sont la référence pour tous les dashboards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 font-mono text-sm">
                  <div className="p-3 rounded bg-muted/50">
                    <span className="text-primary">completion_rate</span> = tasksCompleted / tasksPlanned
                  </div>
                  <div className="p-3 rounded bg-muted/50">
                    <span className="text-primary">overload_index</span> = SUM(estimateMin) / dailyCapacityMin
                  </div>
                  <div className="p-3 rounded bg-muted/50">
                    <span className="text-primary">habit_adherence</span> = completedLogs / expectedLogs
                  </div>
                  <div className="p-3 rounded bg-muted/50">
                    <span className="text-primary">clarity_score</span> = tasks_with(estimate + due) / total
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
