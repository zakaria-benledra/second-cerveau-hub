import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakBadgeProps {
  days: number;
  className?: string;
}

export function StreakBadge({ days, className }: StreakBadgeProps) {
  const [animate, setAnimate] = useState(false);
  
  // Animation quand le streak change
  useEffect(() => {
    if (days > 0) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [days]);

  if (days === 0) return null;

  const getStreakColor = () => {
    if (days >= 30) return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
    if (days >= 14) return 'bg-gradient-to-r from-orange-500 to-red-500 text-white';
    if (days >= 7) return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white';
    return 'bg-primary/15 text-primary';
  };

  const getStreakMessage = () => {
    if (days >= 30) return `🏆 ${days} jours ! Tu es légendaire !`;
    if (days >= 14) return `🔥 ${days} jours ! Tu es en feu !`;
    if (days >= 7) return `💪 ${days} jours ! Belle série !`;
    if (days >= 3) return `✨ ${days} jours de suite !`;
    return `${days} jour${days > 1 ? 's' : ''} de streak`;
  };

  return (
    <Tooltip>
      <TooltipTrigger>
        <Badge 
          className={cn(
            'gap-1 transition-all duration-300',
            getStreakColor(),
            animate && 'scale-110',
            className
          )}
        >
          <Flame className={cn(
            "h-3 w-3",
            days >= 7 && "animate-pulse"
          )} />
          {days}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>{getStreakMessage()}</p>
      </TooltipContent>
    </Tooltip>
  );
}
