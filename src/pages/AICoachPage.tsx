import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAICoach } from '@/hooks/useAICoach';
import { useTodayScore } from '@/hooks/useScores';
import { useHabitsWithLogs } from '@/hooks/useHabits';
import { useTodayTasks } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSound } from '@/hooks/useSound';
import {
  Brain,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Loader2,
  Target,
  RefreshCw,
  Sun,
  Moon,
  ArrowRight,
  Flame,
  Clock,
  Check,
  X,
  Zap,
  Play
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Behavior analysis functions
function analyzeBehavior(score: any, habits: any[], tasks: any[]) {
  const insights: Array<{
    type: 'strength' | 'weakness' | 'drift';
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
      title: 'Habitudes solides',
      description: `${Math.round(habitRate * 100)}% de vos habitudes complétées aujourd'hui.`,
      severity: 'positive',
    });
  } else if (habitRate < 0.5 && activeHabits.length > 0) {
    insights.push({
      type: 'drift',
      title: 'Habitudes en souffrance',
      description: `Seulement ${Math.round(habitRate * 100)}% des habitudes faites.`,
      severity: 'warning',
    });
  }

  // Analyze tasks
  const todoTasks = tasks?.filter(t => t.status === 'todo') || [];
  const doneTasks = tasks?.filter(t => t.status === 'done') || [];
  const overdueTasks = todoTasks.filter(t => t.due_date && new Date(t.due_date) < new Date());

  if (overdueTasks.length > 0) {
    insights.push({
      type: 'drift',
      title: `${overdueTasks.length} tâche${overdueTasks.length > 1 ? 's' : ''} en retard`,
      description: 'Des engagements non tenus affectent votre discipline.',
      severity: 'warning',
    });
  }

  if (doneTasks.length >= 3) {
    insights.push({
      type: 'strength',
      title: 'Bonne productivité',
      description: `${doneTasks.length} tâches accomplies aujourd'hui.`,
      severity: 'positive',
    });
  }

  // Score trend
  if (score?.momentum_index > 0.05) {
    insights.push({
      type: 'strength',
      title: 'Tendance positive',
      description: 'Votre score s\'améliore régulièrement.',
      severity: 'positive',
    });
  } else if (score?.momentum_index < -0.05) {
    insights.push({
      type: 'drift',
      title: 'Tendance négative',
      description: 'Votre score décline. Identifiez les blocages.',
      severity: 'warning',
    });
  }

  return insights;
}

function generateDailyIdentity(score: any, habits: any[], tasks: any[]) {
  const activeHabits = habits?.filter(h => h.is_active) || [];
  const completedHabits = activeHabits.filter(h => h.todayLog?.completed).length;
  const doneTasks = tasks?.filter(t => t.status === 'done').length || 0;
  const globalScore = score?.global_score || 0;

  let identity = '';
  let emoji = '';
  let description = '';

  if (globalScore >= 80) {
    identity = 'Un performer discipliné';
    emoji = '🏆';
    description = 'Excellente maîtrise de vos comportements.';
  } else if (globalScore >= 60) {
    identity = 'Un exécutant régulier';
    emoji = '⚡';
    description = 'Bonne dynamique, continuez ainsi.';
  } else if (globalScore >= 40) {
    identity = 'Quelqu\'un en transition';
    emoji = '🌱';
    description = 'Des progrès sont possibles avec plus de constance.';
  } else {
    identity = 'Quelqu\'un qui se cherche';
    emoji = '🔍';
    description = 'C\'est le moment de recentrer vos priorités.';
  }

  return {
    identity,
    emoji,
    description,
    stats: {
      habits: `${completedHabits}/${activeHabits.length}`,
      tasks: doneTasks,
      score: globalScore,
    },
  };
}

function generateTomorrowPlan(insights: ReturnType<typeof analyzeBehavior>) {
  const drifts = insights.filter(i => i.type === 'drift');
  const actions: string[] = [];

  if (drifts.length === 0) {
    actions.push('Maintenir vos habitudes positives');
    actions.push('Identifier une nouvelle habitude à adopter');
  } else {
    drifts.forEach(d => {
      if (d.title.includes('retard')) {
        actions.push('Terminer les tâches en retard dès le matin');
      }
      if (d.title.includes('Habitudes')) {
        actions.push('Commencer la journée par vos habitudes critiques');
      }
      if (d.title.includes('négative')) {
        actions.push('Réduire votre charge cognitive pour regagner du momentum');
      }
    });
  }

  return actions.slice(0, 3);
}

