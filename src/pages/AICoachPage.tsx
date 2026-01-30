import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAICoach } from '@/hooks/useAICoach';
import { useTodayScore } from '@/hooks/useScores';
import { useHabitsWithLogs } from '@/hooks/useHabits';
import { useTodayTasks } from '@/hooks/useTasks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Loader2,
  Target,
  RefreshCw,
  Zap,
  Moon,
  Sun,
  Calendar,
  ArrowRight,
  Minus,
  BarChart3,
  Clock,
  Flame
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Behavior analysis functions
function analyzeBehavior(score: any, habits: any[], tasks: any[]) {
  const insights: Array<{
    type: 'strength' | 'weakness' | 'trend' | 'recommendation';
    icon: typeof TrendingUp;
    title: string;
    description: string;
    severity: 'positive' | 'warning' | 'neutral';
  }> = [];

  // Analyze habits
  const activeHabits = habits?.filter(h => h.is_active) || [];
  const completedToday = activeHabits.filter(h => h.todayLog?.completed).length;
  const habitRate = activeHabits.length > 0 ? completedToday / activeHabits.length : 0;

  if (habitRate >= 0.8) {
    insights.push({
      type: 'strength',
      icon: Flame,
      title: 'Habitudes solides',
      description: `${Math.round(habitRate * 100)}% de vos habitudes complétées. Excellente discipline.`,
      severity: 'positive',
    });
  } else if (habitRate < 0.5 && activeHabits.length > 0) {
    insights.push({
      type: 'weakness',
      icon: AlertTriangle,
      title: 'Habitudes en souffrance',
      description: `Seulement ${Math.round(habitRate * 100)}% des habitudes faites. Risque de dérive.`,
      severity: 'warning',
    });
  }

  // Analyze tasks
  const todoTasks = tasks?.filter(t => t.status === 'todo') || [];
  const doneTasks = tasks?.filter(t => t.status === 'done') || [];
  const overdueTasks = todoTasks.filter(t => t.due_date && new Date(t.due_date) < new Date());

  if (overdueTasks.length > 0) {
    insights.push({
      type: 'weakness',
      icon: Clock,
      title: `${overdueTasks.length} tâche${overdueTasks.length > 1 ? 's' : ''} en retard`,
      description: 'Des engagements non tenus affectent votre score de discipline.',
      severity: 'warning',
    });
  }

  if (doneTasks.length >= 3) {
    insights.push({
      type: 'strength',
      icon: CheckCircle2,
      title: 'Bonne productivité',
      description: `${doneTasks.length} tâches accomplies aujourd'hui. Momentum positif.`,
      severity: 'positive',
    });
  }

  // Score trend
  if (score?.momentum_index > 0.05) {
    insights.push({
      type: 'trend',
      icon: TrendingUp,
      title: 'Tendance positive',
      description: 'Votre score s\'améliore régulièrement. Continuez ainsi.',
      severity: 'positive',
    });
  } else if (score?.momentum_index < -0.05) {
    insights.push({
      type: 'trend',
      icon: TrendingDown,
      title: 'Tendance négative',
      description: 'Votre score décline. Identifiez les blocages.',
      severity: 'warning',
    });
  }

  // Recommendations
  if (todoTasks.length > 5) {
    insights.push({
      type: 'recommendation',
      icon: Target,
      title: 'Réduire la charge',
      description: 'Plus de 5 tâches actives. Priorisez les 3 plus impactantes.',
      severity: 'neutral',
    });
  }

  return insights;
}

function generateDailySummary(score: any, habits: any[], tasks: any[]) {
  const activeHabits = habits?.filter(h => h.is_active) || [];
  const completedHabits = activeHabits.filter(h => h.todayLog?.completed).length;
  const doneTasks = tasks?.filter(t => t.status === 'done').length || 0;
  const globalScore = score?.global_score || 0;

  let identity = '';
  let emoji = '';

  if (globalScore >= 80) {
    identity = 'Un performer discipliné';
    emoji = '🏆';
  } else if (globalScore >= 60) {
    identity = 'Un exécutant régulier';
    emoji = '⚡';
  } else if (globalScore >= 40) {
    identity = 'Quelqu\'un en transition';
    emoji = '🌱';
  } else {
    identity = 'Quelqu\'un qui se cherche';
    emoji = '🔍';
  }

  return {
    identity,
    emoji,
    summary: `Aujourd'hui, vous avez été ${identity.toLowerCase()}. ${completedHabits}/${activeHabits.length} habitudes, ${doneTasks} tâches accomplies.`,
    score: globalScore,
  };
}

