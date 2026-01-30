import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import type { Json } from '@/integrations/supabase/types';

export type AgentAction = Tables<'agent_actions'>;
export type AuditLogEntry = Tables<'audit_log'>;

export type AgentActionType = 
  | 'plan_day'
  | 'create_task'
  | 'update_task'
  | 'complete_task'
  | 'create_habit'
  | 'weekly_review'
  | 'inbox_process'
  | 'goal_decompose';

export interface ProposedAction {
  type: AgentActionType;
  payload: Record<string, unknown>;
  explanation: string;
  confidenceScore?: number;
}

// Fetch pending agent actions
export async function fetchPendingActions() {
  const { data, error } = await supabase
    .from('agent_actions')
    .select('*')
    .eq('status', 'proposed')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

// Fetch action history
export async function fetchActionHistory() {
  const { data, error } = await supabase
    .from('agent_actions')
    .select('*')
    .neq('status', 'proposed')
    .order('created_at', { ascending: false })
    .limit(50);
  
  if (error) throw error;
  return data;
}

// Create a proposed action (PROPOSE step)
export async function proposeAction(action: ProposedAction) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('agent_actions')
    .insert({
      user_id: user.id,
      type: action.type,
      proposed_payload: action.payload as Json,
      explanation: action.explanation,
      confidence_score: action.confidenceScore || 0.8,
      status: 'proposed',
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Approve and execute action (APPROVE + EXECUTE step)
export async function approveAction(actionId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get the action
  const { data: action, error: fetchError } = await supabase
    .from('agent_actions')
    .select('*')
    .eq('id', actionId)
    .single();
  
  if (fetchError) throw fetchError;
  if (!action) throw new Error('Action not found');

  // Execute the action based on type
  const payload = action.proposed_payload as Record<string, unknown>;
  let result: Json = null;

  try {
    switch (action.type) {
      case 'create_task':
        const { data: task } = await supabase
          .from('tasks')
          .insert({
            user_id: user.id,
            title: payload.title as string,
            description: payload.description as string,
            priority: payload.priority as string || 'medium',
            due_date: payload.dueDate as string,
            estimate_min: payload.estimateMin as number,
          })
          .select()
          .single();
        result = task as unknown as Json;
        break;

      case 'complete_task':
        await supabase
          .from('tasks')
          .update({ 
            status: 'done', 
            completed_at: new Date().toISOString() 
          })
          .eq('id', payload.taskId as string);
        result = { taskId: payload.taskId } as Json;
        break;

      case 'create_habit':
        const { data: habit } = await supabase
          .from('habits')
          .insert({
            user_id: user.id,
            name: payload.name as string,
            target_frequency: payload.frequency as string || 'daily',
          })
          .select()
          .single();
        result = habit as unknown as Json;
        break;

      default:
        result = payload as Json;
    }

    // Update action status
    await supabase
      .from('agent_actions')
      .update({
        status: 'executed',
        executed_at: new Date().toISOString(),
      })
      .eq('id', actionId);

    // Add to audit log
    await supabase
      .from('audit_log')
      .insert({
        user_id: user.id,
        action: 'agent_execute',
        entity: action.type,
        entity_id: actionId,
        new_value: result,
      });

    // Store undo info
    await supabase
      .from('undo_stack')
      .insert({
        user_id: user.id,
        action_id: actionId,
        revert_payload: { originalAction: action, result } as Json,
      });

    return { success: true, result };
  } catch (execError) {
    // Mark as failed
    await supabase
      .from('agent_actions')
      .update({ status: 'failed' })
      .eq('id', actionId);

    throw execError;
  }
}

// Reject action
export async function rejectAction(actionId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('agent_actions')
    .update({ status: 'rejected' })
    .eq('id', actionId);
  
  if (error) throw error;

  // Log rejection
  await supabase
    .from('audit_log')
    .insert({
      user_id: user.id,
      action: 'agent_reject',
      entity: 'agent_action',
      entity_id: actionId,
    });
}

// Revert action (UNDO step)
export async function revertAction(actionId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get undo info
  const { data: undoInfo, error: undoError } = await supabase
    .from('undo_stack')
    .select('*')
    .eq('action_id', actionId)
    .single();
  
  if (undoError) throw new Error('No undo information available');

  const revertPayload = undoInfo.revert_payload as Record<string, unknown>;
  const originalAction = revertPayload.originalAction as AgentAction;
  const result = revertPayload.result as Record<string, unknown>;

  // Revert based on action type
  switch (originalAction.type) {
    case 'create_task':
      if (result?.id) {
        await supabase.from('tasks').delete().eq('id', result.id as string);
      }
      break;

    case 'complete_task':
      const actionPayload = originalAction.proposed_payload as Record<string, unknown>;
      await supabase
        .from('tasks')
        .update({ status: 'todo', completed_at: null })
        .eq('id', actionPayload.taskId as string);
      break;

    case 'create_habit':
      if (result?.id) {
        await supabase.from('habits').delete().eq('id', result.id as string);
      }
      break;
  }

  // Update action status
  await supabase
    .from('agent_actions')
    .update({ status: 'reverted' })
    .eq('id', actionId);

  // Remove from undo stack
  await supabase
    .from('undo_stack')
    .delete()
    .eq('action_id', actionId);

  // Log revert
  await supabase
    .from('audit_log')
    .insert({
      user_id: user.id,
      action: 'agent_revert',
      entity: originalAction.type,
      entity_id: actionId,
    });
}

// Fetch audit log
export async function fetchAuditLog(limit = 100) {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data;
}
