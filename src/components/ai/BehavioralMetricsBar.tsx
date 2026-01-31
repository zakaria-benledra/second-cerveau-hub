import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  type BehavioralMetrics, 
  METRIC_DEFINITIONS, 
  evaluateMetricLevel 
} from '@/ai';

interface BehavioralMetricsBarProps {
  metrics?: Partial<BehavioralMetrics>;
  compact?: boolean;
  className?: string;
}

const levelColors = {
  critical: 'bg-destructive/20 text-destructive border-destructive/30',
  warning: 'bg-warning/20 text-warning border-warning/30',
  good: 'bg-success/20 text-success border-success/30',
};

const levelIcons = {
  critical: TrendingDown,
  warning: Minus,
  good: TrendingUp,
};

export function BehavioralMetricsBar({ 
  metrics, 
  compact = false,
  className 
}: BehavioralMetricsBarProps) {
  if (!metrics) {
    return (
      <Card className={cn("glass-subtle", className)}>
        <CardContent className="p-4 flex items-center gap-3">
          <Brain className="h-5 w-5 text-muted-foreground animate-pulse" />
          <span className="text-sm text-muted-foreground">
            Analyse comportementale en cours...
          </span>
        </CardContent>
      </Card>
    );
  }

  const displayMetrics = METRIC_DEFINITIONS.filter(
    def => metrics[def.name] !== undefined
  ).map(def => {
    const value = metrics[def.name] ?? 0;
    const level = evaluateMetricLevel(def.name, value);
    return { ...def, value, level };
  });

  if (compact) {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {displayMetrics.map(metric => {
          const Icon = levelIcons[metric.level];
          return (
            <Badge 
              key={metric.name}
              variant="outline"
              className={cn("gap-1", levelColors[metric.level])}
            >
              <Icon className="h-3 w-3" />
              {metric.label.split(' ')[0]}: {Math.round(metric.value)}%
            </Badge>
          );
        })}
      </div>
    );
  }

  return (
    <Card className={cn("glass-subtle", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Métriques Comportementales</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {displayMetrics.map(metric => {
            const Icon = levelIcons[metric.level];
            return (
              <div 
                key={metric.name}
                className={cn(
                  "p-3 rounded-lg border",
                  levelColors[metric.level]
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium truncate">
                    {metric.label}
                  </span>
                  <Icon className="h-3 w-3 flex-shrink-0" />
                </div>
                <div className="text-lg font-bold">
                  {Math.round(metric.value)}%
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
