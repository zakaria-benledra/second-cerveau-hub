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
  return useQuery({
    queryKey: ['scores', 'today'],
    queryFn: fetchTodayScore,
  });
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
