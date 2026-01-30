import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Routine = Tables<'routines'>;
export type RoutineInsert = TablesInsert<'routines'>;
export type RoutineLog = Tables<'routine_logs'>;
export type RoutineLogInsert = TablesInsert<'routine_logs'>;

export async function fetchRoutines() {
  const { data, error } = await supabase
    .from('routines')
    .select('*')
    .order('type', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function createRoutine(routine: Omit<RoutineInsert, 'user_id'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('routines')
    .insert({ ...routine, user_id: user.id })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateRoutine(id: string, updates: TablesUpdate<'routines'>) {
  const { data, error } = await supabase
    .from('routines')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteRoutine(id: string) {
  const { error } = await supabase
    .from('routines')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Routine Logs
export async function fetchTodayRoutineLogs() {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('routine_logs')
    .select('*, routines(*)')
    .eq('date', today);
  
  if (error) throw error;
  return data;
}

export async function logRoutineCompletion(routineId: string, completedItems: string[]) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const today = new Date().toISOString().split('T')[0];
  
  // Check if log exists for today
  const { data: existing } = await supabase
    .from('routine_logs')
    .select('id')
    .eq('routine_id', routineId)
    .eq('date', today)
    .maybeSingle();
  
  if (existing) {
    const { data, error } = await supabase
      .from('routine_logs')
      .update({ 
        completed_items: completedItems,
        completed: completedItems.length > 0,
      })
      .eq('id', existing.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('routine_logs')
      .insert({
        user_id: user.id,
        routine_id: routineId,
        date: today,
        completed_items: completedItems,
        completed: completedItems.length > 0,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}
