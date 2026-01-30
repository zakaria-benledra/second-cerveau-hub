import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ReactNode } from 'react';

export type PlanTier = 'free' | 'pro' | 'enterprise';

export type FeatureName = 
  | 'ai_coach'
  | 'unlimited_automations'
  | 'bi_dashboards'
  | 'history_90d'
  | 'history_unlimited'
  | 'export_data'
  | 'team_workspace'
  | 'sso'
  | 'custom_integrations';

interface PlanFeatures {
  ai_coach: boolean;
  unlimited_automations: boolean;
  bi_dashboards: boolean;
  history_90d: boolean;
  history_unlimited: boolean;
  export_data: boolean;
  team_workspace: boolean;
  sso?: boolean;
  custom_integrations?: boolean;
  max_automations: number;
  max_team_members: number;
  history_days: number;
  ai_requests_limit: number;
}

const PLAN_FEATURES: Record<PlanTier, PlanFeatures> = {
  free: {
    ai_coach: false,
    unlimited_automations: false,
    bi_dashboards: false,
    history_90d: false,
    history_unlimited: false,
    export_data: false,
    team_workspace: false,
    max_automations: 3,
    max_team_members: 1,
    history_days: 7,
    ai_requests_limit: 100,
  },
  pro: {
    ai_coach: true,
    unlimited_automations: false,
    bi_dashboards: true,
    history_90d: true,
    history_unlimited: false,
    export_data: true,
    team_workspace: true,
    max_automations: 25,
    max_team_members: 5,
    history_days: 90,
    ai_requests_limit: 1000,
  },
  enterprise: {
    ai_coach: true,
    unlimited_automations: true,
    bi_dashboards: true,
    history_90d: true,
    history_unlimited: true,
    export_data: true,
    team_workspace: true,
    sso: true,
    custom_integrations: true,
    max_automations: -1,
    max_team_members: -1,
    history_days: -1,
    ai_requests_limit: -1,
  },
};

interface UserPlanData {
  plan: PlanTier;
  usage?: {
    ai_requests_used: number;
    ai_requests_limit: number;
    automations_used: number;
    automations_limit: number;
  };
}

async function fetchUserPlan(): Promise<UserPlanData> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { plan: 'free' };

  // Get user's workspace membership
  const { data: membership } = await supabase
    .from('memberships')
    .select('workspace_id')
    .eq('user_id', userData.user.id)
    .limit(1)
    .single();

  if (!membership) return { plan: 'free' };

  // Get subscription from new table
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('workspace_id', membership.workspace_id)
    .single();

  // Get usage limits
  const { data: usage } = await supabase
    .from('usage_limits')
    .select('ai_requests_used, ai_requests_limit, automations_used, automations_limit')
    .eq('workspace_id', membership.workspace_id)
    .single();

  const plan = (subscription?.status === 'active' || subscription?.status === 'trialing') 
    ? (subscription.plan as PlanTier) 
    : 'free';

  return {
    plan,
    usage: usage as UserPlanData['usage'],
  };
}

export function usePlanGating() {
  const planQuery = useQuery({
    queryKey: ['user-plan'],
    queryFn: fetchUserPlan,
    staleTime: 5 * 60 * 1000,
  });

  const planData = planQuery.data || { plan: 'free' as PlanTier };
  const plan = planData.plan;
  const features = PLAN_FEATURES[plan];
  const usage = planData.usage;

  const hasFeature = (feature: FeatureName): boolean => {
    return features[feature] ?? false;
  };

  const canUseAICoach = features.ai_coach;
  const canUseBIDashboards = features.bi_dashboards;
  const canExportData = features.export_data;
  const maxAutomations = features.max_automations;
  const historyDays = features.history_days;

  // Usage checks
  const isAtAILimit = usage 
    ? usage.ai_requests_used >= usage.ai_requests_limit && usage.ai_requests_limit !== -1
    : false;
  const isAtAutomationsLimit = usage
    ? usage.automations_used >= usage.automations_limit && usage.automations_limit !== -1
    : false;

  const aiUsagePercent = usage && usage.ai_requests_limit !== -1
    ? (usage.ai_requests_used / usage.ai_requests_limit) * 100
    : 0;

  return {
    plan,
    features,
    hasFeature,
    canUseAICoach,
    canUseBIDashboards,
    canExportData,
    maxAutomations,
    historyDays,
    isLoading: planQuery.isLoading,
    isPro: plan === 'pro' || plan === 'enterprise',
    isEnterprise: plan === 'enterprise',
    // Usage info
    usage,
    isAtAILimit,
    isAtAutomationsLimit,
    aiUsagePercent,
    refetch: planQuery.refetch,
  };
}

export function PlanGate({ 
  feature, 
  children, 
  fallback 
}: { 
  feature: FeatureName; 
  children: ReactNode; 
  fallback?: ReactNode;
}) {
  const { hasFeature } = usePlanGating();
  
  if (!hasFeature(feature)) {
    return fallback ? fallback : null;
  }
  
  return children;
}
