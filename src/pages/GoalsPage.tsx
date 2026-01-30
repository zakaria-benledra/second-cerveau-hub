import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from '@/hooks/useProjects';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/20',
  completed: 'bg-primary/10 text-primary border-primary/20',
  abandoned: 'bg-muted text-muted-foreground border-muted',
};

const statusLabels: Record<string, string> = {
  active: 'En cours',
  completed: 'Atteint',
  abandoned: 'Abandonné',
};

export default function GoalsPage() {
  const { data: goals, isLoading } = useGoals();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    target: '',
    unit: '',
    end_date: '',
  });

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

  const handleStatusChange = async (goalId: string, status: string) => {
    try {
      await updateGoal.mutateAsync({ id: goalId, updates: { status } });
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

  const calculateProgress = (goal: any) => {
    if (!goal.target) return 0;
    // This would normally be calculated from actual progress data
    return Math.floor(Math.random() * 100);
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Objectifs</h1>
            <p className="text-muted-foreground mt-1">
              Définissez et suivez vos objectifs à long terme
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient">
                <Plus className="h-4 w-4 mr-2" />
                Nouvel objectif
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvel objectif</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder="Titre de l'objectif"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                />
                <Input
                  placeholder="Description (optionnel)"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    placeholder="Cible"
                    value={newGoal.target}
                    onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
                  />
                  <Input
                    placeholder="Unité (ex: km, €, heures)"
                    value={newGoal.unit}
                    onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                  />
                </div>
                <Input
                  type="date"
                  value={newGoal.end_date}
                  onChange={(e) => setNewGoal({ ...newGoal, end_date: e.target.value })}
                />
                <Button onClick={handleCreateGoal} className="w-full">
                  Créer l'objectif
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="hover-lift">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{goals?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-lift">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeGoals.length}</p>
                  <p className="text-xs text-muted-foreground">En cours</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-lift">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <CheckCircle2 className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedGoals.length}</p>
                  <p className="text-xs text-muted-foreground">Atteints</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-lift">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Flag className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {goals?.length ? Math.round((completedGoals.length / goals.length) * 100) : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">Taux de réussite</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goals List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6 h-24" />
              </Card>
            ))}
          </div>
        ) : goals && goals.length > 0 ? (
          <div className="space-y-4">
            {goals.map((goal) => {
              const progress = calculateProgress(goal);
              return (
                <Card key={goal.id} className="hover-lift group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{goal.title}</h3>
                          <Badge variant="outline" className={statusColors[goal.status]}>
                            {statusLabels[goal.status] || goal.status}
                          </Badge>
                        </div>
                        
                        {goal.description && (
                          <p className="text-sm text-muted-foreground">{goal.description}</p>
                        )}

                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          {goal.target && goal.unit && (
                            <span className="flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              {goal.target} {goal.unit}
                            </span>
                          )}
                          {goal.end_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(goal.end_date), 'dd MMM yyyy', { locale: fr })}
                            </span>
                          )}
                        </div>

                        {goal.target && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Progression</span>
                              <span className="font-medium">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        )}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleStatusChange(goal.id, 'active')}>
                            <Circle className="h-4 w-4 mr-2 text-success" />
                            En cours
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(goal.id, 'completed')}>
                            <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
                            Atteint
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(goal.id)}
                            className="text-destructive"
                          >
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
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold text-lg mb-1">Aucun objectif</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Définissez vos objectifs pour garder le cap
              </p>
              <Button variant="gradient" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un objectif
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
