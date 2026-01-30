import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SavingsGoal {
  id: string;
  user_id: string;
  workspace_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  category_id: string | null;
  allocation_type: 'fixed' | 'percentage' | 'round_up';
  allocation_value: number;
  color: string | null;
  icon: string | null;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  created_at: string;
  updated_at: string;
  // Computed
  progress?: number;
  remaining?: number;
}

export interface CreateSavingsGoalInput {
  name: string;
  target_amount: number;
  target_date?: string;
  category_id?: string;
  allocation_type?: 'fixed' | 'percentage' | 'round_up';
  allocation_value?: number;
  color?: string;
  icon?: string;
}

// Fetch all savings goals with progress calculation
export function useSavingsGoals() {
  return useQuery({
    queryKey: ['savingsGoals'],
    queryFn: async (): Promise<SavingsGoal[]> => {
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map DB fields to our interface (handle schema differences)
      return (data || []).map((goal: Record<string, unknown>) => {
        const targetAmount = Number(goal.target_amount || 0);
        const currentAmount = Number(goal.current_amount || 0);
        
        return {
          id: goal.id as string,
          user_id: goal.user_id as string,
          workspace_id: goal.workspace_id as string,
          name: goal.name as string,
          target_amount: targetAmount,
          current_amount: currentAmount,
          target_date: (goal.target_date || goal.deadline || null) as string | null,
          category_id: (goal.category_id || null) as string | null,
          allocation_type: (goal.allocation_type || 'fixed') as SavingsGoal['allocation_type'],
          allocation_value: Number(goal.allocation_value || 0),
          color: (goal.color || null) as string | null,
          icon: (goal.icon || null) as string | null,
          status: (goal.status || 'active') as SavingsGoal['status'],
          created_at: goal.created_at as string,
          updated_at: goal.updated_at as string,
          progress: targetAmount > 0 
            ? Math.min(100, (currentAmount / targetAmount) * 100)
            : 0,
          remaining: Math.max(0, targetAmount - currentAmount),
        };
      });
    },
  });
}

// Create savings goal
export function useCreateSavingsGoal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateSavingsGoalInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get workspace
      const { data: membership } = await supabase
        .from('memberships')
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      const { data, error } = await supabase
        .from('savings_goals')
        .insert({
          user_id: user.id,
          workspace_id: membership?.workspace_id,
          name: input.name,
          target_amount: input.target_amount,
          target_date: input.target_date || null,
          category_id: input.category_id || null,
          allocation_type: input.allocation_type || 'fixed',
          allocation_value: input.allocation_value || 0,
          color: input.color,
          icon: input.icon,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
      toast({ title: 'Objectif créé', description: 'Votre objectif d\'épargne a été ajouté.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });
}

// Update savings goal (contribute)
export function useUpdateSavingsGoal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SavingsGoal> }) => {
      const { data, error } = await supabase
        .from('savings_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });
}

// Contribute to savings goal
export function useContributeToGoal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ goalId, amount }: { goalId: string; amount: number }) => {
      // Get current goal
      const { data: goal, error: fetchError } = await supabase
        .from('savings_goals')
        .select('current_amount, target_amount')
        .eq('id', goalId)
        .single();

      if (fetchError) throw fetchError;

      const newAmount = Number(goal.current_amount) + amount;
      const isCompleted = newAmount >= Number(goal.target_amount);

      const { data, error } = await supabase
        .from('savings_goals')
        .update({ 
          current_amount: newAmount,
          status: isCompleted ? 'completed' : 'active'
        })
        .eq('id', goalId)
        .select()
        .single();

      if (error) throw error;
      return { ...data, isCompleted };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
      if (data.isCompleted) {
        toast({ 
          title: '🎉 Objectif atteint !', 
          description: `Félicitations, vous avez atteint votre objectif "${data.name}"!` 
        });
      } else {
        toast({ title: 'Contribution ajoutée' });
      }
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });
}

// Delete savings goal
export function useDeleteSavingsGoal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
      toast({ title: 'Objectif supprimé' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });
}
