import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  return useQuery<CurrentIdentity>({
    queryKey: ['identity', 'current'],
    queryFn: async () => {
      // 1. Récupérer scores récents
      const { data: scores } = await supabase
        .from('scores_daily')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Default values if no scores exist
      const globalScore = scores?.global_score ?? 50;
      const consistencyFactor = scores?.consistency_factor ?? 0.5;
      const momentumIndex = scores?.momentum_index ?? 0;
      const burnoutIndex = scores?.burnout_index ?? 0;

      // 2. Déterminer persona based on available metrics
      let persona = "Explorer";
      let tagline = "Tu explores tes capacités";
      
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
      }

      // 3. Récupérer comportements façonnants
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
        disciplineLevel: Math.round(globalScore),
        consistencyLevel: Math.round(consistencyFactor * 100),
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
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
}