export default function AICoachPage() {
  const { refetchBriefing, proposals, approveProposal, isApproving, rejectProposal, isRejecting } = useAICoach();
  const { data: score } = useTodayScore();
  const { data: habits } = useHabitsWithLogs();
  const { data: tasks } = useTodayTasks();
  const { play } = useSound();

  const [planAccepted, setPlanAccepted] = useState(false);

  // Generate behavior analysis
  const behaviorInsights = useMemo(() => {
    return analyzeBehavior(score, habits || [], tasks || []);
  }, [score, habits, tasks]);

  const dailyIdentity = useMemo(() => {
    return generateDailyIdentity(score, habits || [], tasks || []);
  }, [score, habits, tasks]);

  const tomorrowActions = useMemo(() => {
    return generateTomorrowPlan(behaviorInsights);
  }, [behaviorInsights]);

  const strengths = behaviorInsights.filter(i => i.type === 'strength');
  const drifts = behaviorInsights.filter(i => i.type === 'drift' || i.type === 'weakness');

  const handleAcceptPlan = () => {
    setPlanAccepted(true);
    play('goal_progress');
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header - Minimal */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight text-gradient">
              Revue Quotidienne
            </h1>
          </div>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
          </p>
        </div>

        {/* SECTION 1: Who You Were Today */}
        <Card className="glass-strong overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
          <CardContent className="relative p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-accent text-6xl shadow-xl shadow-primary/20 mb-6">
                {dailyIdentity.emoji}
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">Aujourd'hui, vous avez été</p>
              <h2 className="text-3xl font-bold text-gradient mb-3">
                {dailyIdentity.identity}
              </h2>
              <p className="text-muted-foreground mb-6">
                {dailyIdentity.description}
              </p>

              {/* Stats Row */}
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">{dailyIdentity.stats.habits}</div>
                  <div className="text-xs text-muted-foreground">Habitudes</div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{dailyIdentity.stats.tasks}</div>
                  <div className="text-xs text-muted-foreground">Tâches</div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">{dailyIdentity.stats.score}</div>
                  <div className="text-xs text-muted-foreground">Score</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: Where You Drifted */}
        {drifts.length > 0 && (
          <Card className="glass border-warning/20 bg-warning/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Où vous avez dévié
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {drifts.map((drift, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-background/50">
                  <div className="p-1.5 rounded-lg bg-warning/15">
                    <TrendingDown className="h-4 w-4 text-warning" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{drift.title}</p>
                    <p className="text-xs text-muted-foreground">{drift.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Strengths - Collapsed if drifts exist */}
        {strengths.length > 0 && (
          <Card className="glass-subtle border-success/20 bg-success/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Flame className="h-5 w-5 text-success" />
                Ce qui a bien fonctionné
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {strengths.map((strength, i) => (
                  <Badge key={i} className="bg-success/15 text-success border-0 py-1.5 px-3">
                    <CheckCircle2 className="h-3 w-3 mr-1.5" />
                    {strength.title}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* SECTION 3: What to Fix Tomorrow */}
        <Card className="glass-strong border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sun className="h-5 w-5 text-warning" />
              Plan pour demain
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {tomorrowActions.map((action, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl transition-all",
                    planAccepted ? "bg-success/10 border border-success/20" : "bg-background/50"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                    planAccepted 
                      ? "bg-success text-success-foreground" 
                      : "bg-primary/15 text-primary"
                  )}>
                    {planAccepted ? <Check className="h-3 w-3" /> : i + 1}
                  </div>
                  <span className="text-sm flex-1">{action}</span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            {!planAccepted ? (
              <div className="flex gap-3 pt-2">
                <Button 
                  className="flex-1 gradient-primary"
                  onClick={handleAcceptPlan}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Accepter le plan
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => refetchBriefing()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Ajuster
                </Button>
              </div>
            ) : (
              <div className="text-center py-2">
                <Badge className="bg-success/15 text-success border-0 py-2 px-4">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Plan accepté pour demain
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Simulate Scenario - Collapsed */}
        <Card className="glass-subtle">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-accent/15">
                  <Zap className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium">Simuler un scénario</p>
                  <p className="text-xs text-muted-foreground">
                    Que se passerait-il si vous ajoutiez une habitude ?
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-accent">
                <Play className="h-4 w-4 mr-1" />
                Simuler
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Proposals if any */}
        {proposals.filter(p => p.status === 'pending').length > 0 && (
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                Propositions de l'IA
                <Badge className="ml-2">{proposals.filter(p => p.status === 'pending').length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {proposals.filter(p => p.status === 'pending').slice(0, 3).map((proposal) => (
                <div key={proposal.id} className="flex items-start gap-3 p-4 rounded-xl bg-background/50 border border-border/50">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{proposal.title}</p>
                    {proposal.description && (
                      <p className="text-xs text-muted-foreground mt-1">{proposal.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => rejectProposal({ proposalId: proposal.id })}
                      disabled={isRejecting}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      className="gradient-primary"
                      onClick={() => approveProposal(proposal.id)}
                      disabled={isApproving}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
