import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';

export function useBehaviorHubStats() {
  return useQuery({
    queryKey: ['behavior-hub-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Parallel queries for efficiency
      const [winsResult, challengesResult, gratitudeResult] = await Promise.all([
        // Total wins
        supabase
          .from('wins')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .is('deleted_at', null),
        
        // Active challenges
        supabase
          .from('challenges')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'active')
          .is('deleted_at', null),
        
        // Gratitude streak (last 60 days)
        supabase
          .from('gratitude_entries')
          .select('date, items')
          .eq('user_id', user.id)
          .gte('date', format(subDays(new Date(), 60), 'yyyy-MM-dd'))
          .order('date', { ascending: false }),
      ]);

      // Calculate gratitude streak
      let gratitudeStreak = 0;
      const today = new Date();
      const gratitudeEntries = gratitudeResult.data || [];

      for (let i = 0; i < 60; i++) {
        const checkDate = format(subDays(today, i), 'yyyy-MM-dd');
        const entry = gratitudeEntries.find((e: { date: string; items: string[] }) => e.date === checkDate);

        if (entry && entry.items && entry.items.length > 0) {
          gratitudeStreak++;
        } else if (i > 0) {
          break;
        }
      }

      return {
        totalWins: winsResult.count || 0,
        activeChallenges: challengesResult.count || 0,
        gratitudeStreak,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
