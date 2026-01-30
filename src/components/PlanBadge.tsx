import { Badge } from '@/components/ui/badge';
import { Crown, Sparkles } from 'lucide-react';
import { usePlanGating, PlanTier } from '@/hooks/usePlanGating';

interface PlanBadgeProps {
  showIcon?: boolean;
  className?: string;
}

const planConfig: Record<PlanTier, { label: string; variant: 'default' | 'secondary' | 'outline'; icon: React.ReactNode }> = {
  free: {
    label: 'Free',
    variant: 'secondary',
    icon: null,
  },
  pro: {
    label: 'Pro',
    variant: 'default',
    icon: <Sparkles className="h-3 w-3" />,
  },
  enterprise: {
    label: 'Enterprise',
    variant: 'default',
    icon: <Crown className="h-3 w-3" />,
  },
};

export function PlanBadge({ showIcon = true, className }: PlanBadgeProps) {
  const { plan } = usePlanGating();
  const config = planConfig[plan];

  return (
    <Badge variant={config.variant} className={className}>
      {showIcon && config.icon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </Badge>
  );
}

export function UpgradePrompt({ feature }: { feature: string }) {
  return (
    <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 text-center">
      <Sparkles className="h-8 w-8 text-primary mx-auto mb-2" />
      <h3 className="font-semibold mb-1">Fonctionnalité Pro</h3>
      <p className="text-sm text-muted-foreground mb-3">
        {feature} est disponible avec le plan Pro.
      </p>
      <Badge variant="outline">Bientôt disponible</Badge>
    </div>
  );
}
