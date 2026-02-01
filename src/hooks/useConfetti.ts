import confetti from 'canvas-confetti';

type ConfettiType = 'success' | 'streak' | 'allDone' | 'badge' | 'subtle' | 'fireworks';

export function useConfetti() {
  const fire = (type: ConfettiType = 'success') => {
    const configs: Record<ConfettiType, () => void> = {
      success: () => {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#22c55e', '#16a34a', '#15803d'],
        });
      },
      streak: () => {
        confetti({
          particleCount: 80,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#f97316', '#ea580c', '#c2410c'],
        });
      },
      allDone: () => {
        // Double burst
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6, x: 0.3 },
        });
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6, x: 0.7 },
          });
        }, 150);
      },
      badge: () => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          shapes: ['star'],
          colors: ['#fbbf24', '#f59e0b', '#d97706'],
        });
      },
      subtle: () => {
        confetti({
          particleCount: 20,
          spread: 40,
          origin: { y: 0.8 },
          gravity: 0.8,
          colors: ['#a855f7', '#8b5cf6'],
        });
      },
      fireworks: () => {
        const duration = 2000;
        const end = Date.now() + duration;
        
        const interval = setInterval(() => {
          if (Date.now() > end) {
            clearInterval(interval);
            return;
          }
          
          confetti({
            particleCount: 30,
            spread: 60,
            origin: {
              x: Math.random(),
              y: Math.random() * 0.5,
            },
          });
        }, 200);
      },
    };

    configs[type]();
  };

  return { fire };
}
