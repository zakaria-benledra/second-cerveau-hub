import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePendingActions, useActionHistory, useApproveAction, useRejectAction, useRevertAction, useAuditLog, useProposeAction } from '@/hooks/useAgent';
import { Bot, Check, X, RotateCcw, Clock, CheckCircle, XCircle, AlertCircle, Sparkles, History } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AgentPage() {
  const { data: pendingActions = [], isLoading: loadingPending } = usePendingActions();
  const { data: actionHistory = [], isLoading: loadingHistory } = useActionHistory();
  const { data: auditLog = [], isLoading: loadingAudit } = useAuditLog();
  const approveAction = useApproveAction();
  const rejectAction = useRejectAction();
  const revertAction = useRevertAction();
  const proposeAction = useProposeAction();

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'create_task': return '📝';
      case 'complete_task': return '✅';
      case 'create_habit': return '🔁';
      case 'plan_day': return '📅';
      case 'weekly_review': return '📊';
      case 'inbox_process': return '📥';
      case 'goal_decompose': return '🎯';
      default: return '🤖';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'executed':
        return <Badge className="bg-green-500/10 text-green-500">Exécuté</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-500">Rejeté</Badge>;
      case 'reverted':
        return <Badge className="bg-yellow-500/10 text-yellow-500">Annulé</Badge>;
      case 'failed':
        return <Badge variant="destructive">Échoué</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Demo: Create a sample proposal
  const handleDemoProposal = () => {
    proposeAction.mutate({
      type: 'create_task',
      payload: {
        title: 'Réviser le rapport trimestriel',
        description: 'Basé sur votre calendrier et priorités actuelles',
        priority: 'high',
        dueDate: new Date().toISOString().split('T')[0],
        estimateMin: 45,
      },
      explanation: "J'ai analysé vos priorités et identifié cette tâche importante qui devrait être planifiée aujourd'hui.",
      confidenceScore: 0.85,
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Bot className="h-8 w-8" />
              Agent IA
            </h1>
            <p className="text-muted-foreground">Propositions intelligentes avec validation humaine</p>
          </div>
          <Button onClick={handleDemoProposal} disabled={proposeAction.isPending}>
            <Sparkles className="h-4 w-4 mr-2" />
            Générer une proposition
          </Button>
        </div>

        {/* Agent Status */}
        <Card className="glass border-primary/20">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Mode : Assisté</p>
              <p className="text-sm text-muted-foreground">
                L'agent propose des actions, vous validez avant exécution
              </p>
            </div>
            <Badge variant="outline" className="border-primary text-primary">
              {pendingActions.length} en attente
            </Badge>
          </CardContent>
        </Card>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="glass">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              En attente ({pendingActions.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Historique
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Audit Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {loadingPending ? (
              <div className="text-center py-8 text-muted-foreground">Chargement...</div>
            ) : pendingActions.length === 0 ? (
              <Card className="glass border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                  <p className="text-muted-foreground text-center">
                    Aucune action en attente.<br />
                    L'agent vous proposera des actions intelligentes.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingActions.map((action) => {
                  const payload = action.proposed_payload as Record<string, unknown>;
                  return (
                    <Card key={action.id} className="glass">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{getActionIcon(action.type)}</span>
                            <div>
                              <CardTitle className="text-lg">
                                {payload.title as string || action.type}
                              </CardTitle>
                              <CardDescription>
                                Proposé {formatDistanceToNow(new Date(action.created_at), { addSuffix: true, locale: fr })}
                              </CardDescription>
                            </div>
                          </div>
                          {action.confidence_score && (
                            <Badge variant="outline">
                              {Math.round(Number(action.confidence_score) * 100)}% confiance
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {action.explanation && (
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-sm">{action.explanation}</p>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => approveAction.mutate(action.id)}
                            disabled={approveAction.isPending}
                            className="flex-1"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Approuver
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => rejectAction.mutate(action.id)}
                            disabled={rejectAction.isPending}
                            className="flex-1"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Rejeter
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {loadingHistory ? (
              <div className="text-center py-8 text-muted-foreground">Chargement...</div>
            ) : actionHistory.length === 0 ? (
              <Card className="glass border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <History className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucun historique</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="glass">
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {actionHistory.map((action) => {
                      const payload = action.proposed_payload as Record<string, unknown>;
                      return (
                        <div key={action.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{getActionIcon(action.type)}</span>
                            <div>
                              <p className="font-medium">{payload.title as string || action.type}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(action.created_at), 'd MMM HH:mm', { locale: fr })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(action.status)}
                            {action.status === 'executed' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => revertAction.mutate(action.id)}
                                disabled={revertAction.isPending}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            {loadingAudit ? (
              <div className="text-center py-8 text-muted-foreground">Chargement...</div>
            ) : auditLog.length === 0 ? (
              <Card className="glass border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucune entrée d'audit</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="glass">
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {auditLog.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded bg-muted">
                            <AlertCircle className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">{entry.action}</p>
                            <p className="text-sm text-muted-foreground">
                              {entry.entity} • {entry.entity_id?.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(entry.created_at), 'd MMM HH:mm', { locale: fr })}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
