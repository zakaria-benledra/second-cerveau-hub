import { supabase } from '@/integrations/supabase/client';
import type { AIRisk, AIAction } from '@/ai';

export interface DailyBriefing {
  summary: {
    date: string;
    global_score: number;
    momentum: number;
    burnout_risk: number;
  };
  tasks: {
    total: number;
    urgent: number;
    list: Array<{ id: string; title?: string; [key: string]: unknown }>;
  };
  habits: {
    total: number;
    pending: number;
    list: Array<{ id: string; name?: string; [key: string]: unknown }>;
  };
  events: {
    total: number;
    list: Array<{ id: string; title?: string; [key: string]: unknown }>;
  };
  risks: Array<AIRisk | { type: string; level: string; message: string }>;
  recommendations: Array<AIAction | { action: string; message: string; confidence: number }>;
  pending_proposals: number;
}

export interface Risk {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  recommendation: string;
  auto_action?: string;
}

export interface AIProposal {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string | null;
  proposed_actions: unknown[];
  reasoning: string | null;
  confidence_score: number | null;
  priority: string | null;
  status: string | null;
  created_at: string;
  reviewed_at: string | null;
  expires_at: string | null;
}

export interface WeeklyReview {
  period: {
    start: string;
    end: string;
  };
  scores: {
    average_global: number;
    average_habits: number;
    average_tasks: number;
    trend: string;
    daily_scores: Array<{ date: string; score: number; [key: string]: unknown }>;
  };
  achievements: {
    tasks_completed: number;
    habits_logged: number;
  };
  insights: string[];
}

async function callAICoach(action: string, payload?: Record<string, unknown>) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  const response = await supabase.functions.invoke('ai-coach', {
    body: {
      action,
      user_id: userData.user.id,
      payload
    }
  });

  if (response.error) throw response.error;
  return response.data;
}

export async function getDailyBriefing(): Promise<DailyBriefing> {
  const result = await callAICoach('daily_briefing');
  if (!result.success) throw new Error(result.error);
  return result.data;
}

export async function detectRisks(): Promise<{ risks: Risk[]; summary: { total_risks: number; critical: number; warnings: number } }> {
  const result = await callAICoach('detect_risks');
  if (!result.success) throw new Error(result.error);
  return result.data;
}

export async function generateProposal(type: string, context?: Record<string, unknown>): Promise<{ proposal: AIProposal; message: string }> {
  const result = await callAICoach('generate_proposal', { type, context });
  if (!result.success) throw new Error(result.error);
  return result.data;
}

export async function approveProposal(proposalId: string): Promise<{ action: any; message: string }> {
  const result = await callAICoach('approve_proposal', { proposal_id: proposalId });
  if (!result.success) throw new Error(result.error);
  return result.data;
}

export async function rejectProposal(proposalId: string, reason?: string): Promise<{ message: string }> {
  const result = await callAICoach('reject_proposal', { proposal_id: proposalId, reason });
  if (!result.success) throw new Error(result.error);
  return result.data;
}

export async function undoAction(actionId: string): Promise<{ message: string }> {
  const result = await callAICoach('undo_action', { action_id: actionId });
  if (!result.success) throw new Error(result.error);
  return result.data;
}

export async function getWeeklyReview(): Promise<WeeklyReview> {
  const result = await callAICoach('weekly_review');
  if (!result.success) throw new Error(result.error);
  return result.data;
}

export async function simulateEvent(eventType: string): Promise<{ event: any; notification: any; proposal: any; message: string }> {
  const result = await callAICoach('simulate_event', { event_type: eventType });
  if (!result.success) throw new Error(result.error);
  return result.data;
}

export async function fetchAIProposals(): Promise<AIProposal[]> {
  const { data, error } = await supabase
    .from('ai_proposals')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as AIProposal[];
}

export async function fetchAgentActions(): Promise<any[]> {
  const { data, error } = await supabase
    .from('agent_actions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function triggerAutomationRule(ruleId: string): Promise<any> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  const response = await supabase.functions.invoke('execute-automation', {
    body: {
      action: 'trigger_rule',
      user_id: userData.user.id,
      payload: { rule_id: ruleId }
    }
  });

  if (response.error) throw response.error;
  return response.data;
}
