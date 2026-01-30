import { supabase } from '@/integrations/supabase/client';

export interface InboxItem {
  id: string;
  user_id: string;
  source: 'email' | 'note' | 'capture' | 'agent' | 'calendar';
  title: string;
  content: string | null;
  status: 'new' | 'processed' | 'archived';
  converted_task_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateInboxInput {
  title: string;
  content?: string;
  source?: InboxItem['source'];
}

// Fetch inbox items
export async function fetchInboxItems(): Promise<InboxItem[]> {
  const { data, error } = await supabase
    .from('inbox_items')
    .select('*')
    .neq('status', 'archived')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as InboxItem[];
}

// Create inbox item (capture)
export async function createInboxItem(input: CreateInboxInput): Promise<InboxItem> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('inbox_items')
    .insert({
      user_id: user.id,
      title: input.title,
      content: input.content,
      source: input.source || 'capture',
    })
    .select()
    .single();

  if (error) throw error;
  return data as InboxItem;
}

// Convert inbox item to task
export async function convertInboxToTask(inboxId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get inbox item
  const { data: inboxItem, error: fetchError } = await supabase
    .from('inbox_items')
    .select('*')
    .eq('id', inboxId)
    .single();

  if (fetchError) throw fetchError;

  // Create task
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      title: inboxItem.title,
      description: inboxItem.content,
      priority: 'medium',
    })
    .select()
    .single();

  if (taskError) throw taskError;

  // Update inbox item
  const { error: updateError } = await supabase
    .from('inbox_items')
    .update({
      status: 'processed',
      converted_task_id: task.id,
    })
    .eq('id', inboxId);

  if (updateError) throw updateError;
}

// Archive inbox item
export async function archiveInboxItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('inbox_items')
    .update({ status: 'archived' })
    .eq('id', id);

  if (error) throw error;
}

// Delete inbox item
export async function deleteInboxItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('inbox_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
