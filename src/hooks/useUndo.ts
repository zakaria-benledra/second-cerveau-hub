import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface UndoRecord {
  id: string;
  action_id: string | null;
  entity: string;
  entity_id: string;
  operation: string;
  previous_state: Record<string, unknown> | null;
  current_state: Record<string, unknown> | null;
  is_undone: boolean;
  undone_at: string | null;
  created_at: string;
  expires_at: string | null;
}

export function useUndoStack() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['undoStack', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('undo_stack')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_undone', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as UndoRecord[];
    },
    enabled: !!user?.id,
  });
}

export function useUndoAction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { actionId?: string; undoId?: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const response = await supabase.functions.invoke('undo-action', {
        body: {
          user_id: user.id,
          action_id: params.actionId,
          undo_id: params.undoId,
        },
      });

      if (response.error) throw response.error;
      if (!response.data?.success) throw new Error(response.data?.error || 'Undo failed');

      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Action annulée: ${data.entity}`);
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['undoStack'] });
      queryClient.invalidateQueries({ queryKey: [data.entity] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useEmitEvent() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      eventType: string;
      entity?: string;
      entityId?: string;
      payload?: Record<string, unknown>;
      workspaceId?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const response = await supabase.functions.invoke('emit-event', {
        body: {
          user_id: user.id,
          workspace_id: params.workspaceId,
          event_type: params.eventType,
          entity: params.entity,
          entity_id: params.entityId,
          payload: params.payload,
          source: 'ui',
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
  });
}

export function useRecentUndos() {
  const { data: undoStack, isLoading } = useUndoStack();
  const undoAction = useUndoAction();

  return {
    recentActions: undoStack || [],
    isLoading,
    canUndo: (undoStack?.length || 0) > 0,
    undoLast: () => {
      const lastAction = undoStack?.[0];
      if (lastAction) {
        undoAction.mutate({ undoId: lastAction.id });
      }
    },
    undoById: (id: string) => {
      undoAction.mutate({ undoId: id });
    },
    undoByActionId: (actionId: string) => {
      undoAction.mutate({ actionId });
    },
    isUndoing: undoAction.isPending,
  };
}
