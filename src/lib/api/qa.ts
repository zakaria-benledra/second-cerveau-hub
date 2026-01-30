import { supabase } from '@/integrations/supabase/client';

export interface QATestStatus {
  id: string;
  feature_name: string;
  module: string;
  ui_entry: string;
  expected_action: string;
  expected_result: string;
  verify_screen: string;
  status: 'not_tested' | 'partial' | 'verified' | 'failed';
  last_tested_at: string | null;
  tested_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface SystemEvent {
  id: string;
  user_id: string;
  event_type: string;
  entity: string;
  entity_id: string | null;
  payload: Record<string, unknown>;
  source: string;
  processed: boolean;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  entity: string;
  entity_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
}

export async function fetchQATestStatus(): Promise<QATestStatus[]> {
  const { data, error } = await supabase
    .from('qa_test_status')
    .select('*')
    .order('module', { ascending: true });

  if (error) throw error;
  return (data || []) as QATestStatus[];
}

export async function updateQATestStatus(
  id: string,
  status: QATestStatus['status'],
  notes?: string
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  
  const { error } = await supabase
    .from('qa_test_status')
    .update({
      status,
      notes,
      last_tested_at: new Date().toISOString(),
      tested_by: userData.user?.id
    })
    .eq('id', id);

  if (error) throw error;
}

export async function fetchSystemEvents(limit: number = 100): Promise<SystemEvent[]> {
  const { data, error } = await supabase
    .from('system_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as SystemEvent[];
}

export async function fetchAuditLog(limit: number = 100): Promise<AuditLogEntry[]> {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as AuditLogEntry[];
}

export async function computeTodayScore(): Promise<any> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  const today = new Date().toISOString().split('T')[0];
  
  const response = await supabase.functions.invoke('compute-scores', {
    body: {
      user_id: userData.user.id,
      date: today
    }
  });

  if (response.error) throw response.error;
  return response.data;
}
