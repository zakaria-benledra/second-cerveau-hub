import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRoutines, useCreateRoutine, useDeleteRoutine, useTodayRoutineLogs, useLogRoutineCompletion } from '@/hooks/useRoutines';
import { Sunrise, Moon, Plus, Trash2, Check, ListChecks } from 'lucide-react';
import type { Json } from '@/integrations/supabase/types';

interface ChecklistItem {
  id: string;
  text: string;
}

export default function RoutinesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRoutine, setNewRoutine] = useState({
    name: '',
    type: 'morning' as 'morning' | 'evening',
    checklist: [] as ChecklistItem[],
  });
  const [newItemText, setNewItemText] = useState('');

  const { data: routines = [], isLoading } = useRoutines();
  const { data: todayLogs = [] } = useTodayRoutineLogs();
  const createRoutine = useCreateRoutine();
  const deleteRoutine = useDeleteRoutine();
  const logCompletion = useLogRoutineCompletion();

  const morningRoutines = routines.filter(r => r.type === 'morning');
  const eveningRoutines = routines.filter(r => r.type === 'evening');

  const addChecklistItem = () => {
    if (!newItemText.trim()) return;
    setNewRoutine({
      ...newRoutine,
      checklist: [...newRoutine.checklist, { id: crypto.randomUUID(), text: newItemText.trim() }],
    });
    setNewItemText('');
  };

  const removeChecklistItem = (id: string) => {
    setNewRoutine({
      ...newRoutine,
      checklist: newRoutine.checklist.filter(item => item.id !== id),
    });
  };

  const handleCreateRoutine = () => {
    if (!newRoutine.name) return;
    
    createRoutine.mutate({
      name: newRoutine.name,
      type: newRoutine.type,
      checklist: newRoutine.checklist as unknown as Json,
      is_active: true,
    }, {
      onSuccess: () => {
        setNewRoutine({ name: '', type: 'morning', checklist: [] });
        setIsDialogOpen(false);
      },
    });
  };

  const getCompletedItems = (routineId: string): string[] => {
    const log = todayLogs.find(l => l.routine_id === routineId);
    if (!log || !log.completed_items) return [];
    return Array.isArray(log.completed_items) ? log.completed_items as string[] : [];
  };

  const toggleItem = (routineId: string, itemId: string) => {
    const currentCompleted = getCompletedItems(routineId);
    const newCompleted = currentCompleted.includes(itemId)
      ? currentCompleted.filter(id => id !== itemId)
      : [...currentCompleted, itemId];
    
    logCompletion.mutate({ routineId, completedItems: newCompleted });
  };

  const RoutineCard = ({ routine }: { routine: typeof routines[0] }) => {
    const checklist = (routine.checklist as unknown as ChecklistItem[]) || [];
    const completedItems = getCompletedItems(routine.id);
    const progress = checklist.length > 0 ? (completedItems.length / checklist.length) * 100 : 0;

    return (
      <Card className="glass-hover">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              {routine.type === 'morning' ? (
                <Sunrise className="w-5 h-5 text-primary" />
              ) : (
                <Moon className="w-5 h-5 text-primary" />
              )}
              {routine.name}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => deleteRoutine.mutate(routine.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          {checklist.length > 0 && (
            <div className="mt-2">
              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <span>{completedItems.length}/{checklist.length} complétés</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {checklist.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun élément dans cette routine</p>
          ) : (
            <ul className="space-y-2">
              {checklist.map((item) => (
                <li key={item.id} className="flex items-center gap-3">
                  <Checkbox
                    checked={completedItems.includes(item.id)}
                    onCheckedChange={() => toggleItem(routine.id, item.id)}
                  />
                  <span className={completedItems.includes(item.id) ? 'line-through text-muted-foreground' : ''}>
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Routines
            </h1>
            <p className="text-muted-foreground mt-1">
              Créez des habitudes matinales et du soir
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nouvelle routine
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une routine</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input
                    value={newRoutine.name}
                    onChange={(e) => setNewRoutine({ ...newRoutine, name: e.target.value })}
                    placeholder="Routine matinale"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={newRoutine.type}
                    onValueChange={(value: 'morning' | 'evening') => setNewRoutine({ ...newRoutine, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">
                        <div className="flex items-center gap-2">
                          <Sunrise className="w-4 h-4 text-primary" />
                          Matin
                        </div>
                      </SelectItem>
                      <SelectItem value="evening">
                        <div className="flex items-center gap-2">
                          <Moon className="w-4 h-4 text-primary" />
                          Soir
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Checklist</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      placeholder="Ajouter un élément..."
                      onKeyPress={(e) => e.key === 'Enter' && addChecklistItem()}
                    />
                    <Button type="button" onClick={addChecklistItem} size="icon">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {newRoutine.checklist.length > 0 && (
                    <ul className="space-y-1 mt-2">
                      {newRoutine.checklist.map((item) => (
                        <li key={item.id} className="flex items-center justify-between p-2 bg-accent rounded">
                          <span className="text-sm">{item.text}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeChecklistItem(item.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <Button onClick={handleCreateRoutine} className="w-full" disabled={createRoutine.isPending}>
                  {createRoutine.isPending ? 'Création...' : 'Créer la routine'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Chargement...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Morning Routines */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sunrise className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Routines du Matin</h2>
                <Badge variant="secondary">{morningRoutines.length}</Badge>
              </div>
              {morningRoutines.length === 0 ? (
                <Card className="glass">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <ListChecks className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune routine matinale</p>
                    <p className="text-sm">Créez votre première routine du matin</p>
                  </CardContent>
                </Card>
              ) : (
                morningRoutines.map((routine) => (
                  <RoutineCard key={routine.id} routine={routine} />
                ))
              )}
            </div>

            {/* Evening Routines */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Moon className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Routines du Soir</h2>
                <Badge variant="secondary">{eveningRoutines.length}</Badge>
              </div>
              {eveningRoutines.length === 0 ? (
                <Card className="glass">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <ListChecks className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune routine du soir</p>
                    <p className="text-sm">Créez votre première routine du soir</p>
                  </CardContent>
                </Card>
              ) : (
                eveningRoutines.map((routine) => (
                  <RoutineCard key={routine.id} routine={routine} />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
