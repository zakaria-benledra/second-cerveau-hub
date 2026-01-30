import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface SystemEvent {
  id: string;
  event_type: string;
  user_id: string;
  workspace_id: string | null;
  entity: string | null;
  entity_id: string | null;
  payload: Record<string, unknown>;
  processed: boolean;
  created_at: string;
}

interface AutomationEvent {
  id: string;
  rule_id: string | null;
  event_type: string;
  entity: string | null;
  entity_id: string | null;
  payload: Record<string, unknown>;
  result: Record<string, unknown>;
  status: string;
  processed_at: string | null;
  created_at: string;
}

interface JobRun {
  id: string;
  job_name: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  records_processed: number | null;
  records_failed: number | null;
  error_message: string | null;
  metadata: Record<string, unknown>;
}

interface SystemHealth {
  service: string;
  status: string;
  message: string | null;
  last_check: string;
}

// System Events
export function useSystemEvents(limit = 50) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['systemEvents', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('system_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as SystemEvent[];
    },
    enabled: !!user?.id,
  });
}

// Automation Events (history of rule executions)
export function useAutomationEvents(limit = 50) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['automationEvents', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('automation_events')
        .select(`
          *,
          automation_rules (
            name,
            action_type
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as (AutomationEvent & { automation_rules: { name: string; action_type: string } | null })[];
    },
    enabled: !!user?.id,
  });
}

// Job Runs (for observability)
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
      return data as JobRun[];
    },
  });
}

// System Health
export function useSystemHealth() {
  return useQuery({
    queryKey: ['systemHealth'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_health')
        .select('*')
        .order('last_check', { ascending: false });

      if (error) throw error;
      return data as SystemHealth[];
    },
    refetchInterval: 60000, // Refresh every minute
  });
}

// Trigger Automation Rule Manually
export function useTriggerAutomation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ruleId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const response = await supabase.functions.invoke('execute-automation', {
        body: {
          action: 'trigger_rule',
          user_id: user.id,
          payload: { rule_id: ruleId },
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      toast.success('Automatisation déclenchée');
      queryClient.invalidateQueries({ queryKey: ['automationEvents'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Usage Ledger for token/cost tracking
export function useUsageLedger(days = 30) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['usageLedger', user?.id, days],
    queryFn: async () => {
      if (!user?.id) return [];

      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const { data, error } = await supabase
        .from('usage_ledger')
        .select('*')
        .eq('user_id', user.id)
        .gte('day', fromDate.toISOString().split('T')[0])
        .order('day', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

// Audit Log
export function useAuditLog(entity?: string, limit = 50) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['auditLog', user?.id, entity, limit],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('audit_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (entity) {
        query = query.eq('entity', entity);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}
