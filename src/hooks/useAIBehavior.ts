import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import type { AIIntervention as AIInterventionType, BehaviorContext, SignalType } from '@/ai';

// Type DB - compatible avec AIInterventionType de @/ai
export type AIIntervention = Tables<'ai_interventions'>;
export type BehaviorSignal = Tables<'behavior_signals'>;

interface BehaviorEngineResponse {
  success: boolean;
  intervention: AIIntervention | null;
  signals: Array<{ type: SignalType; score: number; metadata: Record<string, unknown> }>;
  context: BehaviorContext;
}

export function useAICoachEngine() {
  const queryClient = useQueryClient();

  // Fetch current intervention and behavioral context
  const engineQuery = useQuery({
    queryKey: ['ai-behavior-engine'],
    queryFn: async (): Promise<BehaviorEngineResponse> => {
      const { data, error } = await supabase.functions.invoke('ai-behavior-engine');
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,      // 5 minutes - KEEP THIS
    refetchOnWindowFocus: false,   // Don't refetch on tab switch
    refetchOnReconnect: false,     // Don't refetch on reconnect
  });

  // Respond to intervention (accept, ignore, reject)
  const respondMutation = useMutation({
    mutationFn: async ({ interventionId, action }: { interventionId: string; action: 'accepted' | 'ignored' | 'rejected' }) => {
      const { error } = await supabase
        .from('ai_interventions')
        .update({ 
          user_action: action,
          responded_at: new Date().toISOString()
        })
        .eq('id', interventionId);
      
      if (error) throw error;

      // Track in user_journey_events
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.functions.invoke('track-product-event', {
          body: {
            event_type: `ai_intervention_${action}`,
            entity: 'ai_interventions',
            entity_id: interventionId
          }
        });
      }

      return { interventionId, action };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-behavior-engine'] });
      queryClient.invalidateQueries({ queryKey: ['ai-interventions'] });
    }
  });

  // Get intervention history
  const historyQuery = useQuery({
    queryKey: ['ai-interventions-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_interventions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as AIIntervention[];
    }
  });

  // Get behavior signals
  const signalsQuery = useQuery({
    queryKey: ['behavior-signals'],
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('behavior_signals')
        .select('*')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BehaviorSignal[];
    }
  });

  return {
    // Current intervention
    intervention: engineQuery.data?.intervention || null,
    behaviorContext: engineQuery.data?.context || null,
    currentSignals: engineQuery.data?.signals || [],
    isLoading: engineQuery.isLoading,
    refetch: engineQuery.refetch,

    // Actions
    accept: (interventionId: string) => respondMutation.mutate({ interventionId, action: 'accepted' }),
    ignore: (interventionId: string) => respondMutation.mutate({ interventionId, action: 'ignored' }),
    reject: (interventionId: string) => respondMutation.mutate({ interventionId, action: 'rejected' }),
    isResponding: respondMutation.isPending,

    // History
    interventionHistory: historyQuery.data || [],
    historyLoading: historyQuery.isLoading,

    // Signals
    recentSignals: signalsQuery.data || [],
    signalsLoading: signalsQuery.isLoading,
  };
}

// Smart notifications hook
export function useAINotifications() {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ['ai-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const unreadQuery = useQuery({
    queryKey: ['ai-notifications-unread'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('ai_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('delivered', false);
      
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000,
  });

  const markDeliveredMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_notifications')
        .update({ delivered: true, read_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-notifications'] });
    }
  });

  return {
    notifications: notificationsQuery.data || [],
    unreadCount: unreadQuery.data || 0,
    isLoading: notificationsQuery.isLoading,
    markAsRead: markDeliveredMutation.mutate,
    isMarking: markDeliveredMutation.isPending,
  };
}

// Kanban metrics hook
export function useKanbanMetrics(days = 30) {
  return useQuery({
    queryKey: ['kanban-metrics', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('kanban_metrics_daily')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });
}
