import { useCallback } from 'react';
import { useConfetti } from '@/hooks/useConfetti';
import { useSound } from '@/hooks/useSound';
import { useHaptic } from '@/hooks/useHaptic';
import { useToast } from '@/hooks/use-toast';
import { useFirstName } from '@/hooks/useUserProfile';
import { useAnalytics } from '@/hooks/useAnalytics';

type CelebrationType = 
  | 'task_complete'
  | 'habit_complete'
  | 'all_tasks_done'
  | 'all_habits_done'
  | 'streak_milestone'
  | 'goal_reached'
  | 'journal_entry';

interface CelebrationMessages {
  title: string;
  description: string;
}

export function useCelebration() {
  const { fire: fireConfetti } = useConfetti();
  const { play } = useSound();
  const { vibrate } = useHaptic();
  const { toast } = useToast();
  const firstName = useFirstName() || 'Champion';
  const { trackAction } = useAnalytics();

  const celebrate = useCallback((type: CelebrationType, customMessage?: string) => {
    const messages: Record<CelebrationType, CelebrationMessages> = {
      task_complete: {
        title: 'Bien joué ! ✅',
        description: customMessage || 'Une tâche de moins !',
      },
      habit_complete: {
        title: 'Habitude validée ! 💪',
        description: customMessage || 'Tu renforces ta discipline.',
      },
      all_tasks_done: {
        title: `Bravo ${firstName} ! 🎉`,
        description: 'Toutes tes tâches sont terminées !',
      },
      all_habits_done: {
        title: 'Journée parfaite ! 🌟',
        description: 'Toutes tes habitudes sont faites !',
      },
      streak_milestone: {
        title: 'Milestone ! 🔥',
        description: customMessage || 'Tu es sur une belle série !',
      },
      goal_reached: {
        title: 'Objectif atteint ! 🏆',
        description: customMessage || 'Tu avances vers tes rêves.',
      },
      journal_entry: {
        title: 'Bien noté 📝',
        description: 'Ton journal est mis à jour.',
      },
    };

    const config = messages[type];

    // Son
    play(type.includes('task') ? 'task_done' : 'habit_done');

    // Vibration
    vibrate('success');

    // Confettis (selon l'importance)
    if (type === 'all_tasks_done' || type === 'all_habits_done' || type === 'goal_reached') {
      fireConfetti('allDone');
    } else if (type === 'streak_milestone') {
      fireConfetti('streak');
    } else {
      fireConfetti('success');
    }

    // Toast
    toast({
      title: config.title,
      description: config.description,
      duration: 3000,
    });

    // Analytics
    trackAction(`celebration_${type}`, { customMessage: customMessage || null });
  }, [fireConfetti, play, vibrate, toast, firstName, trackAction]);

  return { celebrate };
}
