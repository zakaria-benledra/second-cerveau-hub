import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type MetricRegistry = Tables<'metric_registry'>;
export type UsageLedger = Tables<'usage_ledger'>;
export type AIMetrics = Tables<'ai_metrics'>;
export type SystemHealth = Tables<'system_health'>;

// Metric Registry
export async function fetchMetricRegistry() {
  const { data, error } = await supabase
    .from('metric_registry')
    .select('*')
    .order('key', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function createMetric(metric: Omit<MetricRegistry, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('metric_registry')
    .insert(metric)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Usage Ledger
export async function fetchUsageLedger(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('usage_ledger')
    .select('*')
    .gte('day', startDate.toISOString().split('T')[0])
    .order('day', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getTotalUsage() {
  const { data, error } = await supabase
    .from('usage_ledger')
    .select('tokens_in, tokens_out, cost_estimate');
  
  if (error) throw error;

  return {
    totalTokensIn: data.reduce((sum, r) => sum + (r.tokens_in || 0), 0),
    totalTokensOut: data.reduce((sum, r) => sum + (r.tokens_out || 0), 0),
    totalCost: data.reduce((sum, r) => sum + Number(r.cost_estimate || 0), 0),
  };
}

// AI Metrics
export async function fetchAIMetrics(days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('ai_metrics')
    .select('*')
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: true });
  
  if (error) throw error;
  return data;
}

// System Health
export async function fetchSystemHealth() {
  const { data, error } = await supabase
    .from('system_health')
    .select('*')
    .order('last_check', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function updateSystemHealth(service: string, status: string, message?: string) {
  // First try to update existing
  const { data: existing } = await supabase
    .from('system_health')
    .select('id')
    .eq('service', service)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('system_health')
      .update({
        status,
        message,
        last_check: new Date().toISOString(),
      })
      .eq('id', existing.id);
    
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('system_health')
      .insert({
        service,
        status,
        message,
        last_check: new Date().toISOString(),
      });
    
    if (error) throw error;
  }
}

// Dashboard Stats (aggregated)
export async function getAdminDashboardStats() {
  const [
    { count: totalUsers },
    { count: totalTasks },
    { count: totalHabits },
    { count: totalAgentActions },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('tasks').select('*', { count: 'exact', head: true }),
    supabase.from('habits').select('*', { count: 'exact', head: true }),
    supabase.from('agent_actions').select('*', { count: 'exact', head: true }),
  ]);

  return {
    totalUsers: totalUsers || 0,
    totalTasks: totalTasks || 0,
    totalHabits: totalHabits || 0,
    totalAgentActions: totalAgentActions || 0,
  };
}
