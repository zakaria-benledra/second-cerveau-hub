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
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
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
