import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function GlobalScoreBadge() {
  const { user } = useAuth();
  
  const { data: score } = useQuery({
    queryKey: ['global-score', user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('scores_daily')
        .select('global_score')
        .eq('user_id', user?.id)
        .eq('date', today)
        .maybeSingle();
      return data?.global_score ?? null;
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // Refresh every minute
  });

  if (score === null) return null;

  const getScoreColor = (s: number) => {
    if (s >= 70) return 'text-success border-success/30 bg-success/10';
    if (s >= 40) return 'text-warning border-warning/30 bg-warning/10';
    return 'text-destructive border-destructive/30 bg-destructive/10';
  };

  return (
    <Badge 
      variant="outline" 
      className={cn("gap-1 font-medium", getScoreColor(score))}
    >
      <TrendingUp className="h-3 w-3" />
      {Math.round(score)}%
    </Badge>
  );
}
