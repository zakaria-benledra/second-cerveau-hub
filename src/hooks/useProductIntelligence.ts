import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type FunnelDaily = Tables<'funnel_daily'>;
export type ChurnRiskScore = Tables<'churn_risk_scores'>;
export type UserJourneyEvent = Tables<'user_journey_events'>;

// Track product events
export function useTrackProductEvent() {
  return useMutation({
    mutationFn: async (event: {
      event_type: string;
      entity?: string;
      entity_id?: string;
      payload?: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase.functions.invoke('track-product-event', {
        body: event,
      });
      if (error) throw error;
      return data;
    },
  });
}

// Get funnel metrics for workspace
export function useFunnelMetrics(days = 30) {
  return useQuery({
    queryKey: ['funnel-metrics', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('funnel_daily')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;
      return data as FunnelDaily[];
    },
  });
}

// Get churn risk for current user
export function useMyChurnRisk() {
  return useQuery({
    queryKey: ['my-churn-risk'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('churn_risk_scores')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as ChurnRiskScore | null;
    },
  });
}

// Get all churn risks for workspace (admin)
export function useWorkspaceChurnRisks() {
  return useQuery({
    queryKey: ['workspace-churn-risks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('churn_risk_scores')
        .select('*, profiles(email, name)')
        .order('risk_score', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

// Get user journey events
export function useMyJourneyEvents(limit = 50) {
  return useQuery({
    queryKey: ['my-journey-events', limit],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_journey_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as UserJourneyEvent[];
    },
  });
}

// Aggregated funnel stats
export function useFunnelSummary(days = 7) {
  const { data: funnel } = useFunnelMetrics(days);

  if (!funnel || funnel.length === 0) {
    return {
      totalVisits: 0,
      totalSignups: 0,
      totalActivated: 0,
      avgActivationRate: 0,
      avgRetentionRate: 0,
      aiEngagementRate: 0,
      financeAdoptionRate: 0,
    };
  }

  const totalVisits = funnel.reduce((sum, f) => sum + (f.visits || 0), 0);
  const totalSignups = funnel.reduce((sum, f) => sum + (f.signups || 0), 0);
  const totalActivated = funnel.reduce((sum, f) => sum + (f.activated_users || 0), 0);
  const totalAiEngaged = funnel.reduce((sum, f) => sum + (f.ai_engaged_users || 0), 0);
  const totalFinanceConnected = funnel.reduce((sum, f) => sum + (f.finance_connected_users || 0), 0);

  return {
    totalVisits,
    totalSignups,
    totalActivated,
    avgActivationRate: totalVisits > 0 ? (totalActivated / totalVisits) * 100 : 0,
    avgRetentionRate: funnel.reduce((sum, f) => sum + Number(f.retention_rate || 0), 0) / funnel.length,
    aiEngagementRate: totalActivated > 0 ? (totalAiEngaged / totalActivated) * 100 : 0,
    financeAdoptionRate: totalActivated > 0 ? (totalFinanceConnected / totalActivated) * 100 : 0,
  };
}

// Alias for backward compatibility
export function useProductIntelligence(days = 30) {
  return useFunnelMetrics(days);
}

// Get churn risk distribution (returns array for charts)
export function useChurnDistribution() {
  return useQuery({
    queryKey: ['churn-distribution'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('churn_risk_scores')
        .select('risk_level');

      if (error) throw error;

      const distribution: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
      data?.forEach(item => {
        const level = item.risk_level as keyof typeof distribution;
        if (level in distribution) {
          distribution[level]++;
        }
      });

      return Object.entries(distribution).map(([risk_level, count]) => ({
        risk_level,
        count,
      }));
    },
  });
}

// Get churn risk distribution (object format)
export function useChurnRiskDistribution() {
  return useQuery({
    queryKey: ['churn-risk-distribution'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('churn_risk_scores')
        .select('risk_level');

      if (error) throw error;

      const distribution = { low: 0, medium: 0, high: 0, critical: 0 };
      data?.forEach(item => {
        const level = item.risk_level as keyof typeof distribution;
        if (level in distribution) {
          distribution[level]++;
        }
      });

      return distribution;
    },
  });
}

// Funnel daily data
export function useFunnelDaily(days = 30) {
  return useFunnelMetrics(days);
}

// Journey events alias
export function useJourneyEvents(days = 30) {
  return useMyJourneyEvents(100);
}

// Churn risk alias
export function useChurnRisk() {
  return useMyChurnRisk();
}
