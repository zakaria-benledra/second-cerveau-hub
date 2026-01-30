import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type AIIntervention = Tables<'ai_interventions'>;

export function useActiveInterventions() {
  return useQuery({
    queryKey: ['ai-interventions', 'active'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('ai_interventions')
        .select('*')
        .gte('applied_at', today)
        .is('reverted_at', null)
        .order('applied_at', { ascending: false });
      
      if (error) throw error;
      return data as AIIntervention[];
    },
    refetchInterval: 60000, // Refresh toutes les minutes
  });
}

export function useAIInterventionsHistory(days = 30) {
  return useQuery({
    queryKey: ['ai-interventions', 'history', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('ai_interventions')
        .select('*')
        .gte('applied_at', startDate.toISOString())
        .order('applied_at', { ascending: false });
      
      if (error) throw error;
      return data as AIIntervention[];
    },
  });
}

export function usePendingInterventions() {
  return useQuery({
    queryKey: ['ai-interventions', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_interventions')
        .select('*')
        .is('user_action', null)
        .is('reverted_at', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as AIIntervention[];
    },
    refetchInterval: 30000, // Refresh toutes les 30 secondes
  });
}
