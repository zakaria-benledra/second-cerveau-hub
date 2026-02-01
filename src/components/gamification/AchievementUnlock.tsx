import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useConfetti } from '@/hooks/useConfetti';
import { Trophy, Star, Flame, Target, Zap } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: 'trophy' | 'star' | 'flame' | 'target' | 'zap';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AchievementUnlockProps {
  achievement: Achievement | null;
  onClose: () => void;
}

const icons = {
  trophy: Trophy,
  star: Star,
  flame: Flame,
  target: Target,
  zap: Zap,
};

const rarityColors = {
  common: 'from-gray-400 to-gray-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-orange-500',
};

export function AchievementUnlock({ achievement, onClose }: AchievementUnlockProps) {
  const { fire } = useConfetti();
  
  useEffect(() => {
    if (achievement) {
      fire('badge');
    }
  }, [achievement, fire]);

  if (!achievement) return null;
  
  const Icon = icons[achievement.icon];

  return (
    <Dialog open={!!achievement} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md text-center">
        <div className="flex flex-col items-center py-6 space-y-4">
          {/* Badge animé */}
          <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${rarityColors[achievement.rarity]} flex items-center justify-center animate-bounce shadow-lg`}>
            <Icon className="h-12 w-12 text-white" />
          </div>
          
          {/* Texte */}
          <p className="text-sm text-muted-foreground uppercase tracking-widest">
            🎉 Nouveau badge !
          </p>
          
          <h2 className="text-2xl font-bold text-foreground">
            {achievement.title}
          </h2>
          
          <p className="text-muted-foreground">
            {achievement.description}
          </p>
          
          {/* Rareté */}
          <span className={`text-xs font-semibold uppercase px-3 py-1 rounded-full bg-gradient-to-r ${rarityColors[achievement.rarity]} text-white`}>
            {achievement.rarity}
          </span>
          
          <Button onClick={onClose} className="mt-4">
            Super ! 🚀
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
