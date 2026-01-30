import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchCalendarEvents,
  fetchTodayEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  type CalendarEventInsert,
  type CalendarEventUpdate,
} from '@/lib/api/calendar';

export function useCalendarEvents(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['calendar-events', startDate, endDate],
    queryFn: () => fetchCalendarEvents(startDate, endDate),
  });
}

export function useTodayEvents() {
  return useQuery({
    queryKey: ['calendar-events', 'today'],
    queryFn: fetchTodayEvents,
  });
}

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (event: Omit<CalendarEventInsert, 'user_id'>) => createCalendarEvent(event),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });
}

export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: CalendarEventUpdate }) =>
      updateCalendarEvent(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });
}

export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteCalendarEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });
}
