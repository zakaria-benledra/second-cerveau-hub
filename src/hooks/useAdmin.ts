import { useQuery } from '@tanstack/react-query';
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
  });
}

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: ['adminStats'],
    queryFn: getAdminDashboardStats,
  });
}
