import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type KanbanStatus = 'backlog' | 'todo' | 'doing' | 'done';

export interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  priority: string;
  kanban_status: KanbanStatus;
  sort_order: number;
  due_date?: string;
  estimate_min?: number;
  energy_level?: string;
  project_id?: string;
  created_at: string;
}

export interface KanbanColumns {
  backlog: KanbanTask[];
  todo: KanbanTask[];
  doing: KanbanTask[];
  done: KanbanTask[];
}

export function useKanbanTasks() {
  return useQuery({
    queryKey: ['kanban-tasks'],
    queryFn: async (): Promise<KanbanColumns> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-tasks-kanban`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      return data.columns;
    },
  });
}

export function useMoveKanbanTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      taskId, 
      newStatus, 
      newSortOrder,
      previousTaskId 
    }: { 
      taskId: string; 
      newStatus: KanbanStatus; 
      newSortOrder?: number;
      previousTaskId?: string;
    }) => {
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
          body: JSON.stringify({ taskId, newStatus, newSortOrder, previousTaskId }),
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to move task');
      }
      return response.json();
    },
    onMutate: async ({ taskId, newStatus }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['kanban-tasks'] });
      const previousData = queryClient.getQueryData<KanbanColumns>(['kanban-tasks']);
      
      if (previousData) {
        const allTasks = [...previousData.backlog, ...previousData.todo, ...previousData.doing, ...previousData.done];
        const task = allTasks.find(t => t.id === taskId);
        
        if (task) {
          const newData: KanbanColumns = {
            backlog: previousData.backlog.filter(t => t.id !== taskId),
            todo: previousData.todo.filter(t => t.id !== taskId),
            doing: previousData.doing.filter(t => t.id !== taskId),
            done: previousData.done.filter(t => t.id !== taskId),
          };
          newData[newStatus] = [...newData[newStatus], { ...task, kanban_status: newStatus }];
          queryClient.setQueryData(['kanban-tasks'], newData);
        }
      }
      
      return { previousData };
    },
    onError: (err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['kanban-tasks'], context.previousData);
      }
      toast({
        title: 'Erreur',
        description: (err as Error).message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useReorderKanbanTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskIds, status }: { taskIds: string[]; status: KanbanStatus }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-tasks-kanban?action=reorder`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ taskIds, status }),
        }
      );
      
      if (!response.ok) throw new Error('Failed to reorder');
      return response.json();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-tasks'] });
    },
  });
}
