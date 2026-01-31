import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  useTaskChecklist, 
  useAddChecklistItem, 
  useToggleChecklistItem,
  useDeleteChecklistItem 
} from '@/hooks/useTaskChecklist';
import { useToast } from '@/hooks/use-toast';
import { 
  Flag, 
  TrendingUp, 
  Target, 
  History, 
  Calendar,
  CheckCircle2,
  Circle,
  Play,
  Archive,
  Plus,
  Trash2,
  CalendarPlus,
  Loader2,
  ListChecks
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { KanbanTask, KanbanStatus } from '@/hooks/useKanban';

interface TaskActionsSheetProps {
  task: KanbanTask;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  impactScore: number;
  priorityConfig: { bg: string; text: string; label: string };
  energyConfig?: { icon: string; label: string };
  projectName?: string;
  goalTitle?: string;
  isOverdue: boolean;
}

const statusConfig: Record<KanbanStatus, { label: string; icon: typeof CheckCircle2; color: string }> = {
  backlog: { label: 'Backlog', icon: Circle, color: 'text-muted-foreground' },
  todo: { label: 'À faire', icon: Circle, color: 'text-primary' },
  doing: { label: 'En cours', icon: Play, color: 'text-warning' },
  done: { label: 'Terminé', icon: CheckCircle2, color: 'text-success' },
};

export function TaskActionsSheet({
  task,
  open,
  onOpenChange,
  impactScore,
  priorityConfig,
  energyConfig,
  projectName,
  goalTitle,
  isOverdue,
}: TaskActionsSheetProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newChecklistItem, setNewChecklistItem] = useState('');

  // Checklist hooks
  const { data: checklistItems = [], isLoading: isLoadingChecklist } = useTaskChecklist(task.id);
  const addChecklistItem = useAddChecklistItem();
  const toggleChecklistItem = useToggleChecklistItem();
  const deleteChecklistItem = useDeleteChecklistItem();

  // Status change mutation
  const updateStatus = useMutation({
    mutationFn: async (newStatus: KanbanStatus) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-tasks-kanban?action=move`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ taskId: task.id, newStatus }),
        }
      );

      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: 'Statut mis à jour' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour le statut', variant: 'destructive' });
    },
  });

  // Postpone date mutation
  const postponeDate = useMutation({
    mutationFn: async (days: number) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const currentDate = task.due_date ? new Date(task.due_date) : new Date();
      const newDate = addDays(currentDate, days).toISOString().split('T')[0];

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-tasks?id=${task.id}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ due_date: newDate }),
        }
      );

      if (!response.ok) throw new Error('Failed to update date');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: 'Date mise à jour' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de décaler la date', variant: 'destructive' });
    },
  });

  // Archive mutation
  const archiveTask = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          archived_at: new Date().toISOString(),
          status: 'cancelled' as const,
        })
        .eq('id', task.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onOpenChange(false);
      toast({ title: 'Tâche archivée', description: 'La tâche a été déplacée dans l\'historique' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible d\'archiver la tâche', variant: 'destructive' });
    },
  });

  const handleAddChecklistItem = async () => {
    if (!newChecklistItem.trim()) return;
    await addChecklistItem.mutateAsync({ taskId: task.id, title: newChecklistItem.trim() });
    setNewChecklistItem('');
  };

  const completedCount = checklistItems.filter(item => item.completed).length;
  const checklistProgress = checklistItems.length > 0 
    ? Math.round((completedCount / checklistItems.length) * 100) 
    : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Flag className={cn('h-5 w-5', priorityConfig.text)} />
            {task.title}
          </SheetTitle>
          <SheetDescription>
            Gérez votre tâche : statut, date, checklist
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Impact Summary */}
          <div className="glass-strong rounded-2xl p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Score d'Impact
            </h3>
            <div className="flex items-center gap-4">
              <div className={cn(
                'flex items-center justify-center w-16 h-16 rounded-2xl text-2xl font-bold',
                impactScore >= 80 ? 'bg-gradient-to-br from-destructive to-warning text-destructive-foreground' :
                impactScore >= 60 ? 'bg-gradient-to-br from-warning to-amber-400 text-warning-foreground' :
                impactScore >= 40 ? 'bg-gradient-to-br from-primary to-accent text-primary-foreground' :
                'bg-muted text-muted-foreground'
              )}>
                {impactScore}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Badge className={cn('text-xs', priorityConfig.bg, priorityConfig.text)}>
                    {priorityConfig.label}
                  </Badge>
                  {energyConfig && (
                    <Badge variant="outline" className="text-xs">
                      {energyConfig.icon} {energyConfig.label}
                    </Badge>
                  )}
                </div>
                {(goalTitle || projectName) && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Target className="h-3 w-3 text-accent" />
                    Lié à: {goalTitle || projectName}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Status Actions */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Play className="h-4 w-4" />
              Changer le statut
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {(['todo', 'doing', 'done'] as KanbanStatus[]).map((status) => {
                const config = statusConfig[status];
                const Icon = config.icon;
                const isActive = task.kanban_status === status;
                
                return (
                  <Button
                    key={status}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    className={cn('justify-start', isActive && 'pointer-events-none')}
                    onClick={() => updateStatus.mutate(status)}
                    disabled={updateStatus.isPending}
                  >
                    {updateStatus.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Icon className={cn('h-4 w-4 mr-2', config.color)} />
                    )}
                    {config.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Postpone Date */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <CalendarPlus className="h-4 w-4" />
              Décaler la date
              {task.due_date && (
                <Badge variant="outline" className={cn('text-xs ml-auto', isOverdue && 'bg-destructive/10 text-destructive')}>
                  {format(new Date(task.due_date), 'd MMM', { locale: fr })}
                </Badge>
              )}
            </h3>
            <div className="flex gap-2">
              {[1, 2, 7].map((days) => (
                <Button
                  key={days}
                  variant="outline"
                  size="sm"
                  onClick={() => postponeDate.mutate(days)}
                  disabled={postponeDate.isPending}
                >
                  {postponeDate.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    `+${days}j`
                  )}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                Checklist
              </h3>
              {checklistItems.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {completedCount}/{checklistItems.length} ({checklistProgress}%)
                </Badge>
              )}
            </div>

            {/* Progress bar */}
            {checklistItems.length > 0 && (
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-success transition-all duration-300"
                  style={{ width: `${checklistProgress}%` }}
                />
              </div>
            )}

            {/* Checklist items */}
            <div className="space-y-2">
              {isLoadingChecklist ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                checklistItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center gap-2 group p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={(checked) => {
                        toggleChecklistItem.mutate({ 
                          id: item.id, 
                          completed: !!checked,
                          taskId: task.id 
                        });
                      }}
                    />
                    <span className={cn(
                      'flex-1 text-sm',
                      item.completed && 'line-through text-muted-foreground'
                    )}>
                      {item.title}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteChecklistItem.mutate({ id: item.id, taskId: task.id })}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                ))
              )}

              {/* Add new item */}
              <div className="flex items-center gap-2 pt-2">
                <Plus className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ajouter un élément..."
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddChecklistItem();
                    }
                  }}
                  className="h-8 text-sm"
                />
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={handleAddChecklistItem}
                  disabled={!newChecklistItem.trim() || addChecklistItem.isPending}
                >
                  {addChecklistItem.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Ajouter'
                  )}
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Timeline */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <History className="h-4 w-4" />
              Historique
            </h3>
            <div className="relative pl-4 border-l-2 border-border space-y-4">
              <div className="relative">
                <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-primary border-2 border-background" />
                <div className="text-sm">
                  <span className="font-medium">Créée</span>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(task.created_at), 'PPP à HH:mm', { locale: fr })}
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-accent border-2 border-background" />
                <div className="text-sm">
                  <span className="font-medium">Statut actuel</span>
                  <p className="text-xs text-muted-foreground capitalize">
                    {statusConfig[task.kanban_status]?.label || task.kanban_status}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Archive Button */}
          <Button
            variant="outline"
            className="w-full text-muted-foreground hover:text-destructive hover:border-destructive"
            onClick={() => archiveTask.mutate()}
            disabled={archiveTask.isPending}
          >
            {archiveTask.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Archive className="h-4 w-4 mr-2" />
            )}
            Archiver cette tâche
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
