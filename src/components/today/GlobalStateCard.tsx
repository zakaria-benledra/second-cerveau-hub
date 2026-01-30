import { ScoreRing } from './ScoreRing';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Activity, 
  Brain, 
  Wallet, 
  Flame,
  TrendingUp,
  TrendingDown,
  Minus,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlobalStateCardProps {
  disciplineScore: number;
  energyLevel: 'low' | 'medium' | 'high';
  financialStress: number;
  cognitiveLoad: number;
  momentum?: 'up' | 'down' | 'stable';
  onScoreClick?: () => void;
}

function getEnergyConfig(level: 'low' | 'medium' | 'high') {
  switch (level) {
    case 'high':
      return { color: 'text-success', bg: 'bg-success/10', label: 'Haute', value: 85 };
    case 'medium':
      return { color: 'text-warning', bg: 'bg-warning/10', label: 'Moyenne', value: 55 };
    case 'low':
      return { color: 'text-destructive', bg: 'bg-destructive/10', label: 'Basse', value: 25 };
  }
}

function getMomentumIcon(momentum?: 'up' | 'down' | 'stable') {
  switch (momentum) {
    case 'up':
      return <TrendingUp className="h-4 w-4 text-success" />;
    case 'down':
      return <TrendingDown className="h-4 w-4 text-destructive" />;
    default:
      return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
}

export function GlobalStateCard({
  disciplineScore,
  energyLevel,
  financialStress,
  cognitiveLoad,
  momentum,
  onScoreClick,
}: GlobalStateCardProps) {
  const energyConfig = getEnergyConfig(energyLevel);

  const stateIndicators = [
    {
      icon: Activity,
      label: 'Énergie',
      value: energyConfig.label,
      color: energyConfig.color,
      bg: energyConfig.bg,
      tooltip: 'Niveau d\'énergie basé sur l\'heure et vos habitudes',
      score: energyConfig.value,
    },
    {
      icon: Wallet,
      label: 'Stress Finance',
      value: `${financialStress}%`,
      color: financialStress > 60 ? 'text-destructive' : financialStress > 30 ? 'text-warning' : 'text-success',
      bg: financialStress > 60 ? 'bg-destructive/10' : financialStress > 30 ? 'bg-warning/10' : 'bg-success/10',
      tooltip: 'Indice de stress financier (budget vs dépenses)',
      score: 100 - financialStress,
    },
    {
      icon: Brain,
      label: 'Charge Cognitive',
      value: `${cognitiveLoad}%`,
      color: cognitiveLoad > 80 ? 'text-destructive' : cognitiveLoad > 50 ? 'text-warning' : 'text-success',
      bg: cognitiveLoad > 80 ? 'bg-destructive/10' : cognitiveLoad > 50 ? 'bg-warning/10' : 'bg-success/10',
      tooltip: 'Charge de travail estimée pour aujourd\'hui',
      score: 100 - cognitiveLoad,
    },
  ];

  return (
    <Card className="glass-strong border-primary/20 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* Main Score */}
          <div className="flex flex-col items-center">
            <ScoreRing
              value={disciplineScore}
              size="xl"
              label="Discipline"
              onClick={onScoreClick}
            />
            <div className="flex items-center gap-1 mt-2">
              {getMomentumIcon(momentum)}
              <span className="text-xs text-muted-foreground">
                {momentum === 'up' ? 'En progression' : momentum === 'down' ? 'En baisse' : 'Stable'}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px h-32 bg-gradient-to-b from-transparent via-border to-transparent" />
          <div className="lg:hidden w-32 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {/* State Indicators */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            {stateIndicators.map((indicator) => (
              <Tooltip key={indicator.label}>
                <TooltipTrigger asChild>
                  <div 
                    className={cn(
                      'glass-hover rounded-xl p-4 cursor-pointer group',
                      'hover:shadow-lg transition-all duration-300'
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={cn('p-2 rounded-lg', indicator.bg)}>
                        <indicator.icon className={cn('h-4 w-4', indicator.color)} />
                      </div>
                      <Info className="h-3 w-3 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                    </div>
                    <p className={cn('text-xl font-bold', indicator.color)}>
                      {indicator.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {indicator.label}
                    </p>
                    {/* Mini progress bar */}
                    <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          indicator.score >= 70 ? 'bg-success' : indicator.score >= 40 ? 'bg-warning' : 'bg-destructive'
                        )}
                        style={{ width: `${indicator.score}%` }}
                      />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px]">
                  <p className="text-xs">{indicator.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
