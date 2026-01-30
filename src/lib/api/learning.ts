import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type ReadingItem = Tables<'reading_items'>;
export type ReadingItemInsert = TablesInsert<'reading_items'>;
export type Flashcard = Tables<'flashcards'>;
export type FlashcardInsert = TablesInsert<'flashcards'>;
export type QuizResult = Tables<'quiz_results'>;
export type Highlight = Tables<'highlights'>;

// Reading Items
export async function fetchReadingItems() {
  const { data, error } = await supabase
    .from('reading_items')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function createReadingItem(item: Omit<ReadingItemInsert, 'user_id'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('reading_items')
    .insert({ ...item, user_id: user.id })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateReadingItem(id: string, updates: Partial<ReadingItem>) {
  const { data, error } = await supabase
    .from('reading_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteReadingItem(id: string) {
  const { error } = await supabase
    .from('reading_items')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Flashcards
export async function fetchFlashcards(deck?: string) {
  let query = supabase
    .from('flashcards')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (deck) {
    query = query.eq('deck', deck);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createFlashcard(card: Omit<FlashcardInsert, 'user_id'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('flashcards')
    .insert({ ...card, user_id: user.id })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateFlashcard(id: string, updates: Partial<Flashcard>) {
  const { data, error } = await supabase
    .from('flashcards')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteFlashcard(id: string) {
  const { error } = await supabase
    .from('flashcards')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Quiz
export async function saveQuizResult(score: number, total: number, deck?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('quiz_results')
    .insert({
      user_id: user.id,
      score,
      total,
      deck,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function fetchQuizResults() {
  const { data, error } = await supabase
    .from('quiz_results')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error) throw error;
  return data;
}
