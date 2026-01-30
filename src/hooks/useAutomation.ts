import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAutomationRules,
  createAutomationRule,
  updateAutomationRule,
  deleteAutomationRule,
  fetchAutomationEvents,
  type AutomationRule,
  type CreateRuleInput,
} from '@/lib/api/automation';
import { useToast } from '@/hooks/use-toast';

export function useAutomationRules() {
  return useQuery({
    queryKey: ['automation', 'rules'],
    queryFn: fetchAutomationRules,
  });
}

export function useAutomationEvents(limit: number = 50) {
  return useQuery({
    queryKey: ['automation', 'events', limit],
    queryFn: () => fetchAutomationEvents(limit),
  });
}

export function useCreateAutomationRule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: CreateRuleInput) => createAutomationRule(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation'] });
      toast({
        title: 'Règle créée',
        description: 'L\'automation a été configurée avec succès.',
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

export function useUpdateAutomationRule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateRuleInput & { is_active: boolean }> }) =>
      updateAutomationRule(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation'] });
      toast({
        title: 'Règle mise à jour',
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

export function useDeleteAutomationRule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteAutomationRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation'] });
      toast({
        title: 'Règle supprimée',
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
