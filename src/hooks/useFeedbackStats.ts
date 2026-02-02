import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface FeedbackStats {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  byType: Record<string, { positive: number; neutral: number; negative: number }>;
  satisfactionRate: number;
}

export function useFeedbackStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['feedback-stats', user?.id],
    queryFn: async (): Promise<FeedbackStats | null> => {
      const { data } = await supabase
        .from('suggestion_feedback')
        .select('suggestion_type, rating')
        .eq('user_id', user?.id);

      if (!data || data.length === 0) return null;

      const stats: FeedbackStats = {
        total: data.length,
        positive: data.filter(f => f.rating === 1).length,
        neutral: data.filter(f => f.rating === 0).length,
        negative: data.filter(f => f.rating === -1).length,
        byType: {},
        satisfactionRate: 0,
      };

      // Group by type
      data.forEach(f => {
        if (!stats.byType[f.suggestion_type]) {
          stats.byType[f.suggestion_type] = { positive: 0, neutral: 0, negative: 0 };
        }
        if (f.rating === 1) stats.byType[f.suggestion_type].positive++;
        if (f.rating === 0) stats.byType[f.suggestion_type].neutral++;
        if (f.rating === -1) stats.byType[f.suggestion_type].negative++;
      });

      // Calculate satisfaction rate (positive / total * 100)
      stats.satisfactionRate = Math.round((stats.positive / stats.total) * 100);

      return stats;
    },
    enabled: !!user?.id,
  });
}
