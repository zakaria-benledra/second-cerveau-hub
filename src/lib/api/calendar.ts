import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type CalendarEvent = Tables<'calendar_events'>;
export type CalendarEventInsert = TablesInsert<'calendar_events'>;
export type CalendarEventUpdate = TablesUpdate<'calendar_events'>;

export async function fetchCalendarEvents(startDate?: string, endDate?: string) {
  let query = supabase
    .from('calendar_events')
    .select('*')
    .order('start_time', { ascending: true });
  
  if (startDate) {
    query = query.gte('start_time', startDate);
  }
  if (endDate) {
    query = query.lte('end_time', endDate);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchTodayEvents() {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .gte('start_time', `${today}T00:00:00`)
    .lte('start_time', `${tomorrow}T00:00:00`)
    .order('start_time', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function createCalendarEvent(event: Omit<CalendarEventInsert, 'user_id'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('calendar_events')
    .insert({ ...event, user_id: user.id })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateCalendarEvent(id: string, updates: CalendarEventUpdate) {
  const { data, error } = await supabase
    .from('calendar_events')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteCalendarEvent(id: string) {
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}
