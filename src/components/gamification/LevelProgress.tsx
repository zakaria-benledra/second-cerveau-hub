import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Star, Zap, TrendingUp } from 'lucide-react';
import { useGamificationV2 } from '@/hooks/useGamificationV2';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function LevelProgress() {
  const { level, isLoading } = useGamificationV2();

  if (isLoading) {
    return (
      <Card className="glass overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-2 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!level) return null;

  // Level-based gradient colors using design tokens
  const getLevelStyle = (lvl: number) => {
    if (lvl >= 50) return 'from-warning to-warning/60'; // Gold
    if (lvl >= 35) return 'from-destructive to-destructive/60'; // Red/Orange
    if (lvl >= 20) return 'from-accent to-accent/60'; // Purple
    if (lvl >= 10) return 'from-primary to-primary/60'; // Blue
    if (lvl >= 5) return 'from-success to-success/60'; // Green
    return 'from-muted-foreground to-muted'; // Gray
  };

  const gradientClass = getLevelStyle(level.currentLevel);

  return (
    <Card className="glass overflow-hidden">
      {/* Level badge background decoration */}
      <div className={cn(
        "absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20",
        `bg-gradient-to-br ${gradientClass}`
      )} />
      
      <CardContent className="p-4 relative">
        <div className="flex items-center gap-4">
          {/* Level circle */}
          <div className={cn(
            "relative flex items-center justify-center w-16 h-16 rounded-full",
            `bg-gradient-to-br ${gradientClass}`
          )}>
            <span className="text-2xl font-bold text-primary-foreground">
              {level.currentLevel}
            </span>
            <Star className="absolute -top-1 -right-1 h-5 w-5 text-warning fill-warning" />
          </div>

          {/* Level info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold">Niveau {level.currentLevel}</p>
                <Badge variant="outline" className="text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  {level.totalXpEarned.toLocaleString()} XP
                </Badge>
              </div>
              <Badge variant="secondary" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                {level.currentXp} XP
              </Badge>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progression</span>
                <span>{level.xpToNextLevel} XP pour niveau {level.currentLevel + 1}</span>
              </div>
              <Progress value={level.progressPercent} className="h-2" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
