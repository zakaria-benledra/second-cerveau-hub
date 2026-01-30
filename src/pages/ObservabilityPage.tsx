import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useJobRuns, useSystemHealth, useAuditLogStats } from '@/hooks/useAdmin';
import { useSystemEvents, useAutomationEvents } from '@/hooks/useObservability';
import { 
  Activity, 
  Server, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  XCircle,
  RefreshCw,
  TrendingUp,
  Zap,
  Eye,
  BarChart3,
  History
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function ObservabilityPage() {
  const [activeTab, setActiveTab] = useState('health');
  
  const { data: systemHealth = [], isLoading: healthLoading, refetch: refetchHealth } = useSystemHealth();
  const { data: jobRuns = [], isLoading: jobsLoading, refetch: refetchJobs } = useJobRuns(undefined, 20);
  const { data: systemEvents = [], isLoading: eventsLoading } = useSystemEvents(50);
  const { data: automationEvents = [] } = useAutomationEvents(20);
  const { data: auditStats } = useAuditLogStats();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'degraded':
      case 'running':
        return <Clock className="h-4 w-4 text-warning animate-pulse" />;
      case 'error':
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      healthy: 'bg-success/15 text-success',
      completed: 'bg-success/15 text-success',
      degraded: 'bg-warning/15 text-warning',
      running: 'bg-primary/15 text-primary',
      error: 'bg-destructive/15 text-destructive',
      failed: 'bg-destructive/15 text-destructive',
    };
    return variants[status] || 'bg-muted text-muted-foreground';
  };

  // Calculate summary stats
  const healthyServices = systemHealth.filter(s => s.status === 'healthy').length;
  const totalServices = systemHealth.length;
  const recentJobs = jobRuns.slice(0, 10);
  const failedJobs = recentJobs.filter(j => j.status === 'failed').length;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gradient">Observabilité</h1>
            <p className="text-muted-foreground">Monitoring système, jobs et événements</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => { refetchHealth(); refetchJobs(); }}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="glass-strong">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-success/15">
                  <Server className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{healthyServices}/{totalServices}</p>
                  <p className="text-xs text-muted-foreground">Services opérationnels</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/15">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{recentJobs.length - failedJobs}</p>
                  <p className="text-xs text-muted-foreground">Jobs réussis (récent)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2.5 rounded-xl",
                  failedJobs > 0 ? "bg-destructive/15" : "bg-muted"
                )}>
                  <AlertTriangle className={cn(
                    "h-5 w-5",
                    failedJobs > 0 ? "text-destructive" : "text-muted-foreground"
                  )} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{failedJobs}</p>
                  <p className="text-xs text-muted-foreground">Erreurs récentes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-accent/15">
                  <BarChart3 className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{auditStats?.total || 0}</p>
                  <p className="text-xs text-muted-foreground">Actions (7 jours)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="glass-strong">
            <TabsTrigger value="health" className="gap-2">
              <Server className="h-4 w-4" />
              Santé Système
            </TabsTrigger>
            <TabsTrigger value="jobs" className="gap-2">
              <Zap className="h-4 w-4" />
              Jobs
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2">
              <Eye className="h-4 w-4" />
              Événements
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <History className="h-4 w-4" />
              Audit
            </TabsTrigger>
          </TabsList>

          {/* System Health */}
          <TabsContent value="health" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  État des Services
                </CardTitle>
                <CardDescription>Statut en temps réel des services backend</CardDescription>
              </CardHeader>
              <CardContent>
                {healthLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Chargement...</div>
                ) : systemHealth.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Aucun service enregistré</div>
                ) : (
                  <div className="space-y-3">
                    {systemHealth.map((service) => (
                      <div 
                        key={service.service}
                        className="flex items-center justify-between p-4 rounded-xl bg-card/50 hover:bg-card/80 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(service.status)}
                          <div>
                            <p className="font-medium">{service.service}</p>
                            <p className="text-xs text-muted-foreground">{service.message}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={cn("border-0", getStatusBadge(service.status))}>
                            {service.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(service.last_check), { addSuffix: true, locale: fr })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Job Runs */}
          <TabsContent value="jobs" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Exécutions de Jobs
                </CardTitle>
                <CardDescription>Historique des tâches planifiées</CardDescription>
              </CardHeader>
              <CardContent>
                {jobsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Chargement...</div>
                ) : jobRuns.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Aucun job exécuté</div>
                ) : (
                  <div className="space-y-2">
                    {jobRuns.map((job) => (
                      <div 
                        key={job.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-card/50 hover:bg-card/80 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(job.status)}
                          <div>
                            <p className="font-medium">{job.job_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {job.records_processed || 0} traités • {job.records_failed || 0} erreurs
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-right">
                          <div>
                            <Badge className={cn("border-0", getStatusBadge(job.status))}>
                              {job.status}
                            </Badge>
                            {job.duration_ms && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {job.duration_ms}ms
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground w-20">
                            {job.started_at && formatDistanceToNow(new Date(job.started_at), { addSuffix: true, locale: fr })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Events */}
          <TabsContent value="events" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Événements Système
                </CardTitle>
                <CardDescription>Alertes et notifications automatiques</CardDescription>
              </CardHeader>
              <CardContent>
                {eventsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Chargement...</div>
                ) : systemEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun événement système récent
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {systemEvents.map((event) => (
                      <div 
                        key={event.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-card/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            event.event_type.includes('error') ? 'bg-destructive' :
                            event.event_type.includes('warning') ? 'bg-warning' : 'bg-primary'
                          )} />
                          <div>
                            <p className="font-medium text-sm">{event.event_type}</p>
                            <p className="text-xs text-muted-foreground">
                              {event.entity && `${event.entity}`}
                              {event.entity_id && ` • ${event.entity_id.slice(0, 8)}...`}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: fr })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Stats */}
          <TabsContent value="audit" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Actions par Type</CardTitle>
                </CardHeader>
                <CardContent>
                  {auditStats?.byAction ? (
                    <div className="space-y-2">
                      {Object.entries(auditStats.byAction).map(([action, count]) => (
                        <div key={action} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{action}</span>
                          <Badge variant="outline">{count as number}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Aucune donnée</p>
                  )}
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle>Actions par Entité</CardTitle>
                </CardHeader>
                <CardContent>
                  {auditStats?.byEntity ? (
                    <div className="space-y-2">
                      {Object.entries(auditStats.byEntity).map(([entity, count]) => (
                        <div key={entity} className="flex items-center justify-between">
                          <span className="text-sm">{entity}</span>
                          <Badge variant="outline">{count as number}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Aucune donnée</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
