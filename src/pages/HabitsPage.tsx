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
import { Plus, Flame, Loader2, Trash2, Trophy } from 'lucide-react';
import type { CreateHabitInput } from '@/lib/api/habits';

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

  // Calculate total streak
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Habitudes</h1>
            <p className="text-muted-foreground">
              {activeHabits.length} habitudes actives
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="border-2">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle habitude
              </Button>
            </DialogTrigger>
            <DialogContent className="border-2">
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
                    className="border-2"
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
                        className="text-xl border-2"
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-2">
                  Annuler
                </Button>
                <Button 
                  onClick={handleCreateHabit} 
                  disabled={createHabit.isPending || !newHabit.name.trim()}
                  className="border-2"
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
          <Card className="border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Aujourd'hui
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{completedToday}/{activeHabits.length}</div>
              <Progress value={completionRate} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {completionRate}% complété
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                Streaks actifs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-500">{totalStreak}</div>
              <p className="text-xs text-muted-foreground mt-2">
                jours cumulés
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                Meilleur streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-500">{maxStreak}</div>
              <p className="text-xs text-muted-foreground mt-2">
                jours consécutifs
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Habits List */}
        <Card className="border-2">
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
                className="flex items-center gap-4 p-4 border-2 hover:bg-accent transition-colors group"
              >
                <div
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => toggleHabit.mutate(habit.id)}
                >
                  <Checkbox
                    checked={habit.todayLog?.completed || false}
                    disabled={toggleHabit.isPending}
                    className="border-2 h-6 w-6"
                  />
                  <span className="text-2xl">{habit.icon || '✨'}</span>
                  <div className="flex-1">
                    <p className={`font-medium ${habit.todayLog?.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {habit.name}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="border-2 text-xs">
                        {habit.target_frequency === 'daily' ? 'Quotidien' : 
                         habit.target_frequency === 'weekly' ? 'Hebdomadaire' : 'Mensuel'}
                      </Badge>
                      {habit.streak && habit.streak.current_streak > 0 && (
                        <Badge className="bg-orange-500/10 text-orange-700 border-orange-500 border-2 text-xs">
                          <Flame className="h-3 w-3 mr-1" />
                          {habit.streak.current_streak} jours
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteHabit.mutate(habit.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}

            {activeHabits.length === 0 && (
              <div className="text-center py-12">
                <Flame className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Aucune habitude créée
                </p>
                <Button onClick={() => setIsDialogOpen(true)} className="border-2">
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
