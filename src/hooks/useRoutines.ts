import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchRoutines,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  fetchTodayRoutineLogs,
  logRoutineCompletion,
  type RoutineInsert,
} from '@/lib/api/routines';
import type { TablesUpdate } from '@/integrations/supabase/types';

export function useRoutines() {
  return useQuery({
    queryKey: ['routines'],
    queryFn: fetchRoutines,
  });
}

export function useTodayRoutineLogs() {
  return useQuery({
    queryKey: ['routine-logs', 'today'],
    queryFn: fetchTodayRoutineLogs,
  });
}

export function useCreateRoutine() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (routine: Omit<RoutineInsert, 'user_id'>) => createRoutine(routine),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
    },
  });
}

export function useUpdateRoutine() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: TablesUpdate<'routines'> }) =>
      updateRoutine(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
    },
  });
}

export function useDeleteRoutine() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteRoutine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
    },
  });
}

export function useLogRoutineCompletion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ routineId, completedItems }: { routineId: string; completedItems: string[] }) =>
      logRoutineCompletion(routineId, completedItems),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routine-logs'] });
    },
  });
}
