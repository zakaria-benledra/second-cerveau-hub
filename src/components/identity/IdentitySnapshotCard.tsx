import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Brain, Flame, Wind, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IdentitySnapshotCardProps {
  globalScore: number;
  momentum: 'up' | 'down' | 'stable';
  burnout: number;
  friction: number;
  habitsScore: number;
  tasksScore: number;
}

export function IdentitySnapshotCard({ 
  globalScore, 
  momentum, 
  burnout, 
  friction,
  habitsScore,
  tasksScore
}: IdentitySnapshotCardProps) {
  const getMomentumDisplay = () => {
    if (momentum === 'up') return { icon: TrendingUp, color: 'text-success', label: '↑ En hausse' };
    if (momentum === 'down') return { icon: TrendingDown, color: 'text-destructive', label: '↓ En baisse' };
    return { icon: Minus, color: 'text-muted-foreground', label: '→ Stable' };
  };

  const getBurnoutLevel = () => {
    if (burnout > 70) return { label: 'Critique', color: 'text-destructive bg-destructive/10' };
    if (burnout > 50) return { label: 'Élevé', color: 'text-warning bg-warning/10' };
    if (burnout > 30) return { label: 'Modéré', color: 'text-info bg-info/10' };
    return { label: 'Faible', color: 'text-success bg-success/10' };
  };

  const getFrictionLevel = () => {
    if (friction > 60) return { label: 'High', color: 'text-destructive' };
    if (friction > 30) return { label: 'Med', color: 'text-warning' };
    return { label: 'Low', color: 'text-success' };
  };

  const momentumInfo = getMomentumDisplay();
  const burnoutInfo = getBurnoutLevel();
  const frictionInfo = getFrictionLevel();
  const MomentumIcon = momentumInfo.icon;

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-semibold">Qui je suis aujourd'hui</span>
          </div>
          <Badge variant="outline" className={cn("text-xs", momentumInfo.color)}>
            {momentumInfo.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Principal */}
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-muted/20"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${globalScore}, 100`}
                  className="text-primary"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{Math.round(globalScore)}</span>
                <span className="text-[10px] text-muted-foreground">Discipline</span>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-1">
            <Progress value={globalScore} className="h-2" />
          </div>
        </div>

        {/* Métriques Secondaires */}
        <div className="grid grid-cols-4 gap-3 pt-2">
          <div className="text-center space-y-1">
            <MomentumIcon className={cn("h-4 w-4 mx-auto", momentumInfo.color)} />
            <p className="text-xs text-muted-foreground">Momentum</p>
          </div>
          
          <div className="text-center space-y-1">
            <Flame className={cn("h-4 w-4 mx-auto", burnoutInfo.color.split(' ')[0])} />
            <p className="text-sm font-medium">{burnout}%</p>
            <p className="text-xs text-muted-foreground">Burnout</p>
          </div>
          
          <div className="text-center space-y-1">
            <Wind className={cn("h-4 w-4 mx-auto", frictionInfo.color)} />
            <p className="text-sm font-medium">{frictionInfo.label}</p>
            <p className="text-xs text-muted-foreground">Friction</p>
          </div>
          
          <div className="text-center space-y-1">
            <Zap className="h-4 w-4 mx-auto text-primary" />
            <p className="text-sm font-medium">{Math.round(habitsScore)}%</p>
            <p className="text-xs text-muted-foreground">Habitudes</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
