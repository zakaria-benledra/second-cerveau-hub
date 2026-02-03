import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTodayTasks,
  fetchAllTasks,
  createTask,
  updateTask,
  completeTask,
  deleteTask,
  getNextBestAction,
  type Task,
  type CreateTaskInput,
  type UpdateTaskInput,
} from '@/lib/api/tasks';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { addUndoAction } from '@/components/shared/UndoButton';

// Variable pour stocker temporairement les données de la tâche supprimée
let lastDeletedTask: Task | null = null;

export function useTodayTasks() {
  return useQuery({
    queryKey: ['tasks', 'today'],
    queryFn: fetchTodayTasks,
  });
}

export function useAllTasks() {
  return useQuery({
    queryKey: ['tasks', 'all'],
    queryFn: fetchAllTasks,
  });
}

// Alias for backward compatibility
export const useTasks = useAllTasks;

export function useNextBestAction() {
  return useQuery({
    queryKey: ['tasks', 'nextBestAction'],
    queryFn: getNextBestAction,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: 'Tâche créée',
        description: 'La tâche a été ajoutée avec succès.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) =>
      updateTask(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => completeTask(id),
    onSuccess: (task: Task) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      // Trigger real-time score recalculation
      supabase.functions.invoke('compute-score-realtime').then(() => {
        queryClient.invalidateQueries({ queryKey: ['global-score'] });
        queryClient.invalidateQueries({ queryKey: ['scores'] });
      }).catch(() => {});
      
      toast({
        title: 'Bravo ! 🎉',
        description: `"${task.title}" terminée.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      // Sauvegarder la tâche avant suppression pour permettre l'undo
      const tasks = queryClient.getQueryData<Task[]>(['tasks', 'all']);
      lastDeletedTask = tasks?.find(t => t.id === id) || null;
      return deleteTask(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      // Ajouter action undo si on a les données
      if (lastDeletedTask) {
        const taskToRestore = { ...lastDeletedTask };
        addUndoAction({
          type: 'task',
          action: 'delete',
          data: taskToRestore,
          undo: async () => {
            // Restaurer la tâche (sans status car CreateTaskInput ne l'inclut pas)
            await createTask({
              title: taskToRestore.title,
              description: taskToRestore.description || undefined,
              priority: taskToRestore.priority,
              due_date: taskToRestore.due_date || undefined,
              project_id: taskToRestore.project_id || undefined,
              goal_id: taskToRestore.goal_id || undefined,
            });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
          },
        });
      }
      
      toast({
        title: 'Tâche supprimée',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
