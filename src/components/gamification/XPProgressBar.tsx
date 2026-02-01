import { useGamificationProfile } from '@/hooks/useGamification';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface XPProgressBarProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export function XPProgressBar({ variant = 'compact', className }: XPProgressBarProps) {
  const { data: profile } = useGamificationProfile();

  if (!profile) return null;

  const currentLevelXP = profile.current_level * profile.current_level * 50;
  const nextLevelXP = profile.xp_to_next_level;
  const progressInLevel = profile.total_xp - currentLevelXP;
  const xpNeededForLevel = nextLevelXP - currentLevelXP;
  const progressPercent = Math.min(100, (progressInLevel / xpNeededForLevel) * 100);

  if (variant === 'compact') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-2 cursor-pointer", className)}>
            <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
              <Star className="h-3 w-3 text-primary fill-primary" />
              <span className="text-xs font-semibold">{profile.current_level}</span>
            </Badge>
            <div className="w-20">
              <Progress value={progressPercent} className="h-2" />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">{profile.total_xp} XP total</p>
          <p className="text-xs text-muted-foreground">
            {nextLevelXP - profile.total_xp} XP pour niveau {profile.current_level + 1}
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Variant full
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-lg">
            <Star className="h-5 w-5 text-primary-foreground fill-primary-foreground" />
          </div>
          <div>
            <p className="font-bold text-lg">Niveau {profile.current_level}</p>
            <p className="text-sm text-muted-foreground">{profile.total_xp} XP total</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Zap className="h-4 w-4 text-primary" />
          <span>{nextLevelXP - profile.total_xp} XP restants</span>
        </div>
      </div>
      
      <Progress value={progressPercent} className="h-3" />
      
      <p className="text-xs text-muted-foreground text-right">
        Niveau {profile.current_level + 1} à {nextLevelXP} XP
      </p>
    </div>
  );
}
