import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ChecklistItem {
  id: string;
  task_id: string;
  user_id: string;
  title: string;
  completed: boolean;
  sort_order: number;
  created_at: string;
}

export function useTaskChecklist(taskId: string) {
  return useQuery({
    queryKey: ['task-checklist', taskId],
    queryFn: async (): Promise<ChecklistItem[]> => {
      const { data, error } = await supabase
        .from('task_checklist_items')
        .select('*')
        .eq('task_id', taskId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as ChecklistItem[];
    },
    enabled: !!taskId,
  });
}

export function useAddChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, title }: { taskId: string; title: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get current max sort order
      const { data: existing } = await supabase
        .from('task_checklist_items')
        .select('sort_order')
        .eq('task_id', taskId)
        .order('sort_order', { ascending: false })
        .limit(1);

      const nextOrder = existing && existing.length > 0 ? (existing[0] as any).sort_order + 1 : 0;

      const { data, error } = await supabase
        .from('task_checklist_items')
        .insert({
          task_id: taskId,
          user_id: user.id,
          title,
          sort_order: nextOrder,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-checklist', variables.taskId] });
    },
  });
}

export function useToggleChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, completed, taskId }: { id: string; completed: boolean; taskId: string }) => {
      const { data, error } = await supabase
        .from('task_checklist_items')
        .update({ completed, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-checklist', variables.taskId] });
    },
  });
}

export function useDeleteChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, taskId }: { id: string; taskId: string }) => {
      const { error } = await supabase
        .from('task_checklist_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-checklist', variables.taskId] });
    },
  });
}
