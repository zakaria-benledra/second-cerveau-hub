import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';

export function useCelebrationToast() {
  const { toast } = useToast();
  const { data: profile } = useUserProfile();
  const firstName = profile?.first_name || 'Champion';

  const celebrate = (type: 'task' | 'habit' | 'allTasks' | 'allHabits' | 'streak') => {
    const messages = {
      task: {
        title: "Bien joué ! ✅",
        description: "Une tâche de moins, continue !",
      },
      habit: {
        title: "Habitude validée ! 💪",
        description: "Tu renforces ta discipline.",
      },
      allTasks: {
        title: `Bravo ${firstName} ! 🎉`,
        description: "Toutes tes tâches sont terminées !",
      },
      allHabits: {
        title: "Journée parfaite ! 🌟",
        description: "Toutes tes habitudes sont faites !",
      },
      streak: {
        title: "Streak en feu ! 🔥",
        description: "Tu es sur une belle série !",
      },
    };

    toast({
      ...messages[type],
      duration: 3000,
    });
  };

  return { celebrate };
}
