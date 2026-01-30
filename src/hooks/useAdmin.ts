import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  fetchMetricRegistry,
  fetchUsageLedger,
  getTotalUsage,
  fetchAIMetrics,
  fetchSystemHealth,
  getAdminDashboardStats,
} from '@/lib/api/admin';

export function useMetricRegistry() {
  return useQuery({
    queryKey: ['metricRegistry'],
    queryFn: fetchMetricRegistry,
  });
}

export function useUsageLedger(days = 30) {
  return useQuery({
    queryKey: ['usageLedger', days],
    queryFn: () => fetchUsageLedger(days),
  });
}

export function useTotalUsage() {
  return useQuery({
    queryKey: ['totalUsage'],
    queryFn: getTotalUsage,
  });
}

export function useAIMetrics(days = 7) {
  return useQuery({
    queryKey: ['aiMetrics', days],
    queryFn: () => fetchAIMetrics(days),
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ['systemHealth'],
    queryFn: fetchSystemHealth,
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: ['adminStats'],
    queryFn: getAdminDashboardStats,
  });
}

export function useJobRuns(jobName?: string, limit = 20) {
  return useQuery({
    queryKey: ['jobRuns', jobName, limit],
    queryFn: async () => {
      let query = supabase
        .from('job_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (jobName) {
        query = query.eq('job_name', jobName);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useAuditLogStats() {
  return useQuery({
    queryKey: ['auditLogStats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('audit_log')
        .select('action, entity')
        .gte('created_at', weekAgo.toISOString());

      if (error) throw error;

      // Count by action type
      const actionCounts = data.reduce((acc: Record<string, number>, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {});

      // Count by entity
      const entityCounts = data.reduce((acc: Record<string, number>, log) => {
        acc[log.entity] = (acc[log.entity] || 0) + 1;
        return acc;
      }, {});

      return {
        total: data.length,
        byAction: actionCounts,
        byEntity: entityCounts,
      };
    },
  });
}
