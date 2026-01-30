import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTodayFocusSessions,
  startFocusSession,
  stopFocusSession,
  fetchTimeBlocks,
  createTimeBlock,
  type FocusSession,
  type TimeBlock,
  type TimeBlockInsert,
} from '@/lib/api/focus';

export function useFocusSessions() {
  return useQuery({
    queryKey: ['focus-sessions', 'today'],
    queryFn: fetchTodayFocusSessions,
  });
}

export function useStartFocusSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, type }: { taskId?: string; type?: string }) => 
      startFocusSession(taskId, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-sessions'] });
    },
  });
}

export function useStopFocusSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => stopFocusSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useTimeBlocks(date?: string) {
  return useQuery({
    queryKey: ['time-blocks', date || 'today'],
    queryFn: () => fetchTimeBlocks(date),
  });
}

export function useCreateTimeBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (timeBlock: Omit<TimeBlockInsert, 'user_id'>) => createTimeBlock(timeBlock),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-blocks'] });
    },
  });
}
