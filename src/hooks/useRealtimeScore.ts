import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface ScoreResult {
  success: boolean;
  score: number;
  breakdown: {
    habits_score: number;
    tasks_score: number;
    finance_score: number;
    health_score: number;
  };
  metrics: {
    habits: { completed: number; total: number; expected: number };
    tasks: { completed: number; total: number };
    focus_minutes: number;
  };
  momentum_index: number;
  burnout_index: number;
}

export function useRealtimeScore() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (): Promise<ScoreResult> => {
      const { data, error } = await supabase.functions.invoke<ScoreResult>('compute-score-realtime');
      if (error) throw error;
      if (!data) throw new Error('No data returned');
      return data;
    },
    onSuccess: (data) => {
      // Invalidate all score-related queries
      queryClient.invalidateQueries({ queryKey: ['scores'] });
      queryClient.invalidateQueries({ queryKey: ['daily-stats'] });
      queryClient.invalidateQueries({ queryKey: ['global-score'] });
      queryClient.invalidateQueries({ queryKey: ['identity-score'] });
      
      toast({
        title: `Score mis à jour : ${data.score}%`,
        description: `${data.metrics.habits.completed} logs habitudes sur 7 jours • ${data.metrics.tasks.completed}/${data.metrics.tasks.total} tâches complétées`,
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Erreur de calcul', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
}
