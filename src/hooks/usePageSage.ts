import { useMemo } from 'react';
import { useTodayScore } from '@/hooks/useScores';
import { useTodayCommand } from '@/hooks/useTodayCommand';
import { useStreak } from '@/hooks/useStreak';
import type { SageContext, SageMood } from '@/components/sage';

type PageType = 'home' | 'tasks' | 'habits' | 'journal' | 'finance' | 'goals' | 'focus' | 'progress';

interface PageSageData {
  context: SageContext;
  mood: SageMood;
  data: {
    score: number;
    completed: number;
    total: number;
    streak: number;
  };
}

export function usePageSage(page: PageType): PageSageData {
  const { data: score } = useTodayScore();
  const { habitsForCard, tasksForCard } = useTodayCommand();
  const { data: streak } = useStreak();

  return useMemo(() => {
    const globalScore = score?.global_score || 0;
    const completedHabits = habitsForCard?.filter(h => h.completed).length || 0;
    const totalHabits = habitsForCard?.length || 0;
    const completedTasks = tasksForCard?.filter(t => t.status === 'done').length || 0;
    const totalTasks = tasksForCard?.length || 0;
    const currentStreak = streak?.currentStreak || 0;

    // Déterminer le mood en fonction des données
    const getMood = (): SageMood => {
      if (globalScore >= 80 || (completedHabits === totalHabits && totalHabits > 0)) return 'celebratory';
      if (globalScore >= 60) return 'happy';
      if (globalScore >= 40) return 'neutral';
      return 'supportive';
    };

    // Mapper la page vers le contexte Sage
    const contextMap: Record<PageType, SageContext> = {
      home: 'welcome',
      tasks: 'tasks',
      habits: 'habits',
      journal: 'journal',
      finance: 'finance',
      goals: 'goals',
      focus: 'focus',
      progress: 'welcome',
    };

    return {
      context: contextMap[page],
      mood: getMood(),
      data: {
        score: globalScore,
        completed: page === 'habits' ? completedHabits : completedTasks,
        total: page === 'habits' ? totalHabits : totalTasks,
        streak: currentStreak,
      },
    };
  }, [score, habitsForCard, tasksForCard, streak, page]);
}
