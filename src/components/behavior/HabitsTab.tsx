import { useState } from 'react';
import { HABIT_EMOJI_OPTIONS } from '@/constants';
import { Card, CardContent } from '@/components/ui/card';
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
import { useHabitHistory } from '@/hooks/useHabitsKPI';
import { ScoreRing } from '@/components/today/ScoreRing';
import { BehavioralSection } from '@/components/habits/BehavioralSection';
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
  Heart,
  Snowflake
} from 'lucide-react';
import { HabitTimeline } from '@/components/habits/HabitTimeline';
import type { CreateHabitInput } from '@/lib/api/habits';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';



export function HabitsTab() {
  const { data: habits, isLoading: habitsLoading } = useHabitsWithLogs();
  const { data: weekHistory = [], isLoading: historyLoading } = useHabitHistory(7);
  const createHabit = useCreateHabit();
  const toggleHabit = useToggleHabitLog();
  const deleteHabit = useDeleteHabit();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newHabit, setNewHabit] = useState<CreateHabitInput>({
    name: '',
    icon: '✨',
    target_frequency: 'daily',
  });
  const [activeSubTab, setActiveSubTab] = useState('today');

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

  const isLoading = habitsLoading || historyLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {/* Main Score Ring */}
        <Card className="glass-strong col-span-2 md:col-span-1 md:row-span-2">
          <CardContent className="pt-6 flex flex-col items-center justify-center h-full">
            <ScoreRing
              value={completionRate}
              size="lg"
              label="Aujourd'hui"
              sublabel={`${completedToday}/${activeHabits.length}`}
            />
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="glass-hover">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-warning/15">
                <Flame className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-xl font-bold text-warning tabular-nums">{totalStreak}</p>
                <p className="text-xs text-muted-foreground">Jours cumulés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-hover">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-accent/15">
                <Trophy className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-xl font-bold tabular-nums">{maxStreak}</p>
                <p className="text-xs text-muted-foreground">Meilleur streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-hover">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/15">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold tabular-nums">{activeHabits.length}</p>
                <p className="text-xs text-muted-foreground">Habitudes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Week History */}
        <Card className="glass-hover col-span-2">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium">7 derniers jours</span>
            </div>
            <div className="flex items-end justify-between gap-1 h-12">
              {weekHistory.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className={cn(
                      'w-full rounded-sm transition-all',
                      day.rate >= 80 ? 'bg-success' : day.rate >= 50 ? 'bg-warning' : 'bg-muted-foreground/30'
                    )}
                    style={{ height: `${Math.max(4, day.rate * 0.4)}px` }}
                  />
                  <span className="text-[9px] text-muted-foreground">
                    {format(day.date, 'E', { locale: fr })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Button + Sub-tabs */}
      <div className="flex items-center justify-between">
        <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="flex-1">
          <TabsList className="glass">
            <TabsTrigger value="today" className="gap-1.5 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Aujourd'hui
              {incompleteHabits.length > 0 && (
                <Badge className="h-4 w-4 p-0 flex items-center justify-center text-[9px]">
                  {incompleteHabits.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="behavioral" className="gap-1.5 text-xs">
              <Heart className="h-3.5 w-3.5" />
              Check-in
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5 text-xs">
              <History className="h-3.5 w-3.5" />
              Timeline
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-primary ml-4">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong">
            <DialogHeader>
              <DialogTitle>Nouvelle habitude</DialogTitle>
              <DialogDescription>Ajoutez une habitude quotidienne</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  value={newHabit.name}
                  onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                  placeholder="Ex: Méditation"
                  className="glass-hover"
                />
              </div>
              <div className="space-y-2">
                <Label>Icône</Label>
                <div className="flex flex-wrap gap-2">
                  {HABIT_EMOJI_OPTIONS.map((emoji) => (
                    <Button
                      key={emoji}
                      variant={newHabit.icon === emoji ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setNewHabit({ ...newHabit, icon: emoji })}
                      className={cn("text-lg", newHabit.icon === emoji && 'gradient-primary')}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleCreateHabit} disabled={createHabit.isPending || !newHabit.name.trim()} className="gradient-primary">
                {createHabit.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Créer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sub-tab Content */}
      {activeSubTab === 'today' && (
        <div className="space-y-3">
          {incompleteHabits.length === 0 && completedHabits.length > 0 ? (
            <Card className="glass-strong border-success/30 bg-success/5">
              <CardContent className="py-6 text-center">
                <Sparkles className="h-10 w-10 mx-auto text-success mb-2" />
                <h3 className="font-semibold text-success">Tout complété !</h3>
              </CardContent>
            </Card>
          ) : incompleteHabits.length === 0 ? (
            <Card className="glass">
              <CardContent className="py-8 text-center">
                <Sparkles className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground text-sm">Aucune habitude</p>
              </CardContent>
            </Card>
          ) : (
            incompleteHabits.map((habit) => (
              <Card
                key={habit.id}
                className="group glass-hover cursor-pointer"
                onClick={() => toggleHabit.mutate(habit.id)}
              >
                <CardContent className="py-3">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={false} className="h-5 w-5" />
                    <span className="text-xl">{habit.icon || '✨'}</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{habit.name}</p>
                      {habit.streak && habit.streak.current_streak > 0 && (
                        <Badge className="bg-warning/15 text-warning border-0 text-[10px] mt-1">
                          <Flame className="h-2.5 w-2.5 mr-0.5" />
                          {habit.streak.current_streak}j
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 h-7 w-7"
                      onClick={(e) => { e.stopPropagation(); deleteHabit.mutate(habit.id); }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {completedHabits.length > 0 && (
            <div className="space-y-2 pt-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Complétées</p>
              {completedHabits.map((habit) => (
                <Card key={habit.id} className="glass-hover cursor-pointer opacity-50" onClick={() => toggleHabit.mutate(habit.id)}>
                  <CardContent className="py-2">
                    <div className="flex items-center gap-3">
                      <Checkbox checked className="h-4 w-4" />
                      <span className="text-lg">{habit.icon || '✨'}</span>
                      <span className="text-sm line-through">{habit.name}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'behavioral' && <BehavioralSection />}
      {activeSubTab === 'history' && <HabitTimeline />}
    </div>
  );
}
