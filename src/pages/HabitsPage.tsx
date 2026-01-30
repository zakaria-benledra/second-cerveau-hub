import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
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
import { Plus, Flame, Loader2, Trash2, Trophy, Target, Sparkles } from 'lucide-react';
import type { CreateHabitInput } from '@/lib/api/habits';
import { cn } from '@/lib/utils';

const emojiOptions = ['✨', '🧘', '📚', '💪', '🏃', '💧', '🍎', '😴', '✍️', '🎯', '🧠', '🌱'];

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

  const handleCreateHabit = async () => {
    if (!newHabit.name.trim()) return;
    
    await createHabit.mutateAsync(newHabit);
    setNewHabit({ name: '', icon: '✨', target_frequency: 'daily' });
    setIsDialogOpen(false);
  };

  const activeHabits = habits?.filter(h => h.is_active) || [];
  const completedToday = activeHabits.filter(h => h.todayLog?.completed).length;
  const completionRate = activeHabits.length > 0 
    ? Math.round((completedToday / activeHabits.length) * 100) 
    : 0;

  const totalStreak = activeHabits.reduce((sum, h) => sum + (h.streak?.current_streak || 0), 0);
  const maxStreak = activeHabits.reduce((max, h) => Math.max(max, h.streak?.max_streak || 0), 0);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Habitudes</h1>
            <p className="text-muted-foreground mt-1">
              {activeHabits.length} habitudes actives
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle habitude
              </Button>
            </DialogTrigger>
            <DialogContent>
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
                        className="text-xl"
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
                >
                  {createHabit.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Créer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover-lift">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold">{completedToday}/{activeHabits.length}</p>
                  <p className="text-xs text-muted-foreground">Aujourd'hui</p>
                </div>
              </div>
              <Progress value={completionRate} className="mt-4 h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {completionRate}% complété
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-warning/10">
                  <Flame className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-warning">{totalStreak}</p>
                  <p className="text-xs text-muted-foreground">Jours cumulés</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-accent/10">
                  <Trophy className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{maxStreak}</p>
                  <p className="text-xs text-muted-foreground">Meilleur streak</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Habits List */}
        <Card>
          <CardHeader>
            <CardTitle>Mes habitudes</CardTitle>
            <CardDescription>
              Cliquez sur une habitude pour la marquer comme complétée
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeHabits.map((habit) => (
              <div
                key={habit.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border transition-all group hover-lift cursor-pointer",
                  habit.todayLog?.completed 
                    ? "bg-success/5 border-success/30" 
                    : "hover:bg-muted/50"
                )}
                onClick={() => toggleHabit.mutate(habit.id)}
              >
                <Checkbox
                  checked={habit.todayLog?.completed || false}
                  disabled={toggleHabit.isPending}
                  className="h-6 w-6 rounded-lg"
                />
                <span className="text-2xl">{habit.icon || '✨'}</span>
                <div className="flex-1">
                  <p className={cn(
                    "font-medium",
                    habit.todayLog?.completed && 'line-through text-muted-foreground'
                  )}>
                    {habit.name}
                  </p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="muted" className="text-xs">
                      {habit.target_frequency === 'daily' ? 'Quotidien' : 
                       habit.target_frequency === 'weekly' ? 'Hebdomadaire' : 'Mensuel'}
                    </Badge>
                    {habit.streak && habit.streak.current_streak > 0 && (
                      <Badge variant="warning" className="text-xs">
                        <Flame className="h-3 w-3 mr-1" />
                        {habit.streak.current_streak} jours
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteHabit.mutate(habit.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}

            {activeHabits.length === 0 && (
              <div className="text-center py-12">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">
                  Aucune habitude créée
                </p>
                <Button variant="gradient" onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer ma première habitude
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
