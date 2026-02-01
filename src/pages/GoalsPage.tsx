import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { SageCompanion } from '@/components/sage';
import { usePageSage } from '@/hooks/usePageSage';
import { useCelebration } from '@/hooks/useCelebration';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Target,
  MoreHorizontal, 
  Calendar,
  CheckCircle2,
  Circle,
  Trash2,
  TrendingUp,
  Flag,
  Link2,
  DollarSign,
  ListChecks,
  Sparkles,
  ChevronRight,
  Brain,
  History
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { usePlanLimits } from '@/hooks/useSubscription';
import { usePaywall } from '@/components/subscription/Paywall';

const statusColors: Record<string, string> = {
  active: 'bg-success/15 text-success border-success/30',
  completed: 'bg-primary/15 text-primary border-primary/30',
  abandoned: 'bg-muted text-muted-foreground border-muted',
};

const statusLabels: Record<string, string> = {
  active: 'En cours',
  completed: 'Atteint',
  abandoned: 'Abandonné',
};

export default function GoalsPage() {
  const { data: goals, isLoading } = useGoals();
  const { data: allTasks } = useTasks();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const { toast } = useToast();
  const { mood, data: sageData } = usePageSage('goals');
  const { celebrate } = useCelebration();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    target: '',
    unit: '',
    end_date: '',
  });

  const { canAddGoal } = usePlanLimits();
  const { showPaywall, PaywallComponent } = usePaywall();

  // Calculate linked items for each goal
  const goalStats = useMemo(() => {
    const stats: Record<string, { tasks: number; completed: number; progress: number }> = {};
    
    goals?.forEach(goal => {
      const linkedTasks = allTasks?.filter(t => t.goal_id === goal.id) || [];
      const completedTasks = linkedTasks.filter(t => t.status === 'done').length;
      
      stats[goal.id] = {
        tasks: linkedTasks.length,
        completed: completedTasks,
        progress: linkedTasks.length > 0 ? Math.round((completedTasks / linkedTasks.length) * 100) : 0,
      };
    });
    
    return stats;
  }, [goals, allTasks]);

  const handleOpenDialog = () => {
    const currentCount = activeGoals.length;
    if (!canAddGoal(currentCount)) {
      showPaywall({ limitType: 'goals' });
      return;
    }
    setDialogOpen(true);
  };

  const handleCreateGoal = async () => {
    if (!newGoal.title.trim()) return;

    try {
      await createGoal.mutateAsync({
        title: newGoal.title,
        description: newGoal.description || null,
        target: newGoal.target ? parseInt(newGoal.target) : null,
        unit: newGoal.unit || null,
        end_date: newGoal.end_date || null,
        start_date: new Date().toISOString().split('T')[0],
        status: 'active',
      });
      setNewGoal({ title: '', description: '', target: '', unit: '', end_date: '' });
      setDialogOpen(false);
      toast({ title: 'Objectif créé avec succès' });
    } catch (error) {
      toast({ title: 'Erreur lors de la création', variant: 'destructive' });
    }
  };

  const handleStatusChange = async (goalId: string, status: string, goalTitle?: string) => {
    try {
      await updateGoal.mutateAsync({ id: goalId, updates: { status } });
      if (status === 'completed' && goalTitle) {
        celebrate('goal_reached', goalTitle);
      }
      toast({ title: 'Statut mis à jour' });
    } catch (error) {
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  };

  const handleDelete = async (goalId: string) => {
    try {
      await deleteGoal.mutateAsync(goalId);
      toast({ title: 'Objectif supprimé' });
    } catch (error) {
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  };

  const activeGoals = goals?.filter(g => g.status === 'active') || [];
  const completedGoals = goals?.filter(g => g.status === 'completed') || [];
  const totalProgress = activeGoals.length > 0
    ? Math.round(activeGoals.reduce((sum, g) => sum + (goalStats[g.id]?.progress || 0), 0) / activeGoals.length)
    : 0;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <GlobalHeader
          variant="page"
          title="Tes objectifs"
          subtitle="Ce vers quoi tu tends"
          icon={<Target className="h-5 w-5 text-white" />}
        />

        {/* Sage Companion */}
        <SageCompanion
          context="goals"
          mood={mood}
          data={sageData}
          variant="card"
          className="mb-6"
        />

        <div className="flex justify-end">
          <Button className="gradient-primary text-primary-foreground shadow-lg" onClick={handleOpenDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel objectif
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="glass-strong">
              <DialogHeader>
                <DialogTitle>Créer un objectif central</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Titre *</Label>
                  <Input
                    placeholder="Ex: Courir un marathon"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    className="glass-hover"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Pourquoi cet objectif est important..."
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                    className="glass-hover"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cible</Label>
                    <Input
                      type="number"
                      placeholder="42"
                      value={newGoal.target}
                      onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
                      className="glass-hover"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unité</Label>
                    <Input
                      placeholder="km, €, heures..."
                      value={newGoal.unit}
                      onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                      className="glass-hover"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Échéance</Label>
                  <Input
                    type="date"
                    value={newGoal.end_date}
                    onChange={(e) => setNewGoal({ ...newGoal, end_date: e.target.value })}
                    className="glass-hover"
                  />
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateGoal} className="gradient-primary" disabled={createGoal.isPending}>
                  Créer l'objectif
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-hover hover-lift">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/15">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{goals?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-hover hover-lift">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-success/15">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{activeGoals.length}</p>
                  <p className="text-xs text-muted-foreground">Actifs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-hover hover-lift">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-accent/15">
                  <CheckCircle2 className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{completedGoals.length}</p>
                  <p className="text-xs text-muted-foreground">Atteints</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-hover hover-lift">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10">
                  <svg className="w-10 h-10 -rotate-90">
                    <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="4" fill="none" className="text-muted/30" />
                    <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray={`${totalProgress} 100`} strokeLinecap="round" className="text-primary" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{totalProgress}%</p>
                  <p className="text-xs text-muted-foreground">Progression</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goals as Central Nodes */}
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList className="glass-strong">
            <TabsTrigger value="active" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Actifs ({activeGoals.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Atteints ({completedGoals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6 h-32" />
                  </Card>
                ))}
              </div>
            ) : activeGoals.length === 0 ? (
              <Card className="glass border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Target className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold text-lg mb-1">Aucun objectif actif</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Les objectifs sont les nœuds centraux de votre système
                  </p>
                  <Button className="gradient-primary" onClick={() => setDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer un objectif
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {activeGoals.map((goal) => {
                  const stats = goalStats[goal.id] || { tasks: 0, completed: 0, progress: 0 };
                  
                  return (
                    <Card 
                      key={goal.id} 
                      className="glass-hover hover-lift group cursor-pointer"
                      onClick={() => setSelectedGoal(goal)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="p-1.5 rounded-lg bg-primary/15">
                                <Target className="h-4 w-4 text-primary" />
                              </div>
                              <h3 className="font-semibold line-clamp-1">{goal.title}</h3>
                            </div>
                            
                            {goal.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                {goal.description}
                              </p>
                            )}

                            {/* Linked Items */}
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <Badge variant="outline" className="text-xs gap-1">
                                <ListChecks className="h-3 w-3" />
                                {stats.tasks} tâches
                              </Badge>
                              {goal.target && goal.unit && (
                                <Badge variant="outline" className="text-xs gap-1">
                                  <Flag className="h-3 w-3" />
                                  {goal.target} {goal.unit}
                                </Badge>
                              )}
                              {goal.end_date && (
                                <Badge variant="outline" className="text-xs gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(goal.end_date), 'dd MMM', { locale: fr })}
                                </Badge>
                              )}
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Progression</span>
                                <span className="font-medium">{stats.progress}%</span>
                              </div>
                              <Progress value={stats.progress} className="h-2" />
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleStatusChange(goal.id, 'completed', goal.title)}>
                                <CheckCircle2 className="h-4 w-4 mr-2 text-success" />
                                Marquer atteint
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(goal.id)} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedGoals.length === 0 ? (
              <Card className="glass-subtle">
                <CardContent className="py-12 text-center">
                  <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Aucun objectif atteint pour le moment</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {completedGoals.map((goal) => (
                  <Card key={goal.id} className="glass-subtle bg-success/5 border-success/20">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-success/15">
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{goal.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            Atteint • {goal.target && `${goal.target} ${goal.unit || ''}`}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Goal Detail Sheet */}
        <Sheet open={!!selectedGoal} onOpenChange={() => setSelectedGoal(null)}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            {selectedGoal && (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    {selectedGoal.title}
                  </SheetTitle>
                  <SheetDescription>
                    Vue détaillée de l'objectif et ses éléments liés
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                  {/* Progress */}
                  <Card className="glass-strong">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Progression globale</span>
                        <span className="text-2xl font-bold">{goalStats[selectedGoal.id]?.progress || 0}%</span>
                      </div>
                      <Progress value={goalStats[selectedGoal.id]?.progress || 0} className="h-3" />
                    </CardContent>
                  </Card>

                  {/* Linked Tasks */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <ListChecks className="h-4 w-4" />
                      Tâches liées ({goalStats[selectedGoal.id]?.tasks || 0})
                    </h3>
                    <div className="space-y-2">
                      {allTasks?.filter(t => t.goal_id === selectedGoal.id).slice(0, 5).map(task => (
                        <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg glass-hover">
                          {task.status === 'done' ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className={cn('text-sm flex-1', task.status === 'done' && 'line-through text-muted-foreground')}>
                            {task.title}
                          </span>
                        </div>
                      ))}
                      <Link to="/tasks" className="flex items-center gap-1 text-xs text-primary hover:underline">
                        Voir toutes les tâches <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>

                  {/* AI Analysis placeholder */}
                  <Card className="glass-subtle border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Analyse IA</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Basé sur votre rythme actuel, vous atteindrez cet objectif dans environ 45 jours. 
                        Augmentez votre fréquence de tâches liées pour accélérer.
                      </p>
                    </CardContent>
                  </Card>

                  {/* History */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Historique
                    </h3>
                    <div className="relative pl-4 border-l-2 border-border space-y-3">
                      <div className="relative">
                        <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-primary border-2 border-background" />
                        <div className="text-sm">
                          <span className="font-medium">Objectif créé</span>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(selectedGoal.created_at), 'PPP', { locale: fr })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
      <PaywallComponent />
    </AppLayout>
  );
}