export default function AICoachPage() {
  const {
    briefing,
    briefingLoading,
    refetchBriefing,
    proposals,
    proposalsLoading,
    approveProposal,
    isApproving,
    rejectProposal,
    isRejecting,
  } = useAICoach();

  const { data: score } = useTodayScore();
  const { data: habits } = useHabitsWithLogs();
  const { data: tasks } = useTodayTasks();

  const [activeTab, setActiveTab] = useState('mirror');

  // Generate behavior analysis
  const behaviorInsights = useMemo(() => {
    return analyzeBehavior(score, habits || [], tasks || []);
  }, [score, habits, tasks]);

  const dailySummary = useMemo(() => {
    return generateDailySummary(score, habits || [], tasks || []);
  }, [score, habits, tasks]);

  const pendingProposals = proposals.filter(p => p.status === 'pending');

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gradient flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              AI Coach
            </h1>
            <p className="text-muted-foreground mt-1">
              Votre miroir comportemental quotidien
            </p>
          </div>
          <Button variant="outline" onClick={() => refetchBriefing()} className="glass-hover">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="glass-strong">
            <TabsTrigger value="mirror" className="gap-2">
              <Brain className="h-4 w-4" />
              Miroir
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="proposals" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Propositions
              {pendingProposals.length > 0 && (
                <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                  {pendingProposals.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* BEHAVIOR MIRROR TAB */}
          <TabsContent value="mirror" className="space-y-6 mt-6">
            {/* Daily Identity Card */}
            <Card className="glass-strong overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
              <CardContent className="relative p-8">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-accent text-5xl shadow-lg shadow-primary/20">
                    {dailySummary.emoji}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Aujourd'hui, vous avez été</p>
                    <h2 className="text-3xl font-bold text-gradient mb-2">
                      {dailySummary.identity}
                    </h2>
                    <p className="text-muted-foreground">
                      {dailySummary.summary}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-gradient">{dailySummary.score}</div>
                    <p className="text-xs text-muted-foreground">Score global</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Behavior Insights Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {behaviorInsights.map((insight, i) => {
                const Icon = insight.icon;
                return (
                  <Card 
                    key={i} 
                    className={cn(
                      'glass-hover transition-all',
                      insight.severity === 'positive' && 'border-success/30 bg-success/5',
                      insight.severity === 'warning' && 'border-warning/30 bg-warning/5'
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'p-2 rounded-xl',
                          insight.severity === 'positive' && 'bg-success/15',
                          insight.severity === 'warning' && 'bg-warning/15',
                          insight.severity === 'neutral' && 'bg-primary/15'
                        )}>
                          <Icon className={cn(
                            'h-5 w-5',
                            insight.severity === 'positive' && 'text-success',
                            insight.severity === 'warning' && 'text-warning',
                            insight.severity === 'neutral' && 'text-primary'
                          )} />
                        </div>
                        <div>
                          <h3 className="font-medium">{insight.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {insight.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {behaviorInsights.length === 0 && (
                <Card className="glass md:col-span-2">
                  <CardContent className="py-12 text-center">
                    <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      Commencez votre journée pour voir vos insights comportementaux
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Tomorrow Focus */}
            <Card className="glass-subtle border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sun className="h-5 w-5 text-warning" />
                  Demain, focalisez-vous sur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {behaviorInsights
                    .filter(i => i.severity === 'warning')
                    .slice(0, 2)
                    .map((insight, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-background/50">
                        <ArrowRight className="h-4 w-4 text-primary" />
                        <span className="text-sm">{insight.title}</span>
                      </div>
                    ))}
                  {behaviorInsights.filter(i => i.severity === 'warning').length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Continuez sur votre lancée ! Maintenez vos habitudes positives.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* INSIGHTS TAB */}
          <TabsContent value="insights" className="space-y-6 mt-6">
            {briefingLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : briefing ? (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="glass-hover">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-gradient">{briefing.summary.global_score}</div>
                      <p className="text-xs text-muted-foreground">Score Global</p>
                    </CardContent>
                  </Card>
                  <Card className="glass-hover">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold flex items-center justify-center gap-1">
                        {briefing.summary.momentum > 0 ? (
                          <TrendingUp className="h-6 w-6 text-success" />
                        ) : briefing.summary.momentum < 0 ? (
                          <TrendingDown className="h-6 w-6 text-destructive" />
                        ) : (
                          <Minus className="h-6 w-6 text-muted-foreground" />
                        )}
                        {Math.abs(briefing.summary.momentum)}%
                      </div>
                      <p className="text-xs text-muted-foreground">Momentum</p>
                    </CardContent>
                  </Card>
                  <Card className="glass-hover">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold">{briefing.tasks.total}</div>
                      <p className="text-xs text-muted-foreground">Tâches ({briefing.tasks.urgent} urgentes)</p>
                    </CardContent>
                  </Card>
                  <Card className="glass-hover">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold">{briefing.habits.pending}</div>
                      <p className="text-xs text-muted-foreground">Habitudes restantes</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Risks & Recommendations */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-warning" />
                        Risques détectés
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {briefing.risks.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">
                          Aucun risque détecté 🎉
                        </p>
                      ) : (
                        briefing.risks.map((risk: any, i: number) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-warning/10">
                            <Badge variant={risk.level === 'high' ? 'destructive' : 'secondary'}>
                              {risk.level}
                            </Badge>
                            <p className="text-sm">{risk.message}</p>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <Card className="glass">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Recommandations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {briefing.recommendations.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">
                          Tout va bien pour le moment
                        </p>
                      ) : (
                        briefing.recommendations.map((rec: any, i: number) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-primary/10">
                            <Badge variant="outline">{Math.round(rec.confidence * 100)}%</Badge>
                            <p className="text-sm">{rec.message}</p>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <Card className="glass">
                <CardContent className="py-12 text-center">
                  <Brain className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Cliquez sur Actualiser pour charger les insights</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* PROPOSALS TAB */}
          <TabsContent value="proposals" className="space-y-6 mt-6">
            {proposalsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : proposals.length === 0 ? (
              <Card className="glass">
                <CardContent className="py-12 text-center">
                  <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Aucune proposition IA en attente</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {proposals.map((proposal) => (
                  <Card key={proposal.id} className={cn(
                    'glass-hover',
                    proposal.status === 'pending' && 'border-primary/30'
                  )}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{proposal.title}</CardTitle>
                        <Badge variant={proposal.status === 'pending' ? 'default' : 'secondary'}>
                          {proposal.status === 'pending' ? 'En attente' : 
                           proposal.status === 'approved' ? 'Approuvée' : 'Rejetée'}
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
                            className="bg-success hover:bg-success/90"
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
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
