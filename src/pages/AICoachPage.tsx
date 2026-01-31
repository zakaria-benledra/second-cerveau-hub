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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
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
  Play,
  ListTodo
} from 'lucide-react';
import { format, addDays } from 'date-fns';
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

// Enhanced plan generation based on multiple data sources
interface PlanContext {
  insights: ReturnType<typeof analyzeBehavior>;
  score: any;
  habits: any[];
  tasks: any[];
  version: number; // For variation on "Ajuster"
}

function generateTomorrowPlan(ctx: PlanContext): string[] {
  const { insights, score, habits, tasks, version } = ctx;
  const drifts = insights.filter(i => i.type === 'drift');
  const strengths = insights.filter(i => i.type === 'strength');
  
  // All possible action categories with variants
  const actionPool: { category: string; variants: string[]; condition: () => boolean; priority: number }[] = [
    // HABITS
    {
      category: 'habits_struggling',
      variants: [
        'Commencer la journée par vos 2 habitudes les plus importantes',
        'Bloquer 15 min dès le réveil pour vos habitudes critiques',
        'Réduire temporairement à 3 habitudes max pour reprendre le rythme',
      ],
      condition: () => {
        const active = habits?.filter(h => h.is_active) || [];
        const completed = active.filter(h => h.todayLog?.completed).length;
        return active.length > 0 && completed / active.length < 0.5;
      },
      priority: 1,
    },
    {
      category: 'habits_strong',
      variants: [
        'Maintenir vos habitudes actuelles et célébrer la constance',
        'Ajouter une micro-habitude de 5 min à votre routine',
        'Tester une habitude "challenge" pour progresser',
      ],
      condition: () => {
        const active = habits?.filter(h => h.is_active) || [];
        const completed = active.filter(h => h.todayLog?.completed).length;
        return active.length > 0 && completed / active.length >= 0.8;
      },
      priority: 3,
    },
    // TASKS
    {
      category: 'tasks_overdue',
      variants: [
        'Traiter les tâches en retard en priorité absolue ce matin',
        'Bloquer 1h pour liquider le backlog de tâches',
        'Déléguer ou supprimer les tâches non essentielles en retard',
      ],
      condition: () => {
        const overdue = tasks?.filter(t => t.status === 'todo' && t.due_date && new Date(t.due_date) < new Date()) || [];
        return overdue.length > 0;
      },
      priority: 1,
    },
    {
      category: 'tasks_overloaded',
      variants: [
        'Limiter à 3 tâches prioritaires maximum demain',
        'Reporter les tâches basse priorité à la semaine prochaine',
        'Utiliser la règle du "1 chose importante" pour demain',
      ],
      condition: () => {
        const todo = tasks?.filter(t => t.status === 'todo') || [];
        return todo.length > 5;
      },
      priority: 2,
    },
    // JOURNAL & REFLECTION
    {
      category: 'journal_reflection',
      variants: [
        'Écrire 3 lignes dans votre journal ce soir (gratitude ou leçons)',
        'Prendre 5 min pour noter ce qui a bien/mal fonctionné aujourd\'hui',
        'Faire une mini-rétrospective écrite avant de dormir',
      ],
      condition: () => (score?.global_score || 0) < 60 || drifts.length > 0,
      priority: 2,
    },
    // CHALLENGES & GROWTH
    {
      category: 'challenge_start',
      variants: [
        'Lancer un défi de 7 jours sur une habitude difficile',
        'Se donner un objectif mesurable pour la semaine',
        'Créer un mini-défi personnel (ex: 0 écran après 21h)',
      ],
      condition: () => strengths.length >= 2 && (score?.global_score || 0) >= 50,
      priority: 3,
    },
    // MOMENTUM & ENERGY
    {
      category: 'momentum_recovery',
      variants: [
        'Réduire la charge cognitive : simplifier la journée',
        'Prioriser le repos pour reconstruire l\'énergie',
        'Faire une seule chose importante, pas plus',
      ],
      condition: () => (score?.momentum_index || 0) < -0.05 || (score?.burnout_index || 0) > 60,
      priority: 1,
    },
    {
      category: 'momentum_boost',
      variants: [
        'Capitaliser sur le momentum : ajouter un objectif ambitieux',
        'Profiter de la dynamique pour attaquer un projet reporté',
        'Transformer cette énergie en progrès visible',
      ],
      condition: () => (score?.momentum_index || 0) > 0.05 && (score?.global_score || 0) >= 60,
      priority: 3,
    },
    // FINANCE (if score available)
    {
      category: 'finance_alert',
      variants: [
        'Revoir vos dépenses de la semaine et identifier les excès',
        'Planifier un "jour sans dépense" demain',
        'Mettre à jour votre budget et ajuster vos objectifs',
      ],
      condition: () => (score?.finance_score || 100) < 50,
      priority: 2,
    },
    // DEFAULT GROWTH
    {
      category: 'growth_default',
      variants: [
        'Identifier une compétence à développer cette semaine',
        'Lire ou apprendre quelque chose de nouveau (15 min)',
        'Planifier une action qui vous rapproche de vos objectifs',
      ],
      condition: () => true, // Always available as fallback
      priority: 4,
    },
  ];

  // Filter applicable actions and sort by priority
  const applicable = actionPool
    .filter(a => a.condition())
    .sort((a, b) => a.priority - b.priority);

  // Select top 3 unique categories, with variant based on version
  const selected: string[] = [];
  const usedCategories = new Set<string>();

  for (const action of applicable) {
    if (usedCategories.has(action.category)) continue;
    if (selected.length >= 3) break;

    // Pick variant based on version for observable change
    const variantIndex = version % action.variants.length;
    selected.push(action.variants[variantIndex]);
    usedCategories.add(action.category);
  }

  // Ensure we always have 3 actions
  if (selected.length < 3) {
    const fallbacks = [
      'Prendre soin de vous : sommeil, alimentation, mouvement',
      'Définir 1 priorité claire pour demain',
      'Célébrer une petite victoire d\'aujourd\'hui',
    ];
    for (const fb of fallbacks) {
      if (selected.length >= 3) break;
      if (!selected.includes(fb)) selected.push(fb);
    }
  }

  return selected;
}

