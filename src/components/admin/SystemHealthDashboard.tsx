import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useSystemHealth, 
  useJobRuns, 
  useAuditLog,
  useUsageLedger,
} from '@/hooks/useObservability';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Clock,
  Database,
  Zap,
  BarChart3,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const statusIcons = {
  healthy: CheckCircle2,
  degraded: AlertTriangle,
  error: XCircle,
};

const statusColors = {
  healthy: 'text-success',
  degraded: 'text-warning',
  error: 'text-destructive',
};

export function SystemHealthDashboard() {
  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useSystemHealth();
  const { data: jobRuns, isLoading: jobsLoading } = useJobRuns(undefined, 10);
  const { data: auditLog, isLoading: auditLoading } = useAuditLog(undefined, 20);
  const { data: usageLedger, isLoading: usageLoading } = useUsageLedger(7);

  const overallStatus = health?.every(h => h.status === 'healthy') 
    ? 'healthy' 
    : health?.some(h => h.status === 'error') 
      ? 'error' 
      : 'degraded';

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Real-time status of all services</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={cn('capitalize', statusColors[overallStatus as keyof typeof statusColors])}
              >
                {overallStatus}
              </Badge>
              <Button variant="ghost" size="icon" onClick={() => refetchHealth()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {healthLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {health?.map((service) => {
                const StatusIcon = statusIcons[service.status as keyof typeof statusIcons] || AlertTriangle;
                return (
                  <div 
                    key={service.service}
                    className="p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <StatusIcon className={cn(
                        'h-4 w-4',
                        statusColors[service.status as keyof typeof statusColors]
                      )} />
                      <span className="font-medium capitalize">{service.service}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {service.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(service.last_check).toLocaleTimeString('fr-FR')}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="jobs" className="w-full">
        <TabsList>
          <TabsTrigger value="jobs" className="gap-2">
            <Clock className="h-4 w-4" />
            Jobs
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <Database className="h-4 w-4" />
            Audit Log
          </TabsTrigger>
          <TabsTrigger value="usage" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Usage
          </TabsTrigger>
        </TabsList>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Job Runs</CardTitle>
              <CardDescription>Background job execution history</CardDescription>
            </CardHeader>
            <CardContent>
              {jobsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : jobRuns?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No job runs recorded</p>
              ) : (
                <div className="space-y-3">
                  {jobRuns?.map((job) => (
                    <div 
                      key={job.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'p-1.5 rounded-full',
                          job.status === 'completed' ? 'bg-success/10 text-success' :
                          job.status === 'failed' ? 'bg-destructive/10 text-destructive' :
                          'bg-warning/10 text-warning'
                        )}>
                          {job.status === 'completed' ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : job.status === 'failed' ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{job.job_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {job.records_processed || 0} processed • {job.duration_ms || 0}ms
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {job.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {job.started_at && new Date(job.started_at).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Audit Trail</CardTitle>
              <CardDescription>Recent data mutations</CardDescription>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : auditLog?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No audit records</p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-auto">
                  {auditLog?.map((log: any) => (
                    <div 
                      key={log.id}
                      className="flex items-center justify-between p-2 rounded border text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          log.action === 'create' ? 'default' :
                          log.action === 'update' ? 'secondary' :
                          'destructive'
                        } className="text-xs capitalize">
                          {log.action}
                        </Badge>
                        <span className="text-muted-foreground">{log.entity}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString('fr-FR')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">AI Usage (Last 7 Days)</CardTitle>
              <CardDescription>Token consumption and costs</CardDescription>
            </CardHeader>
            <CardContent>
              {usageLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : usageLedger?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No usage data</p>
              ) : (
                <div className="space-y-4">
                  {usageLedger?.map((entry: any) => (
                    <div key={entry.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{new Date(entry.day).toLocaleDateString('fr-FR')}</span>
                        <span className="text-muted-foreground">
                          {entry.tokens_used?.toLocaleString() || 0} tokens
                        </span>
                      </div>
                      <Progress 
                        value={Math.min((entry.tokens_used || 0) / 10000 * 100, 100)} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
