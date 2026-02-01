import { ReactNode } from 'react';
import { usePlanLimits, useSubscription } from '@/hooks/useSubscription';
import { usePaywall } from './Paywall';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureGateProps {
  feature: 'unlimited_habits' | 'unlimited_tasks' | 'unlimited_goals' | 'analytics' | 'themes' | 'export';
  children: ReactNode;
  fallback?: ReactNode;
}

const featurePlanMap: Record<FeatureGateProps['feature'], string[]> = {
  unlimited_habits: ['premium', 'team'],
  unlimited_tasks: ['premium', 'team'],
  unlimited_goals: ['premium', 'team'],
  analytics: ['premium', 'team'],
  themes: ['premium', 'team'],
  export: ['premium', 'team'],
};

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const { data: subscription } = useSubscription();
  const currentPlan = subscription?.plan_id || 'free';
  
  const hasAccess = featurePlanMap[feature]?.includes(currentPlan) || false;

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return null;
}

// Composant pour bloquer avec overlay
interface FeatureLockProps {
  feature: string;
  children: ReactNode;
  className?: string;
}

export function FeatureLock({ feature, children, className }: FeatureLockProps) {
  const { isPremium } = usePlanLimits();
  const { showPaywall, PaywallComponent } = usePaywall();

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <>
      <div
        className={cn('relative cursor-pointer group', className)}
        onClick={() => showPaywall({ feature })}
      >
        <div className="opacity-50 pointer-events-none select-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium">
            <Lock className="h-4 w-4" />
            Premium
          </div>
        </div>
      </div>
      <PaywallComponent />
    </>
  );
}