export default function AICoachPage() {
  const { refetchBriefing, proposals, approveProposal, isApproving, rejectProposal, isRejecting } = useAICoach();
  const { data: score } = useTodayScore();
  const { data: habits } = useHabitsWithLogs();
  const { data: tasks } = useTodayTasks();
  const { play } = useSound();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [planAccepted, setPlanAccepted] = useState(false);
  const [planVersion, setPlanVersion] = useState(0);
  const [isAdjustingPlan, setIsAdjustingPlan] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isCreatingTasks, setIsCreatingTasks] = useState(false);

  // Generate behavior analysis
  const behaviorInsights = useMemo(() => {
    return analyzeBehavior(score, habits || [], tasks || []);
  }, [score, habits, tasks]);

  const dailyIdentity = useMemo(() => {
    return generateDailyIdentity(score, habits || [], tasks || []);
  }, [score, habits, tasks]);

  const tomorrowActions = useMemo(() => {
    return generateTomorrowPlan({
      insights: behaviorInsights,
      score,
      habits: habits || [],
      tasks: tasks || [],
      version: planVersion,
    });
  }, [behaviorInsights, score, habits, tasks, planVersion]);

  const strengths = behaviorInsights.filter(i => i.type === 'strength');
  const drifts = behaviorInsights.filter(i => i.type === 'drift' || i.type === 'weakness');

  const handleAcceptPlan = async () => {
    setIsCreatingTasks(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Non connecté",
          description: "Veuillez vous connecter pour créer des tâches.",
          variant: "destructive",
        });
        return;
      }

      // Create Kanban tasks from the plan actions
      const tomorrow = addDays(new Date(), 1).toISOString().split('T')[0];
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-tasks`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tasks: tomorrowActions.map((action, index) => ({
              title: action,
              description: `Tâche générée par l'AI Coach - Plan du ${format(new Date(), 'd MMMM', { locale: fr })}`,
              priority: index === 0 ? 'high' : 'medium',
              due_date: tomorrow,
              status: 'todo',
              kanban_status: 'todo',
              source: 'ai',
            })),
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la création des tâches');
      }

      setPlanAccepted(true);
      play('goal_progress');
      
      // Invalidate queries to refresh task lists
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['kanban-tasks'] });

      toast({
        title: "Plan accepté !",
        description: `${tomorrowActions.length} tâches créées dans votre Kanban pour demain.`,
      });
    } catch (error) {
      console.error('Error creating tasks:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer les tâches. Réessayez.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingTasks(false);
    }
  };

  const handleAdjustPlan = async () => {
    setIsAdjustingPlan(true);
    setPlanAccepted(false);
    play('ai_insight');

    // Optional: ask backend for a refreshed briefing (throttled in hook)
    await refetchBriefing();

    // Force a new local plan variant (observable UI change)
    setPlanVersion((v) => v + 1);

    // Small delay to make adjustment feel intentional
    setTimeout(() => setIsAdjustingPlan(false), 500);
  };

  // Simulation scenario generation
  const simulationScenario = useMemo(() => {
    if (!showSimulation) return null;
    
    const currentScore = score?.global_score || 50;
    const activeHabits = habits?.filter(h => h.is_active).length || 0;
    
    // Simulate adding one habit
    const projectedScore = Math.min(100, currentScore + 5);
    const projectedConsistency = Math.min(100, (score?.consistency_factor || 0.5) * 100 + 8);
    
    return {
      scenario: "Ajout d'une habitude matinale",
      impact: [
        {
          metric: "Score Global",
          current: currentScore,
          projected: projectedScore,
          change: projectedScore - currentScore,
        },
        {
          metric: "Cohérence",
          current: Math.round((score?.consistency_factor || 0.5) * 100),
          projected: Math.round(projectedConsistency),
          change: Math.round(projectedConsistency - (score?.consistency_factor || 0.5) * 100),
        },
        {
          metric: "Habitudes actives",
          current: activeHabits,
          projected: activeHabits + 1,
          change: 1,
        },
      ],
      recommendation: projectedScore > 70 
        ? "Cette habitude vous rapprocherait du statut de Performeur Discipliné."
        : "Cette habitude améliorerait votre constance et renforcerait votre discipline.",
      risks: [
        "Risque de surcharge si non intégrée progressivement",
        "Nécessite 21 jours pour devenir automatique",
      ],
    };
  }, [showSimulation, score, habits]);

  const handleSimulate = () => {
    setIsSimulating(true);
    play('ai_insight');
    
    // Simulate loading
    setTimeout(() => {
      setShowSimulation(true);
      setIsSimulating(false);
    }, 800);
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
                  disabled={isCreatingTasks}
                >
                  {isCreatingTasks ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  {isCreatingTasks ? "Création..." : "Accepter le plan"}
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={handleAdjustPlan}
                  disabled={isAdjustingPlan || isCreatingTasks}
                >
                  {isAdjustingPlan ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Ajuster
                </Button>
              </div>
            ) : (
              <div className="text-center py-2 space-y-2">
                <Badge className="bg-success/15 text-success border-0 py-2 px-4">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Plan accepté pour demain
                </Badge>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <ListTodo className="h-3 w-3" />
                  {tomorrowActions.length} tâches ajoutées au Kanban
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Simulate Scenario */}
        <Card className={cn(
          "glass-subtle transition-all duration-300",
          showSimulation && "border-accent/30"
        )}>
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
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-accent"
                onClick={handleSimulate}
                disabled={isSimulating}
              >
                {isSimulating ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-1" />
                )}
                {showSimulation ? "Recalculer" : "Simuler"}
              </Button>
            </div>

            {/* Simulation Results */}
            {showSimulation && simulationScenario && (
              <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-accent/15 text-accent border-0">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Scénario : {simulationScenario.scenario}
                  </Badge>
                </div>

                {/* Impact Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  {simulationScenario.impact.map((item, i) => (
                    <div key={i} className="text-center p-3 rounded-xl bg-background/50 border border-border/50">
                      <div className="text-xs text-muted-foreground mb-1">{item.metric}</div>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-lg font-bold text-muted-foreground">{item.current}</span>
                        <ArrowRight className="h-3 w-3 text-accent" />
                        <span className="text-lg font-bold text-accent">{item.projected}</span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "mt-1 text-xs",
                          item.change > 0 ? "border-success/50 text-success" : "border-muted-foreground/50"
                        )}
                      >
                        {item.change > 0 ? '+' : ''}{item.change}
                      </Badge>
                    </div>
                  ))}
                </div>

                {/* Recommendation */}
                <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <p className="text-sm">{simulationScenario.recommendation}</p>
                  </div>
                </div>

                {/* Risks */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Points d'attention :</p>
                  {simulationScenario.risks.map((risk, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <AlertTriangle className="h-3 w-3 text-warning" />
                      {risk}
                    </div>
                  ))}
                </div>

                {/* Action */}
                <Button 
                  className="w-full"
                  variant="outline"
                  onClick={() => setShowSimulation(false)}
                >
                  Fermer la simulation
                </Button>
              </div>
            )}
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
