import confetti from 'canvas-confetti';

type ConfettiType = 'success' | 'streak' | 'allDone' | 'badge';

export function useConfetti() {
  const fire = (type: ConfettiType = 'success') => {
    const configs: Record<ConfettiType, confetti.Options> = {
      success: {
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#22c55e', '#16a34a', '#15803d'],
      },
      streak: {
        particleCount: 80,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#f97316', '#ea580c', '#c2410c'],
      },
      allDone: {
        particleCount: 150,
        spread: 180,
        origin: { y: 0.5 },
        startVelocity: 45,
        colors: ['#8b5cf6', '#7c3aed', '#6d28d9', '#fbbf24', '#f59e0b'],
      },
      badge: {
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#eab308', '#ca8a04', '#a16207'],
        shapes: ['star'],
      },
    };

    confetti(configs[type]);
  };

  return { fire };
}
