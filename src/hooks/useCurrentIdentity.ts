import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTodayScore } from '@/hooks/useScores';

interface ShapingBehavior {
  id: string;
  title: string;
  description: string;
  completion: number;
  icon: string;
}

interface CurrentIdentity {
  currentPersona: string;
  tagline: string;
  disciplineLevel: number;
  consistencyLevel: number;
  stabilityLevel: number;
  growthRate: number;
  shapingBehaviors: ShapingBehavior[];
}

export function useCurrentIdentity() {
  const { data: todayScore, isLoading: isScoreLoading } = useTodayScore();

  const query = useQuery<CurrentIdentity>({
    queryKey: ['identity', 'current', todayScore?.global_score],
    queryFn: async () => {
      // Use todayScore data instead of querying scores_daily directly
      const globalScore = todayScore?.global_score ?? 0;
      const consistencyFactor = todayScore?.consistency_factor ?? 0;
      const rawMomentum = todayScore?.momentum_index ?? 0;
      const momentumIndex = rawMomentum > 1 ? rawMomentum / 100 : rawMomentum;
      const rawBurnout = todayScore?.burnout_index ?? 0;
      const burnoutIndex = rawBurnout > 1 ? rawBurnout / 100 : rawBurnout;
      
      // Check if user is brand new (no scores at all)
      const isNewUser = !todayScore;

      // Déterminer persona based on available metrics
      let persona = "Nouveau Voyageur";
      let tagline = "Ton aventure commence aujourd'hui";
      
      // Only assign personas if user has data
      if (!isNewUser) {
        if (globalScore > 80 && consistencyFactor > 0.75) {
          persona = "Maître de Discipline";
          tagline = "Tu incarnes la discipline au quotidien";
        } else if (globalScore > 60 && momentumIndex > 0.5) {
          persona = "Bâtisseur en Progression";
          tagline = "Tu construis de nouvelles habitudes solides";
        } else if (globalScore < 50 && burnoutIndex > 0.7) {
          persona = "En Reconstruction";
          tagline = "Tu reprends le contrôle progressivement";
        } else if (consistencyFactor > 0.8) {
          persona = "Roc de Stabilité";
          tagline = "Ta cohérence est exemplaire";
        } else if (globalScore > 70) {
          persona = "Performeur Régulier";
          tagline = "Tu maintiens un bon niveau de performance";
        } else {
          persona = "Explorer";
          tagline = "Tu explores tes capacités";
        }
      }

      // Récupérer comportements façonnants
      const today = new Date().toISOString().split('T')[0];
      
      const [tasksResult, habitsResult, habitLogsResult] = await Promise.all([
        supabase
          .from('tasks')
          .select('id, status, priority')
          .or(`start_date.eq.${today},due_date.eq.${today}`)
          .is('deleted_at', null),
        supabase
          .from('habits')
          .select('id, name')
          .eq('is_active', true)
          .is('deleted_at', null),
        supabase
          .from('habit_logs')
          .select('habit_id, completed')
          .eq('date', today)
      ]);

      const todayTasks = tasksResult.data || [];
      const activeHabits = habitsResult.data || [];
      const todayLogs = habitLogsResult.data || [];

      const completedHabits = todayLogs.filter(log => log.completed).length;
      const completedTasks = todayTasks.filter(t => t.status === 'done').length;

      const habitCompletion = activeHabits.length > 0 
        ? (completedHabits / activeHabits.length) * 100 
        : 0;
      const taskCompletion = todayTasks.length > 0 
        ? (completedTasks / todayTasks.length) * 100 
        : 0;

      return {
        currentPersona: persona,
        tagline: tagline,
        disciplineLevel: todayScore?.global_score ?? 0,
        consistencyLevel: (todayScore?.consistency_factor ?? 0.5) * 100,
        stabilityLevel: Math.round((1 - burnoutIndex) * 100),
        growthRate: momentumIndex,
        shapingBehaviors: [
          {
            id: 'habits',
            title: `${activeHabits.length} Habitudes Actives`,
            description: 'Tes rituels quotidiens qui forgent ta discipline',
            completion: Math.round(habitCompletion),
            icon: '🔁'
          },
          {
            id: 'tasks',
            title: `${todayTasks.length} Engagements du Jour`,
            description: 'Ce à quoi tu t\'engages aujourd\'hui',
            completion: Math.round(taskCompletion),
            icon: '✅'
          }
        ]
      };
    },
    enabled: !isScoreLoading,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  return {
    ...query,
    isLoading: isScoreLoading || query.isLoading
  };
}
