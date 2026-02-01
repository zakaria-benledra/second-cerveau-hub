import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  TrendingUp, TrendingDown, Minus, 
  Flame, Target, Zap, Shield, 
  Brain, Wallet,
  ChevronRight, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface IdentitySnapshotCardProps {
  // Scores from scores_daily
  globalScore: number;
  habitsScore: number;
  // Identity metrics
  consistencyLevel: number;
  energyLevel: 'low' | 'medium' | 'high';
  resilienceLevel: number;
  // Behavioral metrics
  financialStress: number;
  cognitiveLoad: number;
  // Momentum
  momentum: 'up' | 'down' | 'stable';
}

function getEnergyConfig(level: 'low' | 'medium' | 'high') {
  switch (level) {
    case 'high': return { color: 'text-success', bg: 'bg-success/10', label: 'Haute', value: 85 };
    case 'medium': return { color: 'text-warning', bg: 'bg-warning/10', label: 'Moyenne', value: 55 };
    case 'low': return { color: 'text-destructive', bg: 'bg-destructive/10', label: 'Basse', value: 25 };
  }
}

function getMomentumDisplay(momentum: 'up' | 'down' | 'stable') {
  switch (momentum) {
    case 'up': return { icon: TrendingUp, color: 'text-success', label: '↑ En progression' };
    case 'down': return { icon: TrendingDown, color: 'text-destructive', label: '↓ En baisse' };
    default: return { icon: Minus, color: 'text-muted-foreground', label: '→ Stable' };
  }
}

function getScoreColor(value: number) {
  if (value >= 70) return 'text-success';
  if (value >= 40) return 'text-warning';
  return 'text-destructive';
}

export function IdentitySnapshotCard({
  globalScore,
  habitsScore,
  consistencyLevel,
  energyLevel,
  resilienceLevel,
  financialStress,
  cognitiveLoad,
  momentum,
}: IdentitySnapshotCardProps) {
  const energyConfig = getEnergyConfig(energyLevel);
  const momentumInfo = getMomentumDisplay(momentum);
  const MomentumIcon = momentumInfo.icon;

  const getHumanLabel = {
    discipline: (value: number) => {
      if (value >= 80) return "Tu gères !";
      if (value >= 60) return "En forme";
      if (value >= 40) return "Peut mieux faire";
      return "Coup de pouce ?";
    },
    coherence: (value: number) => {
      if (value >= 80) return "Très régulier";
      if (value >= 60) return "Solide";
      if (value >= 40) return "Variable";
      return "À stabiliser";
    },
    energy: (value: number) => {
      if (value >= 70) return "Plein d'énergie";
      if (value >= 45) return "Ça roule";
      return "Recharge-toi";
    },
    resilience: (value: number) => {
      if (value >= 80) return "Inébranlable";
      if (value >= 60) return "Solide";
      if (value >= 40) return "Flexible";
      return "En reconstruction";
    },
  };

  const primaryMetrics = [
    {
      icon: Flame,
      label: '🔥 Discipline',
      value: globalScore,
      numericValue: globalScore,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
      historyPath: '/history?metric=discipline&range=30',
      humanLabel: getHumanLabel.discipline(globalScore),
    },
    {
      icon: Target,
      label: '🎯 Cohérence',
      value: consistencyLevel,
      numericValue: consistencyLevel,
      color: 'text-primary',
      bg: 'bg-primary/10',
      historyPath: '/history?metric=habits&range=7',
      humanLabel: getHumanLabel.coherence(consistencyLevel),
    },
    {
      icon: Zap,
      label: '⚡ Énergie',
      value: energyConfig.label,
      numericValue: energyConfig.value,
      color: energyConfig.color,
      bg: energyConfig.bg,
      historyPath: '/behavior-hub?tab=habits',
      humanLabel: getHumanLabel.energy(energyConfig.value),
    },
    {
      icon: Shield,
      label: '🛡️ Résilience',
      value: resilienceLevel,
      numericValue: resilienceLevel,
      color: 'text-accent',
      bg: 'bg-accent/10',
      historyPath: '/history?metric=resilience&range=30',
      humanLabel: getHumanLabel.resilience(resilienceLevel),
    },
  ];

  const getSecondaryHumanLabel = {
    financial: (value: number) => {
      if (value <= 30) return "Zen 💚";
      if (value <= 60) return "Vigilant";
      return "Tendu";
    },
    cognitive: (value: number) => {
      if (value <= 50) return "Dispo 🧠";
      if (value <= 80) return "Chargé";
      return "Surchargé";
    },
  };

  const secondaryMetrics = [
    {
      icon: Wallet,
      label: '💰 Finances',
      value: financialStress,
      color: financialStress > 60 ? 'text-destructive' : financialStress > 30 ? 'text-warning' : 'text-success',
      bg: financialStress > 60 ? 'bg-destructive/10' : financialStress > 30 ? 'bg-warning/10' : 'bg-success/10',
      tooltip: 'Indice de stress financier (budget vs dépenses)',
      historyPath: '/finance',
      invertedScore: true,
      humanLabel: getSecondaryHumanLabel.financial(financialStress),
    },
    {
      icon: Brain,
      label: '🧠 Charge mentale',
      value: cognitiveLoad,
      color: cognitiveLoad > 80 ? 'text-destructive' : cognitiveLoad > 50 ? 'text-warning' : 'text-success',
      bg: cognitiveLoad > 80 ? 'bg-destructive/10' : cognitiveLoad > 50 ? 'bg-warning/10' : 'bg-success/10',
      tooltip: 'Charge de travail estimée pour aujourd\'hui',
      historyPath: '/kanban',
      invertedScore: true,
      humanLabel: getSecondaryHumanLabel.cognitive(cognitiveLoad),
    },
  ];

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Mon Identité Aujourd'hui</CardTitle>
          <Badge variant="outline" className={cn("gap-1", momentumInfo.color)}>
            <MomentumIcon className="h-3 w-3" />
            {momentumInfo.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Metrics - 4 columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {primaryMetrics.map((metric) => (
            <Link
              key={metric.label}
              to={metric.historyPath}
              className="group flex flex-col gap-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className={cn("p-1.5 rounded-md", metric.bg)}>
                  <metric.icon className={cn("h-4 w-4", metric.color)} />
                </div>
                <span className="text-xs font-medium">{metric.label}</span>
              </div>

              <div className="flex flex-col">
                <span className={cn("text-2xl font-bold", getScoreColor(metric.numericValue || 0))}>
                  {typeof metric.value === 'number' ? metric.value : metric.value}
                </span>
                <span className="text-xs text-muted-foreground/80 font-medium">
                  {metric.humanLabel}
                </span>
              </div>

              <Progress
                value={typeof metric.value === 'number' ? metric.value : metric.numericValue}
                className="h-1.5"
              />
            </Link>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-border/50" />

        {/* Secondary Metrics - 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {secondaryMetrics.map((metric) => (
            <Tooltip key={metric.label}>
              <TooltipTrigger asChild>
                <Link
                  to={metric.historyPath}
                  className="group flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-md", metric.bg)}>
                      <metric.icon className={cn("h-4 w-4", metric.color)} />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{metric.label}</span>
                        <Info className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <Progress
                        value={metric.invertedScore ? 100 - metric.value : metric.value}
                        className="h-1 w-24 mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-end">
                      <span className={cn("text-lg font-semibold", metric.color)}>
                        {metric.value}
                      </span>
                      <span className="text-xs text-muted-foreground/80">
                        {metric.humanLabel}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{metric.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
