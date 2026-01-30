import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchReadingItems,
  createReadingItem,
  updateReadingItem,
  deleteReadingItem,
  fetchFlashcards,
  createFlashcard,
  deleteFlashcard,
  saveQuizResult,
  fetchQuizResults,
} from '@/lib/api/learning';
import { useToast } from '@/hooks/use-toast';

export function useReadingItems() {
  return useQuery({
    queryKey: ['readingItems'],
    queryFn: fetchReadingItems,
  });
}

export function useCreateReadingItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createReadingItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readingItems'] });
      toast({ title: 'Article ajouté', description: 'Ajouté à votre liste de lecture' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateReadingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof updateReadingItem>[1] }) =>
      updateReadingItem(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readingItems'] });
    },
  });
}

export function useDeleteReadingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteReadingItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readingItems'] });
    },
  });
}

export function useFlashcards(deck?: string) {
  return useQuery({
    queryKey: ['flashcards', deck],
    queryFn: () => fetchFlashcards(deck),
  });
}

export function useCreateFlashcard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createFlashcard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
      toast({ title: 'Flashcard créée' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteFlashcard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFlashcard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
    },
  });
}

export function useSaveQuizResult() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ score, total, deck }: { score: number; total: number; deck?: string }) =>
      saveQuizResult(score, total, deck),
    onSuccess: (_, { score, total }) => {
      queryClient.invalidateQueries({ queryKey: ['quizResults'] });
      toast({ title: 'Quiz terminé !', description: `Score: ${score}/${total}` });
    },
  });
}

export function useQuizResults() {
  return useQuery({
    queryKey: ['quizResults'],
    queryFn: fetchQuizResults,
  });
}
