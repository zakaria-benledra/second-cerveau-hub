import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchHabitsWithLogs,
  createHabit,
  toggleHabitLog,
  deleteHabit,
  type CreateHabitInput,
} from '@/lib/api/habits';
import { useToast } from '@/hooks/use-toast';

export function useHabitsWithLogs() {
  return useQuery({
    queryKey: ['habits', 'withLogs'],
    queryFn: fetchHabitsWithLogs,
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: CreateHabitInput) => createHabit(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast({
        title: 'Habitude créée',
        description: 'Votre nouvelle habitude a été ajoutée.',
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

export function useToggleHabitLog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (habitId: string) => toggleHabitLog(habitId),
    onSuccess: (log) => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      if (log.completed) {
        toast({
          title: 'Bien joué ! ✨',
          description: 'Habitude complétée pour aujourd\'hui.',
        });
      }
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

export function useDeleteHabit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteHabit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast({
        title: 'Habitude supprimée',
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
