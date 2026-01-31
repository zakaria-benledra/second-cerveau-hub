import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, subDays } from 'date-fns';

interface GratitudeEntry {
  id: string;
  user_id: string;
  date: string;
  items: string[];
  created_at: string;
}

export function useTodayGratitude() {
  const today = format(new Date(), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['gratitude', 'today'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('gratitude_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (error) throw error;
      return data as GratitudeEntry | null;
    },
  });
}

export function useGratitudeHistory(days: number = 30) {
  return useQuery({
    queryKey: ['gratitude', 'history', days],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('gratitude_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as GratitudeEntry[];
    },
  });
}

export function useGratitudeStreak() {
  return useQuery({
    queryKey: ['gratitude', 'streak'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const startDate = format(subDays(new Date(), 60), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('gratitude_entries')
        .select('date, items')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .order('date', { ascending: false });

      if (error) throw error;

      // Calculate streak
      let streak = 0;
      const today = new Date();

      for (let i = 0; i < 60; i++) {
        const checkDate = format(subDays(today, i), 'yyyy-MM-dd');
        const entry = data?.find(e => e.date === checkDate);

        if (entry && entry.items && entry.items.length > 0) {
          streak++;
        } else if (i > 0) {
          // Allow today to be incomplete
          break;
        }
      }

      return streak;
    },
  });
}

export function useSaveGratitude() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const today = format(new Date(), 'yyyy-MM-dd');

  return useMutation({
    mutationFn: async (items: string[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if entry exists
      const { data: existing } = await supabase
        .from('gratitude_entries')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      const payload = {
        user_id: user.id,
        date: today,
        items: items.filter(i => i.trim()),
        updated_at: new Date().toISOString(),
        source: 'ui' as const,
      };

      const { data, error } = existing?.id
        ? await supabase
            .from('gratitude_entries')
            .update(payload)
            .eq('id', existing.id)
            .select()
            .single()
        : await supabase
            .from('gratitude_entries')
            .insert(payload)
            .select()
            .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gratitude'] });
      toast({
        title: 'Gratitudes enregistrées 🙏',
        description: 'Merci de prendre ce moment pour la gratitude.',
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
