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
  | 'team_workspace';

interface PlanFeatures {
  ai_coach: boolean;
  unlimited_automations: boolean;
  bi_dashboards: boolean;
  history_90d: boolean;
  history_unlimited: boolean;
  export_data: boolean;
  team_workspace: boolean;
  max_automations: number;
  max_team_members: number;
  history_days: number;
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
  },
  enterprise: {
    ai_coach: true,
    unlimited_automations: true,
    bi_dashboards: true,
    history_90d: true,
    history_unlimited: true,
    export_data: true,
    team_workspace: true,
    max_automations: -1,
    max_team_members: -1,
    history_days: -1,
  },
};

async function fetchUserPlan(): Promise<PlanTier> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return 'free';

  const { data: membership } = await supabase
    .from('memberships')
    .select('workspace_id, workspaces(plan)')
    .eq('user_id', userData.user.id)
    .limit(1)
    .single();

  if (membership?.workspaces) {
    const workspace = membership.workspaces as { plan?: string };
    return (workspace.plan as PlanTier) || 'free';
  }

  return 'free';
}

export function usePlanGating() {
  const planQuery = useQuery({
    queryKey: ['user-plan'],
    queryFn: fetchUserPlan,
    staleTime: 5 * 60 * 1000,
  });

  const plan = planQuery.data || 'free';
  const features = PLAN_FEATURES[plan];

  const hasFeature = (feature: FeatureName): boolean => {
    return features[feature] ?? false;
  };

  const canUseAICoach = features.ai_coach;
  const canUseBIDashboards = features.bi_dashboards;
  const canExportData = features.export_data;
  const maxAutomations = features.max_automations;
  const historyDays = features.history_days;

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
