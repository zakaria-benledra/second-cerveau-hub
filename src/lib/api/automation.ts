import { supabase } from '@/integrations/supabase/client';

export interface AutomationRule {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  trigger_event: string;
  trigger_conditions: Record<string, unknown>;
  action_type: string;
  action_payload: Record<string, unknown>;
  priority: number;
  channel: string;
  is_active: boolean;
  last_triggered_at: string | null;
  trigger_count: number;
  created_at: string;
}

export interface AutomationEvent {
  id: string;
  user_id: string;
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

export interface CreateRuleInput {
  name: string;
  description?: string;
  trigger_event: string;
  trigger_conditions?: Record<string, unknown>;
  action_type: string;
  action_payload?: Record<string, unknown>;
  priority?: number;
  channel?: string;
}

// Predefined automation templates
export const AUTOMATION_TEMPLATES = [
  {
    id: 'missed-habit-task',
    name: 'Habitude manquée → Tâche',
    description: 'Crée une tâche de rattrapage quand une habitude est manquée',
    trigger_event: 'habit.missed',
    action_type: 'create_task',
  },
  {
    id: 'budget-threshold',
    name: 'Seuil budget → Notification',
    description: 'Notifie quand le budget dépasse un certain seuil',
    trigger_event: 'budget.threshold_reached',
    action_type: 'send_notification',
  },
  {
    id: 'overloaded-day',
    name: 'Journée surchargée → Suggestion IA',
    description: 'Propose un report quand trop de tâches sont planifiées',
    trigger_event: 'day.overloaded',
    action_type: 'ai_proposal',
  },
  {
    id: 'inactivity',
    name: 'Inactivité 7 jours → Ré-engagement',
    description: 'Envoie un message motivant après 7 jours sans activité',
    trigger_event: 'user.inactive_7d',
    action_type: 'send_notification',
  },
  {
    id: 'goal-achieved',
    name: 'Objectif atteint → Récompense',
    description: 'Célèbre et propose une réflexion quand un objectif est atteint',
    trigger_event: 'goal.completed',
    action_type: 'reward_prompt',
  },
];

export async function fetchAutomationRules(): Promise<AutomationRule[]> {
  const { data, error } = await supabase
    .from('automation_rules')
    .select('*')
    .order('priority', { ascending: false });

  if (error) throw error;
  return (data || []) as AutomationRule[];
}

export async function createAutomationRule(input: CreateRuleInput): Promise<AutomationRule> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  const insertData = {
    user_id: userData.user.id,
    name: input.name,
    description: input.description || null,
    trigger_event: input.trigger_event,
    trigger_conditions: JSON.stringify(input.trigger_conditions || {}),
    action_type: input.action_type,
    action_payload: JSON.stringify(input.action_payload || {}),
    priority: input.priority || 0,
    channel: input.channel || 'ui',
  };

  const { data, error } = await supabase
    .from('automation_rules')
    .insert(insertData as any)
    .select()
    .single();

  if (error) throw error;
  return data as AutomationRule;
}

export async function updateAutomationRule(
  id: string,
  input: Partial<CreateRuleInput & { is_active: boolean }>
): Promise<AutomationRule> {
  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.trigger_event !== undefined) updateData.trigger_event = input.trigger_event;
  if (input.trigger_conditions !== undefined) updateData.trigger_conditions = JSON.stringify(input.trigger_conditions);
  if (input.action_type !== undefined) updateData.action_type = input.action_type;
  if (input.action_payload !== undefined) updateData.action_payload = JSON.stringify(input.action_payload);
  if (input.priority !== undefined) updateData.priority = input.priority;
  if (input.channel !== undefined) updateData.channel = input.channel;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;

  const { data, error } = await supabase
    .from('automation_rules')
    .update(updateData as any)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as AutomationRule;
}

export async function deleteAutomationRule(id: string): Promise<void> {
  const { error } = await supabase
    .from('automation_rules')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function fetchAutomationEvents(limit: number = 50): Promise<AutomationEvent[]> {
  const { data, error } = await supabase
    .from('automation_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as AutomationEvent[];
}

// Emit a system event (to trigger automations)
export async function emitSystemEvent(
  eventType: string,
  entity: string,
  entityId: string | null,
  payload: Record<string, unknown> = {}
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;

  const insertData = {
    user_id: userData.user.id,
    event_type: eventType,
    entity,
    entity_id: entityId,
    source: 'ui' as const,
    payload: JSON.stringify(payload),
  };

  await supabase.from('system_events').insert(insertData as any);
}
