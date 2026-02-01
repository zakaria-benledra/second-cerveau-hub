import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  limits: {
    max_habits: number;
    max_active_tasks: number;
    max_goals: number;
    analytics_days: number;
    max_team_members?: number;
  };
}

interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  trial_end: string | null;
  subscription_plans: SubscriptionPlan;
}

export function useSubscription() {
  return useQuery({
    queryKey: ['user-subscription'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*, subscription_plans(*)')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // Si pas d'abonnement, créer un gratuit
        if (error.code === 'PGRST116') {
          await supabase
            .from('user_subscriptions')
            .insert({ user_id: user.id, plan_id: 'free', status: 'active' });
          
          const { data: newSub } = await supabase
            .from('user_subscriptions')
            .select('*, subscription_plans(*)')
            .eq('user_id', user.id)
            .single();
          
          return newSub as unknown as UserSubscription;
        }
        throw error;
      }

      return data as unknown as UserSubscription;
    },
  });
}

export function useAllPlans() {
  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly');

      if (error) throw error;
      return data as unknown as SubscriptionPlan[];
    },
  });
}

export function usePlanLimits() {
  const { data: subscription } = useSubscription();
  
  const limits = subscription?.subscription_plans?.limits || {
    max_habits: 3,
    max_active_tasks: 5,
    max_goals: 2,
    analytics_days: 7,
  };

  const isPremium = subscription?.plan_id !== 'free';
  const isTeam = subscription?.plan_id === 'team';

  const canAddHabit = (currentCount: number) => {
    if (limits.max_habits === -1) return true;
    return currentCount < limits.max_habits;
  };

  const canAddTask = (currentCount: number) => {
    if (limits.max_active_tasks === -1) return true;
    return currentCount < limits.max_active_tasks;
  };

  const canAddGoal = (currentCount: number) => {
    if (limits.max_goals === -1) return true;
    return currentCount < limits.max_goals;
  };

  return {
    limits,
    isPremium,
    isTeam,
    planId: subscription?.plan_id || 'free',
    canAddHabit,
    canAddTask,
    canAddGoal,
  };
}
