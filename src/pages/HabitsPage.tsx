import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useHabitsWithLogs, useCreateHabit, useToggleHabitLog, useDeleteHabit } from '@/hooks/useHabits';
import { ScoreRing } from '@/components/today/ScoreRing';
import { 
  Plus, 
  Flame, 
  Loader2, 
  Trash2, 
  Trophy, 
  Target, 
  Sparkles,
  Calendar,
  TrendingUp,
  ChevronRight,
  CheckCircle2,
  History,
  Clock
} from 'lucide-react';
import type { CreateHabitInput } from '@/lib/api/habits';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';

const emojiOptions = ['✨', '🧘', '📚', '💪', '🏃', '💧', '🍎', '😴', '✍️', '🎯', '🧠', '🌱', '🎨', '🎵', '💡'];

export default function HabitsPage() {
  const { data: habits, isLoading } = useHabitsWithLogs();
  const createHabit = useCreateHabit();
  const toggleHabit = useToggleHabitLog();
  const deleteHabit = useDeleteHabit();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newHabit, setNewHabit] = useState<CreateHabitInput>({
    name: '',
    icon: '✨',
    target_frequency: 'daily',
  });
  const [activeTab, setActiveTab] = useState('today');

  const handleCreateHabit = async () => {
    if (!newHabit.name.trim()) return;
    
    await createHabit.mutateAsync(newHabit);
    setNewHabit({ name: '', icon: '✨', target_frequency: 'daily' });
    setIsDialogOpen(false);
  };

  const activeHabits = habits?.filter(h => h.is_active) || [];
  const completedToday = activeHabits.filter(h => h.todayLog?.completed).length;
  const incompleteHabits = activeHabits.filter(h => !h.todayLog?.completed);
  const completedHabits = activeHabits.filter(h => h.todayLog?.completed);
  
  const completionRate = activeHabits.length > 0 
    ? Math.round((completedToday / activeHabits.length) * 100) 
    : 0;

  const totalStreak = activeHabits.reduce((sum, h) => sum + (h.streak?.current_streak || 0), 0);
  const maxStreak = activeHabits.reduce((max, h) => Math.max(max, h.streak?.max_streak || 0), 0);

  // Mock 7-day history data
  const weekHistory = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const completed = Math.floor(Math.random() * (activeHabits.length + 1));
      return {
        date,
        completed,
        total: activeHabits.length,
        rate: activeHabits.length > 0 ? (completed / activeHabits.length) * 100 : 0,
      };
    });
  }, [activeHabits.length]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Chargement des habitudes...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gradient">
              Habitudes & Routines
            </h1>
            <p className="text-muted-foreground mt-1">
              Construisez la discipline, une habitude à la fois
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle habitude
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong">
              <DialogHeader>
                <DialogTitle>Créer une habitude</DialogTitle>
                <DialogDescription>
                  Ajoutez une nouvelle habitude à suivre quotidiennement
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de l'habitude</Label>
                  <Input
                    id="name"
                    value={newHabit.name}
                    onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                    placeholder="Ex: Méditation matinale"
                    className="glass-hover"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Icône</Label>
                  <div className="flex flex-wrap gap-2">
                    {emojiOptions.map((emoji) => (
                      <Button
                        key={emoji}
                        variant={newHabit.icon === emoji ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => setNewHabit({ ...newHabit, icon: emoji })}
                        className={cn(
                          "text-xl transition-all",
                          newHabit.icon === emoji && 'gradient-primary glow'
                        )}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleCreateHabit} 
                  disabled={createHabit.isPending || !newHabit.name.trim()}
                  className="gradient-primary"
                >
                  {createHabit.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Créer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          {/* Main Score Ring */}
          <Card className="glass-strong md:row-span-2">
            <CardContent className="pt-6 flex flex-col items-center justify-center h-full">
              <ScoreRing
                value={completionRate}
                size="xl"
                label="Aujourd'hui"
                sublabel={`${completedToday}/${activeHabits.length} habitudes`}
              />
              
              <div className="flex items-center gap-1 mt-4">
                {completionRate >= 80 ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : completionRate >= 50 ? (
                  <TrendingUp className="h-4 w-4 text-warning" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-xs text-muted-foreground">
                  {completionRate >= 80 ? 'Excellent !' : completionRate >= 50 ? 'Bon rythme' : 'Continuez !'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Streak Stats */}
          <Card className="glass-hover hover-lift">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-warning/15">
                  <Flame className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-warning tabular-nums">{totalStreak}</p>
                  <p className="text-xs text-muted-foreground">Jours cumulés</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-hover hover-lift">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-accent/15">
                  <Trophy className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{maxStreak}</p>
                  <p className="text-xs text-muted-foreground">Meilleur streak</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-hover hover-lift">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/15">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{activeHabits.length}</p>
                  <p className="text-xs text-muted-foreground">Habitudes actives</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Week History Mini Chart */}
          <Card className="glass-hover md:col-span-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">7 derniers jours</span>
                <Link 
                  to="/scores" 
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  Historique complet <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="flex items-end justify-between gap-1 h-16">
                {weekHistory.map((day, i) => (
                  <div 
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div 
                      className={cn(
                        'w-full rounded-sm transition-all',
                        day.rate >= 80 ? 'bg-success' : day.rate >= 50 ? 'bg-warning' : 'bg-muted-foreground/30'
                      )}
                      style={{ height: `${Math.max(4, day.rate * 0.6)}px` }}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {format(day.date, 'E', { locale: fr })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Habits Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="glass-strong">
            <TabsTrigger value="today" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Aujourd'hui
              {incompleteHabits.length > 0 && (
                <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                  {incompleteHabits.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Complétées
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Historique
            </TabsTrigger>
          </TabsList>

          {/* Today's Checklist */}
          <TabsContent value="today" className="space-y-3 stagger-children">
            {incompleteHabits.length === 0 && completedHabits.length > 0 ? (
              <Card className="glass-strong border-success/30 bg-success/5">
                <CardContent className="py-8 text-center">
                  <Sparkles className="h-12 w-12 mx-auto text-success mb-3" />
                  <h3 className="text-lg font-semibold text-success mb-1">
                    Toutes les habitudes complétées !
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Excellent travail. Revenez demain pour continuer.
                  </p>
                </CardContent>
              </Card>
            ) : incompleteHabits.length === 0 ? (
              <Card className="glass">
                <CardContent className="py-12 text-center">
                  <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Aucune habitude créée
                  </p>
                  <Button className="gradient-primary" onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer ma première habitude
                  </Button>
                </CardContent>
              </Card>
            ) : (
              incompleteHabits.map((habit) => (
                <Card
                  key={habit.id}
                  className={cn(
                    "glass-hover cursor-pointer transition-all",
                    "hover:border-primary/30 hover:-translate-y-0.5"
                  )}
                  onClick={() => toggleHabit.mutate(habit.id)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={false}
                        disabled={toggleHabit.isPending}
                        className="h-6 w-6 rounded-lg"
                      />
                      <span className="text-2xl">{habit.icon || '✨'}</span>
                      <div className="flex-1">
                        <p className="font-medium">{habit.name}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {habit.target_frequency === 'daily' ? 'Quotidien' : 
                             habit.target_frequency === 'weekly' ? 'Hebdomadaire' : 'Mensuel'}
                          </Badge>
                          {habit.streak && habit.streak.current_streak > 0 && (
                            <Badge className="bg-warning/15 text-warning border-0 text-xs">
                              <Flame className="h-3 w-3 mr-1" />
                              {habit.streak.current_streak} jours
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteHabit.mutate(habit.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Completed Today */}
          <TabsContent value="completed" className="space-y-3 stagger-children">
            {completedHabits.length === 0 ? (
              <Card className="glass">
                <CardContent className="py-8 text-center">
                  <Clock className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">
                    Aucune habitude complétée aujourd'hui
                  </p>
                </CardContent>
              </Card>
            ) : (
              completedHabits.map((habit) => (
                <Card
                  key={habit.id}
                  className="glass-hover bg-success/5 border-success/20"
                >
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={true}
                        disabled={toggleHabit.isPending}
                        className="h-6 w-6 rounded-lg border-success bg-success"
                        onClick={() => toggleHabit.mutate(habit.id)}
                      />
                      <span className="text-2xl">{habit.icon || '✨'}</span>
                      <div className="flex-1">
                        <p className="font-medium text-success/80 line-through">
                          {habit.name}
                        </p>
                        {habit.streak && habit.streak.current_streak > 0 && (
                          <Badge className="bg-warning/15 text-warning border-0 text-xs mt-1">
                            <Flame className="h-3 w-3 mr-1" />
                            {habit.streak.current_streak} jours
                          </Badge>
                        )}
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg">Historique des habitudes</CardTitle>
                <CardDescription>
                  Les chiffres cliquables vous mènent à l'historique détaillé
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">
                    L'historique détaillé sera bientôt disponible
                  </p>
                  <Link 
                    to="/scores"
                    className="text-sm text-primary hover:underline"
                  >
                    Voir les scores →
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
