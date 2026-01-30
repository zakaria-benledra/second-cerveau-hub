import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Subscription {
  id: string;
  workspace_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export interface UsageLimits {
  id: string;
  workspace_id: string;
  ai_requests_used: number;
  ai_requests_limit: number;
  automations_used: number;
  automations_limit: number;
  team_members_used: number;
  team_members_limit: number;
  storage_used_mb: number;
  storage_limit_mb: number;
  reset_at: string;
}

export interface PlanLimits {
  plan: string;
  ai_requests_limit: number;
  automations_limit: number;
  team_members_limit: number;
  storage_limit_mb: number;
  history_days: number;
  features: Record<string, boolean>;
}

async function fetchSubscription(): Promise<Subscription | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  // Get user's workspace
  const { data: membership } = await supabase
    .from('memberships')
    .select('workspace_id')
    .eq('user_id', userData.user.id)
    .limit(1)
    .single();

  if (!membership) return null;

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('workspace_id', membership.workspace_id)
    .single();

  if (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }

  return data as Subscription;
}

async function fetchUsageLimits(): Promise<UsageLimits | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data: membership } = await supabase
    .from('memberships')
    .select('workspace_id')
    .eq('user_id', userData.user.id)
    .limit(1)
    .single();

  if (!membership) return null;

  const { data, error } = await supabase
    .from('usage_limits')
    .select('*')
    .eq('workspace_id', membership.workspace_id)
    .single();

  if (error) {
    console.error('Error fetching usage limits:', error);
    return null;
  }

  return data as UsageLimits;
}

async function fetchPlanLimits(): Promise<PlanLimits[]> {
  const { data, error } = await supabase
    .from('plan_limits')
    .select('*');

  if (error) {
    console.error('Error fetching plan limits:', error);
    return [];
  }

  return data as PlanLimits[];
}

export function useSubscription() {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: fetchSubscription,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUsageLimits() {
  return useQuery({
    queryKey: ['usage-limits'],
    queryFn: fetchUsageLimits,
    staleTime: 60 * 1000, // Refresh more frequently
  });
}

export function usePlanLimits() {
  return useQuery({
    queryKey: ['plan-limits'],
    queryFn: fetchPlanLimits,
    staleTime: 60 * 60 * 1000, // Plans don't change often
  });
}

export function useBilling() {
  const subscriptionQuery = useSubscription();
  const usageQuery = useUsageLimits();
  const plansQuery = usePlanLimits();

  const subscription = subscriptionQuery.data;
  const usage = usageQuery.data;
  const plans = plansQuery.data || [];

  const currentPlan = subscription?.plan || 'free';
  const currentPlanLimits = plans.find(p => p.plan === currentPlan);

  // Calculate usage percentages
  const aiUsagePercent = usage 
    ? (usage.ai_requests_limit === -1 ? 0 : (usage.ai_requests_used / usage.ai_requests_limit) * 100)
    : 0;

  const automationsUsagePercent = usage
    ? (usage.automations_limit === -1 ? 0 : (usage.automations_used / usage.automations_limit) * 100)
    : 0;

  const storageUsagePercent = usage
    ? (usage.storage_limit_mb === -1 ? 0 : (usage.storage_used_mb / usage.storage_limit_mb) * 100)
    : 0;

  // Check if approaching limits
  const isApproachingAILimit = aiUsagePercent >= 80;
  const isApproachingAutomationsLimit = automationsUsagePercent >= 80;
  const isAtAILimit = usage ? usage.ai_requests_used >= usage.ai_requests_limit && usage.ai_requests_limit !== -1 : false;
  const isAtAutomationsLimit = usage ? usage.automations_used >= usage.automations_limit && usage.automations_limit !== -1 : false;

  // Feature checks
  const hasFeature = (feature: string): boolean => {
    return currentPlanLimits?.features?.[feature] ?? false;
  };

  return {
    // Subscription data
    subscription,
    isLoading: subscriptionQuery.isLoading || usageQuery.isLoading,
    error: subscriptionQuery.error || usageQuery.error,
    
    // Plan info
    currentPlan,
    currentPlanLimits,
    plans,
    
    // Usage info
    usage,
    aiUsagePercent,
    automationsUsagePercent,
    storageUsagePercent,
    
    // Limit warnings
    isApproachingAILimit,
    isApproachingAutomationsLimit,
    isAtAILimit,
    isAtAutomationsLimit,
    
    // Feature checks
    hasFeature,
    canUseAICoach: hasFeature('ai_coach'),
    canUseBIDashboards: hasFeature('bi_dashboards'),
    canExportData: hasFeature('export_data'),
    
    // Status
    isSubscribed: subscription?.status === 'active' || subscription?.status === 'trialing',
    isPro: currentPlan === 'pro' || currentPlan === 'enterprise',
    isEnterprise: currentPlan === 'enterprise',
    
    // Refetch
    refetch: () => {
      subscriptionQuery.refetch();
      usageQuery.refetch();
    },
  };
}
