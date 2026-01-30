import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchJournalEntries,
  getTodayJournalEntry,
  saveJournalEntry,
  fetchNotes,
  createNote,
  updateNote,
  deleteNote,
} from '@/lib/api/journal';
import { useToast } from '@/hooks/use-toast';

export function useJournalEntries() {
  return useQuery({
    queryKey: ['journalEntries'],
    queryFn: fetchJournalEntries,
  });
}

export function useTodayJournalEntry() {
  return useQuery({
    queryKey: ['journalEntry', 'today'],
    queryFn: getTodayJournalEntry,
  });
}

export function useSaveJournalEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: saveJournalEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntry'] });
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
      toast({ title: 'Journal sauvegardé' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });
}

export function useNotes() {
  return useQuery({
    queryKey: ['notes'],
    queryFn: fetchNotes,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast({ title: 'Note créée' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof updateNote>[1] }) =>
      updateNote(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}
