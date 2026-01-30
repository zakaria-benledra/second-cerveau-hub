import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useMyChurnRisk } from '@/hooks/useProductIntelligence';
import { 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  Activity,
  Target,
  Flame,
  Brain,
  Wallet
} from 'lucide-react';
import { cn } from '@/lib/utils';

const RISK_CONFIG = {
  low: { color: 'text-success', bg: 'bg-success/15', label: 'Stable', icon: Shield },
  medium: { color: 'text-warning', bg: 'bg-warning/15', label: 'Attention', icon: Activity },
  high: { color: 'text-orange-500', bg: 'bg-orange-500/15', label: 'À Risque', icon: AlertTriangle },
  critical: { color: 'text-destructive', bg: 'bg-destructive/15', label: 'Critique', icon: AlertTriangle },
};

const SIGNAL_ICONS: Record<string, React.ReactNode> = {
  habit_drop: <Flame className="h-4 w-4" />,
  task_overload: <Target className="h-4 w-4" />,
  ai_rejection: <Brain className="h-4 w-4" />,
  finance_inactive: <Wallet className="h-4 w-4" />,
  low_engagement: <Activity className="h-4 w-4" />,
};

export function RiskRadar() {
  const { data: riskData, isLoading } = useMyChurnRisk();

  const config = useMemo(() => {
    if (!riskData) return RISK_CONFIG.low;
    return RISK_CONFIG[riskData.risk_level as keyof typeof RISK_CONFIG] || RISK_CONFIG.low;
  }, [riskData]);

  const riskScore = riskData?.risk_score ?? 0;
  const signals = (riskData?.signals as any) || {};

  // Parse individual signal scores
  const signalItems = useMemo(() => {
    const items: Array<{ key: string; label: string; value: number; icon: React.ReactNode }> = [];
    
    if (signals.habit_consistency_drop) {
      items.push({
        key: 'habit_drop',
        label: 'Baisse habitudes',
        value: Math.round(signals.habit_consistency_drop * 100),
        icon: SIGNAL_ICONS.habit_drop,
      });
    }
    
    if (signals.task_overload_index) {
      items.push({
        key: 'task_overload',
        label: 'Surcharge tâches',
        value: Math.round(signals.task_overload_index * 100),
        icon: SIGNAL_ICONS.task_overload,
      });
    }
    
    if (signals.ai_rejection_rate) {
      items.push({
        key: 'ai_rejection',
        label: 'Rejet IA',
        value: Math.round(signals.ai_rejection_rate * 100),
        icon: SIGNAL_ICONS.ai_rejection,
      });
    }
    
    if (signals.finance_days_inactive) {
      items.push({
        key: 'finance_inactive',
        label: 'Finance inactive',
        value: Math.min(signals.finance_days_inactive * 10, 100),
        icon: SIGNAL_ICONS.finance_inactive,
      });
    }
    
    return items.sort((a, b) => b.value - a.value);
  }, [signals]);

  if (isLoading) {
    return (
      <Card className="glass-strong">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted rounded-full mx-auto w-32" />
            <div className="h-8 bg-muted rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const IconComponent = config.icon;

  return (
    <Card className="glass-strong h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Radar de Risque
        </CardTitle>
        <CardDescription>
          Évaluation de votre engagement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Risk Gauge */}
        <div className="relative flex flex-col items-center">
          {/* Circular gauge */}
          <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={
                  riskScore <= 25 ? 'hsl(142 76% 36%)' :
                  riskScore <= 50 ? 'hsl(38 92% 50%)' :
                  riskScore <= 75 ? 'hsl(24 100% 50%)' :
                  'hsl(0 84% 60%)'
                }
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${riskScore * 2.64} 264`}
                className="transition-all duration-1000"
              />
            </svg>
            
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={cn('p-2 rounded-full', config.bg)}>
                <IconComponent className={cn('h-6 w-6', config.color)} />
              </div>
              <span className="text-2xl font-bold mt-1">{Math.round(riskScore)}%</span>
            </div>
          </div>
          
          {/* Status Badge */}
          <Badge 
            className={cn(
              'mt-4 px-4 py-1.5 text-sm font-semibold border-0',
              config.bg,
              config.color
            )}
          >
            {config.label}
          </Badge>
        </div>

        {/* Signal Breakdown */}
        {signalItems.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Signaux détectés</p>
            
            {signalItems.map((signal) => (
              <div key={signal.key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    {signal.icon}
                    {signal.label}
                  </span>
                  <span className={cn(
                    'font-mono',
                    signal.value > 50 ? 'text-destructive' : 
                    signal.value > 25 ? 'text-warning' : 'text-muted-foreground'
                  )}>
                    {signal.value}%
                  </span>
                </div>
                <Progress 
                  value={signal.value} 
                  className="h-1.5"
                />
              </div>
            ))}
          </div>
        )}

        {/* Recommendation */}
        {riskScore > 50 && (
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-warning mt-0.5" />
              <div>
                <p className="text-sm font-medium">Recommandation</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {riskScore > 75 
                    ? 'Simplifiez vos objectifs et concentrez-vous sur 1-2 habitudes clés.'
                    : 'Maintenez votre routine d\'habitudes pour stabiliser votre engagement.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {riskScore <= 25 && (
          <div className="p-3 rounded-lg bg-success/10 border border-success/20">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-success mt-0.5" />
              <div>
                <p className="text-sm font-medium">Excellent !</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Votre engagement est stable. Continuez sur cette trajectoire !
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
