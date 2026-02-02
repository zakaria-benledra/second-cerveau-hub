import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  fetchJournalEntries,
  getTodayJournalEntry,
  getJournalEntryByDate,
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

// New hook to get entry by specific date
export function useJournalEntryByDate(date: string | null) {
  return useQuery({
    queryKey: ['journalEntry', date],
    queryFn: () => date ? getJournalEntryByDate(date) : null,
    enabled: !!date,
  });
}

export function useSaveJournalEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ entry, targetDate }: { 
      entry: Parameters<typeof saveJournalEntry>[0]; 
      targetDate?: string 
    }) => saveJournalEntry(entry, targetDate),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['journalEntry'] });
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
      const dateLabel = variables.targetDate 
        ? `pour le ${format(new Date(variables.targetDate), 'd MMMM', { locale: fr })}` 
        : '';
      toast({ title: `Journal sauvegardé ${dateLabel}`.trim() });
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
