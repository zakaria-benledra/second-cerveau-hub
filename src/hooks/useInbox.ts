import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchInboxItems,
  createInboxItem,
  convertInboxToTask,
  archiveInboxItem,
  deleteInboxItem,
  type CreateInboxInput,
} from '@/lib/api/inbox';
import { useToast } from '@/hooks/use-toast';

export function useInboxItems() {
  return useQuery({
    queryKey: ['inbox'],
    queryFn: fetchInboxItems,
  });
}

export function useCreateInboxItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: CreateInboxInput) => createInboxItem(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      toast({
        title: 'Capturé',
        description: 'Élément ajouté à votre inbox.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useConvertInboxToTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (inboxId: string) => convertInboxToTask(inboxId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: 'Converti en tâche',
        description: 'L\'élément a été transformé en tâche.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useArchiveInboxItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveInboxItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
  });
}

export function useDeleteInboxItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteInboxItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      toast({
        title: 'Élément supprimé',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
