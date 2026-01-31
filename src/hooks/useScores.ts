import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTodayScore,
  fetchScoreHistory,
  fetchWeeklyScores,
  recomputeScore,
  type DailyScore,
} from '@/lib/api/scores';
import { useToast } from '@/hooks/use-toast';

export function useTodayScore() {
  const query = useQuery({
    queryKey: ['scores', 'today'],
    queryFn: fetchTodayScore,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    ...query,
    lastUpdated: query.dataUpdatedAt ? new Date(query.dataUpdatedAt) : undefined,
  };
}

export function useScoreHistory(days: number = 30) {
  return useQuery({
    queryKey: ['scores', 'history', days],
    queryFn: () => fetchScoreHistory(days),
  });
}

export function useWeeklyScores(weeks: number = 12) {
  return useQuery({
    queryKey: ['scores', 'weekly', weeks],
    queryFn: () => fetchWeeklyScores(weeks),
  });
}

export function useRecomputeScore() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (date?: string) => recomputeScore(date),
    onSuccess: (score: DailyScore) => {
      queryClient.invalidateQueries({ queryKey: ['scores'] });
      toast({
        title: 'Score recalculé',
        description: `Score global: ${Math.round(score.global_score)}%`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
