import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { differenceInDays } from 'date-fns';

export interface UserPreferences {
  id: string;
  user_id: string;
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  goal_discipline: number;
  goal_financial_stability: number;
  goal_mental_balance: number;
  theme: string;
  notifications_enabled: boolean;
  sound_enabled: boolean;
}

export function useUserPreferences() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-preferences', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as UserPreferences | null;
    },
    enabled: !!user,
  });
}

export function useShouldShowOnboarding() {
  const { user } = useAuth();
  const { data: preferences, isLoading } = useUserPreferences();

  if (isLoading || !user) {
    return { shouldShow: false, isLoading: true };
  }

  // Check if user is new (created within last 7 days)
  const userCreatedAt = new Date(user.created_at);
  const isNewUser = differenceInDays(new Date(), userCreatedAt) < 7;

  // Show onboarding if: new user AND (no preferences OR not completed)
  const shouldShow = isNewUser && (!preferences || !preferences.onboarding_completed);

  return { shouldShow, isLoading: false };
}

export function useSavePreferences() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      goal_discipline: number;
      goal_financial_stability: number;
      goal_mental_balance: number;
      onboarding_completed?: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Check if preferences exist
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const payload = {
        ...data,
        user_id: user.id,
        ...(data.onboarding_completed && { onboarding_completed_at: new Date().toISOString() }),
      };

      if (existing) {
        const { error } = await supabase
          .from('user_preferences')
          .update(payload)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_preferences')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
    },
  });
}

export function useCompleteOnboarding() {
  const savePreferences = useSavePreferences();

  return useMutation({
    mutationFn: async (goals: {
      discipline: number;
      financialStability: number;
      mentalBalance: number;
    }) => {
      await savePreferences.mutateAsync({
        goal_discipline: goals.discipline,
        goal_financial_stability: goals.financialStability,
        goal_mental_balance: goals.mentalBalance,
        onboarding_completed: true,
      });
    },
  });
}
