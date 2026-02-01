import { cn } from '@/lib/utils';
import { Brain, Sparkles } from 'lucide-react';

interface SageAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  mood?: 'neutral' | 'happy' | 'thinking' | 'celebrating';
  animate?: boolean;
  className?: string;
}

export function SageAvatar({ 
  size = 'md', 
  mood = 'neutral',
  animate = true,
  className 
}: SageAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };
  
  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const moodColors = {
    neutral: 'from-primary to-primary/70',
    happy: 'from-success to-success/70',
    thinking: 'from-info to-info/70',
    celebrating: 'from-warning to-warning/70',
  };

  return (
    <div className={cn('relative', className)}>
      <div 
        className={cn(
          'rounded-full bg-gradient-to-br flex items-center justify-center',
          sizeClasses[size],
          moodColors[mood],
          animate && 'animate-pulse-subtle'
        )}
      >
        <Brain className={cn(iconSizes[size], 'text-primary-foreground')} />
      </div>
      {mood === 'celebrating' && (
        <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-warning animate-bounce" />
      )}
      
      {/* Cercle de "respiration" */}
      {animate && (
        <div 
          className={cn(
            'absolute inset-0 rounded-full bg-gradient-to-br opacity-30 animate-ping-slow',
            moodColors[mood]
          )}
        />
      )}
    </div>
  );
}
