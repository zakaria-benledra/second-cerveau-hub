import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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
import { useRoutines, useTodayRoutineLogs, useLogRoutineCompletion } from '@/hooks/useRoutines';
import { ScoreRing } from '@/components/today/ScoreRing';
import { 
  Plus, 
  Flame, 
  Loader2, 
  Trash2, 
  Trophy, 
  Target, 
  Sparkles,
  TrendingUp,
  ChevronRight,
  CheckCircle2,
  History,
  Clock,
  Sunrise,
  Moon,
  ListChecks
} from 'lucide-react';
import type { CreateHabitInput } from '@/lib/api/habits';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';

const emojiOptions = ['✨', '🧘', '📚', '💪', '🏃', '💧', '🍎', '😴', '✍️', '🎯', '🧠', '🌱', '🎨', '🎵', '💡'];

interface ChecklistItem {
  id: string;
  text: string;
}

export default function HabitsPage() {
  const { data: habits, isLoading: habitsLoading } = useHabitsWithLogs();
  const { data: routines = [], isLoading: routinesLoading } = useRoutines();
  const { data: todayLogs = [] } = useTodayRoutineLogs();
  const createHabit = useCreateHabit();
  const toggleHabit = useToggleHabitLog();
  const deleteHabit = useDeleteHabit();
  const logCompletion = useLogRoutineCompletion();

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

  // Routines
  const morningRoutines = routines.filter(r => r.type === 'morning');
  const eveningRoutines = routines.filter(r => r.type === 'evening');

  const getCompletedItems = (routineId: string): string[] => {
    const log = todayLogs.find(l => l.routine_id === routineId);
    if (!log || !log.completed_items) return [];
    return Array.isArray(log.completed_items) ? log.completed_items as string[] : [];
  };

  const toggleRoutineItem = (routineId: string, itemId: string) => {
    const currentCompleted = getCompletedItems(routineId);
    const newCompleted = currentCompleted.includes(itemId)
      ? currentCompleted.filter(id => id !== itemId)
      : [...currentCompleted, itemId];
    
    logCompletion.mutate({ routineId, completedItems: newCompleted });
  };

  // 7-day history (mock)
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

  const isLoading = habitsLoading || routinesLoading;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Chargement...</p>
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
              Système unifié - Construisez la discipline
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
                  Ajoutez une nouvelle habitude à suivre
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
                  <p className="text-2xl font-bold tabular-nums">{activeHabits.length + routines.length}</p>
                  <p className="text-xs text-muted-foreground">Total actifs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Week History Mini Chart */}
          <Card className="glass-hover md:col-span-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">7 derniers jours</span>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs text-primary gap-1">
                      Historique <ChevronRight className="h-3 w-3" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="glass-strong">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Historique complet
                      </SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-4">
                      {weekHistory.map((day, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-sm">
                            {format(day.date, 'EEEE d MMM', { locale: fr })}
                          </span>
                          <div className="flex items-center gap-2">
                            <Progress value={day.rate} className="w-24 h-2" />
                            <span className="text-sm font-medium w-12 text-right">
                              {day.completed}/{day.total}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </SheetContent>
                </Sheet>
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

        {/* Unified Tabs */}
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
            <TabsTrigger value="routines" className="gap-2">
              <ListChecks className="h-4 w-4" />
              Routines
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Historique
            </TabsTrigger>
            <TabsTrigger value="manage" className="gap-2">
              <Target className="h-4 w-4" />
              Gérer
            </TabsTrigger>
          </TabsList>

          {/* Today's Checklist */}
          <TabsContent value="today" className="space-y-3">
            {incompleteHabits.length === 0 && completedHabits.length > 0 ? (
              <Card className="glass-strong border-success/30 bg-success/5">
                <CardContent className="py-8 text-center">
                  <Sparkles className="h-12 w-12 mx-auto text-success mb-3" />
                  <h3 className="text-lg font-semibold text-success mb-1">
                    Toutes les habitudes complétées !
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Excellent travail. Vérifiez vos routines.
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

          {/* Routines Tab - Merged */}
          <TabsContent value="routines" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Morning Routines */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sunrise className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Matin</h2>
                  <Badge variant="secondary">{morningRoutines.length}</Badge>
                </div>
                {morningRoutines.length === 0 ? (
                  <Card className="glass border-dashed">
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <p>Aucune routine matinale</p>
                    </CardContent>
                  </Card>
                ) : (
                  morningRoutines.map((routine) => {
                    const checklist = (routine.checklist as unknown as ChecklistItem[]) || [];
                    const completedItems = getCompletedItems(routine.id);
                    const progress = checklist.length > 0 ? (completedItems.length / checklist.length) * 100 : 0;

                    return (
                      <Card key={routine.id} className="glass-hover">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{routine.name}</CardTitle>
                          {checklist.length > 0 && (
                            <div className="mt-2">
                              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                                <span>{completedItems.length}/{checklist.length}</span>
                                <span>{Math.round(progress)}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </div>
                          )}
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {checklist.map((item) => (
                              <li key={item.id} className="flex items-center gap-3">
                                <Checkbox
                                  checked={completedItems.includes(item.id)}
                                  onCheckedChange={() => toggleRoutineItem(routine.id, item.id)}
                                />
                                <span className={cn(
                                  completedItems.includes(item.id) && 'line-through text-muted-foreground'
                                )}>
                                  {item.text}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>

              {/* Evening Routines */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Moon className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Soir</h2>
                  <Badge variant="secondary">{eveningRoutines.length}</Badge>
                </div>
                {eveningRoutines.length === 0 ? (
                  <Card className="glass border-dashed">
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <p>Aucune routine du soir</p>
                    </CardContent>
                  </Card>
                ) : (
                  eveningRoutines.map((routine) => {
                    const checklist = (routine.checklist as unknown as ChecklistItem[]) || [];
                    const completedItems = getCompletedItems(routine.id);
                    const progress = checklist.length > 0 ? (completedItems.length / checklist.length) * 100 : 0;

                    return (
                      <Card key={routine.id} className="glass-hover">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{routine.name}</CardTitle>
                          {checklist.length > 0 && (
                            <div className="mt-2">
                              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                                <span>{completedItems.length}/{checklist.length}</span>
                                <span>{Math.round(progress)}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </div>
                          )}
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {checklist.map((item) => (
                              <li key={item.id} className="flex items-center gap-3">
                                <Checkbox
                                  checked={completedItems.includes(item.id)}
                                  onCheckedChange={() => toggleRoutineItem(routine.id, item.id)}
                                />
                                <span className={cn(
                                  completedItems.includes(item.id) && 'line-through text-muted-foreground'
                                )}>
                                  {item.text}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Gérer les routines : <Link to="/routines" className="text-primary hover:underline">Paramètres des routines</Link>
            </p>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card className="glass-strong">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Historique des 30 derniers jours
                </CardTitle>
                <CardDescription>
                  Suivez votre progression et identifiez les patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Week by Week view */}
                <div className="space-y-6">
                  {[0, 1, 2, 3].map((weekOffset) => (
                    <div key={weekOffset}>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">
                        {weekOffset === 0 ? 'Cette semaine' : weekOffset === 1 ? 'Semaine dernière' : `Il y a ${weekOffset} semaines`}
                      </h4>
                      <div className="flex items-end justify-between gap-1 h-20">
                        {Array.from({ length: 7 }, (_, i) => {
                          const dayIndex = weekOffset * 7 + (6 - i);
                          const date = subDays(new Date(), dayIndex);
                          const rate = Math.floor(Math.random() * 100);
                          return (
                            <div 
                              key={i}
                              className="flex-1 flex flex-col items-center gap-1"
                            >
                              <div 
                                className={cn(
                                  'w-full rounded-sm transition-all',
                                  rate >= 80 ? 'bg-success' : rate >= 50 ? 'bg-warning' : rate > 0 ? 'bg-muted-foreground/30' : 'bg-muted/20'
                                )}
                                style={{ height: `${Math.max(4, rate * 0.6)}px` }}
                              />
                              <span className="text-[10px] text-muted-foreground">
                                {format(date, 'E', { locale: fr })}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Completed Habits History */}
                <div className="mt-8">
                  <h4 className="text-sm font-medium mb-4">Aujourd'hui ({completedHabits.length}/{activeHabits.length})</h4>
                  <div className="space-y-2">
                    {completedHabits.map((habit) => (
                      <div key={habit.id} className="flex items-center gap-3 p-2 rounded-lg bg-success/10">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span className="text-2xl">{habit.icon || '✨'}</span>
                        <span className="text-sm line-through text-muted-foreground">{habit.name}</span>
                        {habit.streak && habit.streak.current_streak > 0 && (
                          <Badge className="bg-warning/15 text-warning border-0 text-xs ml-auto">
                            <Flame className="h-3 w-3 mr-1" />
                            {habit.streak.current_streak}
                          </Badge>
                        )}
                      </div>
                    ))}
                    {completedHabits.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Aucune habitude complétée aujourd'hui
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Tab */}
          <TabsContent value="manage" className="space-y-4">
            <Card className="glass-strong">
              <CardHeader>
                <CardTitle>Gérer les habitudes</CardTitle>
                <CardDescription>
                  Modifiez, activez ou supprimez vos habitudes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeHabits.length === 0 ? (
                  <div className="text-center py-8">
                    <Sparkles className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">Aucune habitude</p>
                    <Button className="mt-4 gradient-primary" onClick={() => setIsDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer une habitude
                    </Button>
                  </div>
                ) : (
                  activeHabits.map((habit) => (
                    <div
                      key={habit.id}
                      className="flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-border transition-colors"
                    >
                      <span className="text-2xl">{habit.icon || '✨'}</span>
                      <div className="flex-1">
                        <p className="font-medium">{habit.name}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {habit.target_frequency === 'daily' ? 'Quotidien' : 
                             habit.target_frequency === 'weekly' ? 'Hebdo' : 'Personnalisé'}
                          </Badge>
                          {habit.streak && habit.streak.current_streak > 0 && (
                            <Badge className="bg-warning/15 text-warning border-0 text-xs">
                              <Flame className="h-3 w-3 mr-1" />
                              {habit.streak.current_streak} jours
                            </Badge>
                          )}
                          {habit.streak && habit.streak.max_streak && habit.streak.max_streak > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <Trophy className="h-3 w-3 mr-1" />
                              Max: {habit.streak.max_streak}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteHabit.mutate(habit.id)}
                        disabled={deleteHabit.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
