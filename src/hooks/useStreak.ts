import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, subDays, format } from 'date-fns';

export function useStreak() {
  return useQuery({
    queryKey: ['user-streak'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { currentStreak: 0, longestStreak: 0 };

      // Récupérer les scores des 90 derniers jours
      const { data: scores } = await supabase
        .from('scores_daily')
        .select('date, global_score')
        .eq('user_id', user.id)
        .gte('date', format(subDays(new Date(), 90), 'yyyy-MM-dd'))
        .order('date', { ascending: false });

      if (!scores || scores.length === 0) {
        return { currentStreak: 0, longestStreak: 0 };
      }

      // Calculer le streak actuel
      let currentStreak = 0;
      const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
      
      for (let i = 0; i < scores.length; i++) {
        const expectedDate = format(subDays(new Date(), i), 'yyyy-MM-dd');
        const score = scores.find(s => s.date === expectedDate);
        
        if (score && score.global_score >= 30) { // Seuil minimum
          currentStreak++;
        } else {
          break;
        }
      }

      // Calculer le plus long streak
      let longestStreak = 0;
      let tempStreak = 0;
      
      for (const score of scores.reverse()) {
        if (score.global_score >= 30) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      }

      return { currentStreak, longestStreak };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
