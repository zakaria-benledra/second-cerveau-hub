import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useRealtimeInterventions() {
  const queryClient = useQueryClient();

  const handleNewIntervention = useCallback((payload: any) => {
    // Show toast notification
    toast.info('💡 Nouvelle intervention IA', {
      description: payload.new.ai_message?.slice(0, 60) + '...',
      duration: 8000,
      action: {
        label: 'Voir',
        onClick: () => {
          window.location.href = '/dashboard';
        }
      }
    });

    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['ai-behavior-engine'] });
    queryClient.invalidateQueries({ queryKey: ['ai-interventions'] });
  }, [queryClient]);

  useEffect(() => {
    const channel = supabase
      .channel('ai-interventions-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_interventions',
        },
        handleNewIntervention
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [handleNewIntervention]);
}
