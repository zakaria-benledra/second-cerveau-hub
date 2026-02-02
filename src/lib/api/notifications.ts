import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type Notification = Tables<'notifications'>;
export type NotificationInsert = TablesInsert<'notifications'>;

export async function fetchNotifications(unreadOnly = false) {
  let query = supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  
  if (unreadOnly) {
    query = query.eq('read', false);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchUnreadCount() {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('id')
      .eq('read', false);
    
    if (error) {
      console.warn('Notifications count error:', error.message);
      return 0;
    }
    
    return data?.length || 0;
  } catch (err) {
    console.warn('Failed to fetch notification count');
    return 0;
  }
}

export async function markAsRead(id: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id);
  
  if (error) throw error;
}

export async function markAllAsRead() {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('read', false);
  
  if (error) throw error;
}

export async function createNotification(notification: Omit<NotificationInsert, 'user_id'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('notifications')
    .insert({ ...notification, user_id: user.id })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
