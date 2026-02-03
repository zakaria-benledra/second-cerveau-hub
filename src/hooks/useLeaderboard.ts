import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string;
  total_xp: number;
  current_level: number;
  current_streak: number;
  longest_streak: number;
  total_actions: number;
  rank_xp: number;
  rank_streak: number;
  isCurrentUser?: boolean;
}

export function useLeaderboard(type: 'xp' | 'streak' = 'xp', limit = 10) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['leaderboard', type, limit],
    queryFn: async () => {
      const orderColumn = type === 'xp' ? 'rank_xp' : 'rank_streak';
      
      const { data, error } = await (supabase as any)
        .from('leaderboard_weekly')
        .select('*')
        .order(orderColumn)
        .limit(limit);
      
      if (error) throw error;
      
      // Marquer l'utilisateur actuel
      return (data || []).map((entry: LeaderboardEntry) => ({
        ...entry,
        isCurrentUser: entry.user_id === user?.id,
      })) as LeaderboardEntry[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useMyRank() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['my-rank', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await (supabase as any)
        .from('leaderboard_weekly')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as LeaderboardEntry | null;
    },
    enabled: !!user?.id,
  });
}
