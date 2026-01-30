import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPendingActions,
  fetchActionHistory,
  proposeAction,
  approveAction,
  rejectAction,
  revertAction,
  fetchAuditLog,
  type ProposedAction,
} from '@/lib/api/agent';
import { useToast } from '@/hooks/use-toast';

export function usePendingActions() {
  return useQuery({
    queryKey: ['agentActions', 'pending'],
    queryFn: fetchPendingActions,
  });
}

export function useActionHistory() {
  return useQuery({
    queryKey: ['agentActions', 'history'],
    queryFn: fetchActionHistory,
  });
}

export function useProposeAction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: proposeAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentActions'] });
      toast({ title: 'Action proposée', description: "En attente d'approbation" });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });
}

export function useApproveAction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: approveAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentActions'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast({ title: 'Action exécutée ✓', description: 'Vous pouvez annuler si nécessaire' });
    },
    onError: (error: Error) => {
      toast({ title: 'Échec', description: error.message, variant: 'destructive' });
    },
  });
}

export function useRejectAction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: rejectAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentActions'] });
      toast({ title: 'Action rejetée' });
    },
  });
}

export function useRevertAction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: revertAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentActions'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast({ title: 'Action annulée', description: 'Retour à l\'état précédent' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });
}

export function useAuditLog(limit = 100) {
  return useQuery({
    queryKey: ['auditLog', limit],
    queryFn: () => fetchAuditLog(limit),
  });
}
