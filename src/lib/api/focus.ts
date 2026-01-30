import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type FocusSession = Tables<'focus_sessions'>;
export type FocusSessionInsert = TablesInsert<'focus_sessions'>;
export type FocusSessionUpdate = TablesUpdate<'focus_sessions'>;

export type TimeBlock = Tables<'time_blocks'>;
export type TimeBlockInsert = TablesInsert<'time_blocks'>;

export async function fetchTodayFocusSessions() {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('focus_sessions')
    .select('*')
    .gte('start_time', `${today}T00:00:00`)
    .lte('start_time', `${today}T23:59:59`)
    .order('start_time', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function startFocusSession(taskId?: string, type: string = 'pomodoro') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('focus_sessions')
    .insert({
      user_id: user.id,
      task_id: taskId || null,
      type,
      start_time: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function stopFocusSession(sessionId: string) {
  const endTime = new Date();
  
  // Get session start time to calculate duration
  const { data: session, error: fetchError } = await supabase
    .from('focus_sessions')
    .select('start_time')
    .eq('id', sessionId)
    .single();
  
  if (fetchError) throw fetchError;
  
  const startTime = new Date(session.start_time);
  const durationMin = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

  const { data, error } = await supabase
    .from('focus_sessions')
    .update({
      end_time: endTime.toISOString(),
      duration_min: durationMin,
    })
    .eq('id', sessionId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function fetchTimeBlocks(date?: string) {
  const targetDate = date || new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('time_blocks')
    .select('*, tasks(*)')
    .gte('start_time', `${targetDate}T00:00:00`)
    .lte('start_time', `${targetDate}T23:59:59`)
    .order('start_time', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function createTimeBlock(timeBlock: Omit<TimeBlockInsert, 'user_id'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('time_blocks')
    .insert({ ...timeBlock, user_id: user.id })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
