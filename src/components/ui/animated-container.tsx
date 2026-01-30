import { ReactNode, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedContainerProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  animation?: 'fade-up' | 'scale-in' | 'slide-left' | 'slide-right' | 'fade';
}

export function AnimatedContainer({
  children,
  delay = 0,
  className,
  animation = 'fade-up',
}: AnimatedContainerProps) {
  const [isVisible, setIsVisible] = useState(delay === 0);

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setIsVisible(true), delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  const animationClasses = {
    'fade-up': 'animate-slide-in-from-bottom',
    'scale-in': 'animate-scale-in',
    'slide-left': 'animate-slide-in-from-right',
    'slide-right': 'animate-slide-in-from-left',
    'fade': 'animate-fade-in',
  };

  return (
    <div
      className={cn(
        'transition-all duration-300',
        isVisible ? animationClasses[animation] : 'opacity-0 translate-y-2',
        className
      )}
    >
      {children}
    </div>
  );
}

interface StaggeredListProps {
  children: ReactNode[];
  baseDelay?: number;
  staggerDelay?: number;
  className?: string;
}

export function StaggeredList({
  children,
  baseDelay = 0,
  staggerDelay = 50,
  className,
}: StaggeredListProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <AnimatedContainer
          key={index}
          delay={baseDelay + index * staggerDelay}
          animation="fade-up"
        >
          {child}
        </AnimatedContainer>
      ))}
    </div>
  );
}
