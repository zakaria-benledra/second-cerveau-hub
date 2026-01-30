import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, subDays } from 'date-fns';

interface BehavioralEntry {
  id: string;
  user_id: string;
  date: string;
  gratitude: string[];
  wins: string[];
  challenges: string[];
  created_at: string;
}

interface SaveBehavioralInput {
  gratitude: string[];
  wins: string[];
  challenges: string[];
}

export function useTodayBehavioralEntry() {
  const today = format(new Date(), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['behavioral-entry', 'today'],
    queryFn: async () => {
      // Get from journal_entries (behavioral data stored there)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('journal_entries')
        .select('id, user_id, date, gratitude, wins, challenges, created_at')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (error) throw error;
      return data as BehavioralEntry | null;
    },
  });
}

export function useSaveBehavioralEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const today = format(new Date(), 'yyyy-MM-dd');

  return useMutation({
    mutationFn: async (input: SaveBehavioralInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Avoid relying on DB unique constraints (onConflict) that may not exist.
      const { data: existing, error: existingError } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (existingError) throw existingError;

      const payload = {
        user_id: user.id,
        date: today,
        gratitude: input.gratitude,
        wins: input.wins,
        challenges: input.challenges,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = existing?.id
        ? await supabase
            .from('journal_entries')
            .update(payload)
            .eq('id', existing.id)
            .select()
            .single()
        : await supabase
            .from('journal_entries')
            .insert(payload)
            .select()
            .single();

      if (error) throw error;

      // Track behavioral entry as habit behavior link (best-effort; do not block save if it fails)
      const { error: linkError } = await supabase
        .from('habit_behavior_links')
        .insert({
          user_id: user.id,
          behavior_type: 'daily_checkin',
          metadata: {
            date: today,
            gratitude_count: input.gratitude.length,
            wins_count: input.wins.length,
            challenges_count: input.challenges.length,
          },
        });

      if (linkError) {
        // Non-blocking, but visible in console for debugging
        console.warn('[behavior] habit_behavior_links insert failed', linkError);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['behavioral-entry'] });
      queryClient.invalidateQueries({ queryKey: ['journalEntry'] });
      toast({
        title: 'Check-in sauvegardé ✨',
        description: 'Votre check-in comportemental a été enregistré.',
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

export function useBehavioralStreak() {
  return useQuery({
    queryKey: ['behavioral-streak'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get last 30 days of entries
      const startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('journal_entries')
        .select('date, gratitude, wins, challenges')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .order('date', { ascending: false });

      if (error) throw error;

      // Calculate streak
      let currentStreak = 0;
      const today = new Date();
      
      for (let i = 0; i < 30; i++) {
        const checkDate = format(subDays(today, i), 'yyyy-MM-dd');
        const entry = data?.find(e => e.date === checkDate);
        
        const hasContent = entry && (
          (entry.gratitude && entry.gratitude.length > 0) ||
          (entry.wins && entry.wins.length > 0) ||
          (entry.challenges && entry.challenges.length > 0)
        );
        
        if (hasContent) {
          currentStreak++;
        } else if (i > 0) {
          // Allow today to be incomplete
          break;
        }
      }

      return {
        current: currentStreak,
        entries: data?.length || 0,
      };
    },
  });
}

export function useBehavioralHistory(days: number = 7) {
  return useQuery({
    queryKey: ['behavioral-history', days],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('journal_entries')
        .select('date, gratitude, wins, challenges')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .order('date', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}
