import { useUserBadges, useAllBadges } from '@/hooks/useGamification';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

const rarityColors = {
  common: 'from-muted to-muted-foreground/30',
  rare: 'from-primary/60 to-primary',
  epic: 'from-accent to-accent-foreground/50',
  legendary: 'from-primary to-destructive',
};

const rarityBorders = {
  common: 'border-muted-foreground/30',
  rare: 'border-primary/50',
  epic: 'border-accent/50',
  legendary: 'border-primary/50 shadow-lg shadow-primary/20',
};

interface BadgesGridProps {
  showLocked?: boolean;
  category?: string;
  className?: string;
}

export function BadgesGrid({ showLocked = true, category, className }: BadgesGridProps) {
  const { data: userBadges } = useUserBadges();
  const { data: allBadges } = useAllBadges();

  const unlockedIds = new Set(userBadges?.map(b => b.badge_id) || []);

  const filteredBadges = allBadges?.filter(badge => {
    if (category && badge.category !== category) return false;
    if (!showLocked && !unlockedIds.has(badge.id)) return false;
    return true;
  }) || [];

  return (
    <div className={cn("grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3", className)}>
      {filteredBadges.map((badge) => {
        const isUnlocked = unlockedIds.has(badge.id);
        const rarity = badge.rarity as keyof typeof rarityColors;
        
        return (
          <Tooltip key={badge.id}>
            <TooltipTrigger asChild>
              <Card
                className={cn(
                  "relative cursor-pointer transition-all hover:scale-105 border-2",
                  isUnlocked ? rarityBorders[rarity] : "border-muted opacity-50 grayscale"
                )}
              >
                <CardContent className="p-3 flex items-center justify-center">
                  {isUnlocked ? (
                    <span className="text-2xl">{badge.icon}</span>
                  ) : (
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  )}
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{badge.icon}</span>
                  <span className="font-semibold">{badge.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">{badge.description}</p>
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs bg-gradient-to-r text-primary-foreground",
                      rarityColors[rarity]
                    )}
                  >
                    {badge.rarity}
                  </Badge>
                  <span className="text-xs text-primary font-medium">
                    +{badge.xp_reward} XP
                  </span>
                </div>
                {!isUnlocked && (
                  <p className="text-xs text-muted-foreground border-t pt-2 mt-2">
                    🔒 {badge.requirement_value} requis
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
