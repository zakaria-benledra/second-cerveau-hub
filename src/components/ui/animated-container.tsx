import { ReactNode } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

const variants = {
  'fade-up': {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  },
  'scale-in': {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  'slide-in': {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  'slide-left': {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  'slide-right': {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  'fade': {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  'bounce-in': {
    initial: { opacity: 0, scale: 0.3 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 15,
      }
    },
    exit: { opacity: 0, scale: 0.5 },
  },
} as const;

type AnimationType = keyof typeof variants;

interface AnimatedContainerProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  animation?: AnimationType;
  duration?: number;
}

export function AnimatedContainer({
  children,
  delay = 0,
  className,
  animation = 'fade-up',
  duration = 0.3,
}: AnimatedContainerProps) {
  const selectedVariant = variants[animation];
  
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={selectedVariant as Variants}
      transition={{
        duration,
        delay: delay / 1000,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

interface StaggeredListProps {
  children: ReactNode[];
  baseDelay?: number;
  staggerDelay?: number;
  className?: string;
  animation?: AnimationType;
}

export function StaggeredList({
  children,
  baseDelay = 0,
  staggerDelay = 50,
  className,
  animation = 'fade-up',
}: StaggeredListProps) {
  return (
    <div className={className}>
      <AnimatePresence>
        {children.map((child, index) => (
          <AnimatedContainer
            key={index}
            delay={baseDelay + index * staggerDelay}
            animation={animation}
          >
            {child}
          </AnimatedContainer>
        ))}
      </AnimatePresence>
    </div>
  );
}

interface AnimatedPresenceWrapperProps {
  children: ReactNode;
  isVisible: boolean;
  animation?: AnimationType;
  className?: string;
}

export function AnimatedPresenceWrapper({
  children,
  isVisible,
  animation = 'fade-up',
  className,
}: AnimatedPresenceWrapperProps) {
  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <AnimatedContainer animation={animation} className={className}>
          {children}
        </AnimatedContainer>
      )}
    </AnimatePresence>
  );
}
