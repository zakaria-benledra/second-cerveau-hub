import { useState } from 'react';
import { useAICoach } from '@/hooks/useAICoach';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Brain,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Undo2,
  TrendingUp,
  Loader2,
  Zap,
  Target,
  Calendar,
  ListChecks,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AICoachPage() {
  const {
    briefing,
    briefingLoading,
    refetchBriefing,
    risks,
    risksLoading,
    refetchRisks,
    weeklyReview,
    weeklyReviewLoading,
    fetchWeeklyReview,
    proposals,
    proposalsLoading,
    actions,
    actionsLoading,
    generateProposal,
    isGeneratingProposal,
    approveProposal,
    isApproving,
    rejectProposal,
    isRejecting,
    undoAction,
    isUndoing,
    simulateEvent,
    isSimulating,
  } = useAICoach();

  const [activeTab, setActiveTab] = useState('briefing');

  const pendingProposals = proposals.filter(p => p.status === 'pending');
  const executedActions = actions.filter(a => a.status === 'executed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            AI Coach
          </h1>
          <p className="text-muted-foreground mt-1">
            Intelligence décisionnelle personnalisée
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetchBriefing()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="briefing">Briefing</TabsTrigger>
          <TabsTrigger value="risks">Risques</TabsTrigger>
          <TabsTrigger value="proposals">Propositions</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="playground">Playground</TabsTrigger>
        </TabsList>

        {/* BRIEFING TAB */}
        <TabsContent value="briefing" className="space-y-6">
          {briefingLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : briefing ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary">
                        {briefing.summary.global_score}
                      </div>
                      <div className="text-sm text-muted-foreground">Score Global</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-8 w-8 text-chart-1" />
                      <div>
                        <div className="text-2xl font-bold">{briefing.summary.momentum}%</div>
                        <div className="text-sm text-muted-foreground">Momentum</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <ListChecks className="h-8 w-8 text-chart-2" />
                      <div>
                        <div className="text-2xl font-bold">{briefing.tasks.total}</div>
                        <div className="text-sm text-muted-foreground">
                          Tâches ({briefing.tasks.urgent} urgentes)
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Target className="h-8 w-8 text-chart-3" />
                      <div>
                        <div className="text-2xl font-bold">{briefing.habits.pending}</div>
                        <div className="text-sm text-muted-foreground">Habitudes restantes</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Risks & Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-chart-4" />
                      Risques détectés
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {briefing.risks.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        Aucun risque détecté 🎉
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {briefing.risks.map((risk, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                            <Badge variant={risk.level === 'high' ? 'destructive' : 'secondary'}>
                              {risk.level}
                            </Badge>
                            <p className="text-sm">{risk.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Recommandations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {briefing.recommendations.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        Aucune recommandation pour le moment
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {briefing.recommendations.map((rec, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                            <Badge variant="outline">{Math.round(rec.confidence * 100)}%</Badge>
                            <p className="text-sm">{rec.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Calendar Events */}
              {briefing.events.total > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Événements du jour ({briefing.events.total})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {briefing.events.list.map((event: any) => (
                        <div key={event.id} className="flex items-center gap-3 p-2 rounded bg-muted/50">
                          <span className="text-sm font-medium">{event.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(event.start_time), 'HH:mm', { locale: fr })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Cliquez sur Actualiser pour charger le briefing</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* RISKS TAB */}
        <TabsContent value="risks" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => refetchRisks()} disabled={risksLoading}>
              {risksLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Analyser les risques
            </Button>
          </div>

          {risks ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold">{risks.summary.total_risks}</div>
                    <div className="text-sm text-muted-foreground">Risques totaux</div>
                  </CardContent>
                </Card>
                <Card className="border-destructive/50">
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-destructive">{risks.summary.critical}</div>
                    <div className="text-sm text-muted-foreground">Critiques</div>
                  </CardContent>
                </Card>
                <Card className="border-chart-4/50">
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-chart-4">{risks.summary.warnings}</div>
                    <div className="text-sm text-muted-foreground">Avertissements</div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                {risks.risks.map((risk) => (
                  <Card key={risk.id} className={risk.severity === 'critical' ? 'border-destructive' : ''}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{risk.title}</CardTitle>
                        <Badge variant={risk.severity === 'critical' ? 'destructive' : 'secondary'}>
                          {risk.severity}
                        </Badge>
                      </div>
                      <CardDescription>{risk.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        💡 {risk.recommendation}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Cliquez pour analyser les risques</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* PROPOSALS TAB */}
        <TabsContent value="proposals" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{pendingProposals.length} en attente</Badge>
            </div>
            <Button
              onClick={() => generateProposal({ type: 'general', context: { title: 'Analyse générale' } })}
              disabled={isGeneratingProposal}
            >
              {isGeneratingProposal ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Générer proposition
            </Button>
          </div>

          <div className="space-y-4">
            {proposalsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : proposals.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Aucune proposition IA</p>
                </CardContent>
              </Card>
            ) : (
              proposals.map((proposal) => (
                <Card key={proposal.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{proposal.title}</CardTitle>
                      <Badge
                        variant={
                          proposal.status === 'pending'
                            ? 'default'
                            : proposal.status === 'approved'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {proposal.status}
                      </Badge>
                    </div>
                    <CardDescription>{proposal.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {proposal.reasoning && (
                      <p className="text-sm text-muted-foreground mb-4">
                        <strong>Raisonnement:</strong> {proposal.reasoning}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="outline">
                        Confiance: {Math.round((proposal.confidence_score || 0) * 100)}%
                      </Badge>
                      <Badge variant="outline">{proposal.priority}</Badge>
                    </div>
                    {proposal.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => approveProposal(proposal.id)}
                          disabled={isApproving}
                          className="bg-chart-2 hover:bg-chart-2/90"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Approuver
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => rejectProposal({ proposalId: proposal.id })}
                          disabled={isRejecting}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Rejeter
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* ACTIONS TAB */}
        <TabsContent value="actions" className="space-y-6">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{executedActions.length} actions exécutées</Badge>
          </div>

          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {actionsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : actions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">Aucune action IA enregistrée</p>
                  </CardContent>
                </Card>
              ) : (
                actions.map((action) => (
                  <Card key={action.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{action.type}</CardTitle>
                        <Badge variant={action.status === 'executed' ? 'default' : 'secondary'}>
                          {action.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {action.explanation && (
                        <p className="text-sm text-muted-foreground mb-2">{action.explanation}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(action.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                        </span>
                        {action.status === 'executed' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => undoAction(action.id)}
                            disabled={isUndoing}
                          >
                            <Undo2 className="h-4 w-4 mr-1" />
                            Annuler
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* PLAYGROUND TAB */}
        <TabsContent value="playground" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-chart-4" />
                Simulateur d'événements
              </CardTitle>
              <CardDescription>
                Testez les automatisations en simulant des événements système
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-24 flex flex-col gap-2"
                  onClick={() => simulateEvent('habit.missed')}
                  disabled={isSimulating}
                >
                  <Target className="h-6 w-6 text-chart-3" />
                  <span className="text-xs">Habitude manquée</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col gap-2"
                  onClick={() => simulateEvent('budget.threshold_reached')}
                  disabled={isSimulating}
                >
                  <AlertTriangle className="h-6 w-6 text-chart-4" />
                  <span className="text-xs">Budget dépassé</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col gap-2"
                  onClick={() => simulateEvent('day.overloaded')}
                  disabled={isSimulating}
                >
                  <ListChecks className="h-6 w-6 text-destructive" />
                  <span className="text-xs">Jour surchargé</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col gap-2"
                  onClick={() => simulateEvent('burnout.risk_high')}
                  disabled={isSimulating}
                >
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                  <span className="text-xs">Risque Burnout</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Générateur de propositions</CardTitle>
              <CardDescription>
                Créez des propositions IA pour tester le cycle PROPOSE → APPROVE → EXECUTE
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  onClick={() => generateProposal({ type: 'reschedule_overload' })}
                  disabled={isGeneratingProposal}
                >
                  Réorganiser tâches
                </Button>
                <Button
                  variant="outline"
                  onClick={() => generateProposal({ type: 'habit_recovery' })}
                  disabled={isGeneratingProposal}
                >
                  Rattrapage habitudes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => generateProposal({ type: 'budget_alert' })}
                  disabled={isGeneratingProposal}
                >
                  Alerte budget
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revue hebdomadaire</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => fetchWeeklyReview()}
                disabled={weeklyReviewLoading}
                className="w-full"
              >
                {weeklyReviewLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <TrendingUp className="h-4 w-4 mr-2" />
                )}
                Générer revue hebdomadaire
              </Button>
              
              {weeklyReview && (
                <div className="mt-4 p-4 rounded-lg bg-muted">
                  <h4 className="font-medium mb-2">
                    Période: {weeklyReview.period.start} → {weeklyReview.period.end}
                  </h4>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{weeklyReview.scores.average_global}</div>
                      <div className="text-xs text-muted-foreground">Score moyen</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{weeklyReview.achievements.tasks_completed}</div>
                      <div className="text-xs text-muted-foreground">Tâches complétées</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{weeklyReview.achievements.habits_logged}</div>
                      <div className="text-xs text-muted-foreground">Habitudes logées</div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {weeklyReview.insights.map((insight, i) => (
                      <p key={i} className="text-sm">{insight}</p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
