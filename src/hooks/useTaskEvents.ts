import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type TaskEvent = Tables<'task_events'>;

export function useTaskEvents(taskId: string | undefined) {
  return useQuery({
    queryKey: ['task-events', taskId],
    queryFn: async (): Promise<TaskEvent[]> => {
      if (!taskId) return [];
      
      const { data, error } = await supabase
        .from('task_events')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!taskId,
  });
}
