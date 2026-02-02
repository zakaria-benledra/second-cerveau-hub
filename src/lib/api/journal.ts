import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type JournalEntry = Tables<'journal_entries'>;
export type JournalEntryInsert = TablesInsert<'journal_entries'>;
export type Note = Tables<'notes'>;
export type NoteInsert = TablesInsert<'notes'>;

// Journal Entries
export async function fetchJournalEntries() {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .order('date', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getTodayJournalEntry() {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('date', today)
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

export async function saveJournalEntry(
  entry: Omit<JournalEntryInsert, 'user_id'>, 
  targetDate?: string
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Use provided date or today by default
  const entryDate = targetDate || new Date().toISOString().split('T')[0];
  
  // Validate that date is not in the future
  const today = new Date().toISOString().split('T')[0];
  if (entryDate > today) {
    throw new Error('Impossible d\'écrire dans le futur');
  }
  
  // Check if entry exists for this date
  const { data: existing } = await supabase
    .from('journal_entries')
    .select('id')
    .eq('date', entryDate)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from('journal_entries')
      .update(entry)
      .eq('id', existing.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } else {
    // Create new
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({ ...entry, user_id: user.id, date: entryDate })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

// New function to get entry by specific date
export async function getJournalEntryByDate(date: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('date', date)
    .eq('user_id', user.id)
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

// Notes
export async function fetchNotes() {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('updated_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function createNote(note: Omit<NoteInsert, 'user_id'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('notes')
    .insert({ ...note, user_id: user.id })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateNote(id: string, updates: Partial<Note>) {
  const { data, error } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteNote(id: string) {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}
