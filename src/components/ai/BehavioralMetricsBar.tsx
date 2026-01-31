import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, Brain, Flame, Wind, Battery } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BehavioralMetricsBarProps {
  coherence: number;      // 0-100 - consistency_factor * 100
  momentum: number;       // 0-100 - momentum_index (50 = stable)
  friction: number;       // 0-100 - cognitive load (lower is better)
  burnout: number;        // 0-100 - burnout_index (lower is better)
  className?: string;
}

export function BehavioralMetricsBar({ 
  coherence, 
  momentum, 
  friction, 
  burnout,
  className 
}: BehavioralMetricsBarProps) {
  const getMomentumIcon = () => {
    if (momentum > 55) return <TrendingUp className="h-3 w-3" />;
    if (momentum < 45) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getLevel = (value: number, inverse = false) => {
    const v = inverse ? 100 - value : value;
    if (v >= 70) return 'text-success';
    if (v >= 40) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-3", className)}>
      {/* Cohérence */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Brain className="h-3 w-3" />
            Cohérence
          </div>
          <span className={cn("text-xs font-medium", getLevel(coherence))}>
            {Math.round(coherence)}%
          </span>
        </div>
        <Progress value={coherence} className="h-1.5" />
      </div>

      {/* Momentum */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {getMomentumIcon()}
            Momentum
          </div>
          <span className={cn("text-xs font-medium", getLevel(momentum))}>
            {momentum > 55 ? '↑' : momentum < 45 ? '↓' : '→'}
          </span>
        </div>
        <Progress value={momentum} className="h-1.5" />
      </div>

      {/* Friction */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Wind className="h-3 w-3" />
            Friction
          </div>
          <span className={cn("text-xs font-medium", getLevel(friction, true))}>
            {friction < 30 ? 'Low' : friction < 60 ? 'Med' : 'High'}
          </span>
        </div>
        <Progress value={friction} className="h-1.5" />
      </div>

      {/* Burnout */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Battery className="h-3 w-3" />
            Burnout
          </div>
          <span className={cn("text-xs font-medium", getLevel(burnout, true))}>
            {Math.round(burnout)}%
          </span>
        </div>
        <Progress value={burnout} className="h-1.5" />
      </div>
    </div>
  );
}
