import { useQA } from '@/hooks/useQA';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, GitBranch, CheckCircle2, XCircle, AlertCircle, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BIBreadcrumb } from '@/components/bi/BIBreadcrumb';

export default function DecisionImpactPage() {
  const { auditLog, events, auditLogLoading, eventsLoading } = useQA();

  // Group audit logs by entity
  const logsByEntity = auditLog.reduce((acc, log) => {
    acc[log.entity] = (acc[log.entity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Group by action type
  const logsByAction = auditLog.reduce((acc, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Recent AI actions
  const aiActions = auditLog.filter(log => 
    log.entity === 'ai_proposals' || 
    log.entity === 'agent_actions'
  );

  // Event timeline (last 24h grouped by hour)
  const now = new Date();
  const last24h = events.filter(e => 
    new Date(e.created_at) > new Date(now.getTime() - 24 * 60 * 60 * 1000)
  );
  
  const hourlyEvents = Array.from({ length: 24 }, (_, i) => {
    const hour = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
    const hourStart = new Date(hour.setMinutes(0, 0, 0));
    const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
    
    const count = last24h.filter(e => {
      const eventTime = new Date(e.created_at);
      return eventTime >= hourStart && eventTime < hourEnd;
    }).length;
    
    return {
      hour: format(hourStart, 'HH:mm'),
      events: count,
    };
  });

  const isLoading = auditLogLoading || eventsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <BIBreadcrumb currentPage="Impact des Décisions" />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <GitBranch className="h-8 w-8 text-primary" />
          Impact des Décisions
          <Badge variant="secondary">BI</Badge>
        </h1>
        <p className="text-muted-foreground mt-1">
          Traçabilité et audit des actions
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{auditLog.length}</div>
              <div className="text-sm text-muted-foreground">Actions auditées</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-chart-2">{logsByAction.create || 0}</div>
              <div className="text-sm text-muted-foreground">Créations</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-chart-4">{logsByAction.update || 0}</div>
              <div className="text-sm text-muted-foreground">Modifications</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-destructive">{logsByAction.delete || 0}</div>
              <div className="text-sm text-muted-foreground">Suppressions</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activité (24h)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyEvents}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  interval={3}
                />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="events"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Actions by Entity */}
        <Card>
          <CardHeader>
            <CardTitle>Actions par entité</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(logsByEntity)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([entity, count]) => (
                  <div key={entity} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <span className="font-medium">{entity}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions IA récentes</CardTitle>
            <CardDescription>Propositions et exécutions</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {aiActions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune action IA enregistrée
                </div>
              ) : (
                <div className="space-y-3">
                  {aiActions.map(action => (
                    <div key={action.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      {action.action === 'create' && <CheckCircle2 className="h-4 w-4 text-chart-2" />}
                      {action.action === 'update' && <AlertCircle className="h-4 w-4 text-chart-4" />}
                      {action.action === 'delete' && <XCircle className="h-4 w-4 text-destructive" />}
                      <div className="flex-1">
                        <div className="font-medium text-sm">{action.action} {action.entity}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(action.created_at), 'dd/MM HH:mm', { locale: fr })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Recent Audit Log */}
      <Card>
        <CardHeader>
          <CardTitle>Journal d'audit complet</CardTitle>
          <CardDescription>Dernières 50 actions</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {auditLog.slice(0, 50).map(entry => (
                <div 
                  key={entry.id} 
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Badge
                    variant={
                      entry.action === 'create' ? 'default' :
                      entry.action === 'update' ? 'secondary' :
                      'destructive'
                    }
                    className="w-16 justify-center"
                  >
                    {entry.action}
                  </Badge>
                  <div className="flex-1">
                    <span className="font-medium">{entry.entity}</span>
                    {entry.entity_id && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {entry.entity_id.slice(0, 8)}...
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(entry.created_at), 'dd/MM HH:mm:ss', { locale: fr })}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
