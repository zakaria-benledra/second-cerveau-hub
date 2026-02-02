import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export interface GamificationChallenge {
  id: string;
  title: string;
  description: string | null;
  challenge_type: 'daily' | 'weekly' | 'monthly' | 'special' | 'seasonal';
  target_type: string;
  target_value: number;
  xp_reward: number;
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  start_date?: string;
  end_date?: string;
  is_active: boolean;
}

export interface UserGamificationChallenge {
  id: string;
  challenge_id: string;
  current_progress: number;
  target_value: number;
  status: 'active' | 'completed' | 'failed' | 'expired';
  started_at: string;
  expires_at: string | null;
  xp_earned: number;
  challenge?: GamificationChallenge;
}

export function useAvailableChallenges() {
  return useQuery({
    queryKey: ['available-gamification-challenges'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('gamification_challenges')
        .select('*')
        .eq('is_active', true)
        .order('challenge_type')
        .order('difficulty');
      
      if (error) throw error;
      return data as GamificationChallenge[];
    },
  });
}

export function useActiveChallenges() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['active-gamification-challenges', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await (supabase as any)
        .from('user_gamification_challenges')
        .select(`
          *,
          challenge:gamification_challenges(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('expires_at');
      
      if (error) throw error;
      return data as (UserGamificationChallenge & { challenge: GamificationChallenge })[];
    },
    enabled: !!user?.id,
  });
}

export function useJoinChallenge() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (challengeId: string) => {
      if (!user?.id) throw new Error('Non authentifié');

      // Récupérer le défi
      const { data: challenge, error: challengeError } = await (supabase as any)
        .from('gamification_challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (challengeError || !challenge) throw new Error('Défi non trouvé');

      // Calculer la date d'expiration
      let expiresAt: Date | null = null;
      const now = new Date();
      
      if (challenge.challenge_type === 'daily') {
        expiresAt = new Date(now);
        expiresAt.setHours(23, 59, 59, 999);
      } else if (challenge.challenge_type === 'weekly') {
        expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + (7 - expiresAt.getDay()));
        expiresAt.setHours(23, 59, 59, 999);
      } else if (challenge.challenge_type === 'monthly') {
        expiresAt = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        expiresAt.setHours(23, 59, 59, 999);
      }

      const { data, error } = await (supabase as any)
        .from('user_gamification_challenges')
        .insert({
          user_id: user.id,
          challenge_id: challengeId,
          target_value: challenge.target_value,
          expires_at: expiresAt?.toISOString(),
        })
        .select(`*, challenge:gamification_challenges(*)`)
        .single();

      if (error) throw error;
      return { userChallenge: data, challenge };
    },
    onSuccess: ({ challenge }) => {
      queryClient.invalidateQueries({ queryKey: ['active-gamification-challenges'] });
      toast.success(`${challenge.icon} Défi accepté !`, {
        description: challenge.title,
      });
    },
    onError: (error: Error) => {
      toast.error('Erreur', { description: error.message });
    },
  });
}

export function useUpdateChallengeProgress() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      userChallengeId, 
      progress 
    }: { 
      userChallengeId: string; 
      progress: number;
    }) => {
      if (!user?.id) throw new Error('Non authentifié');

      // Récupérer le défi actif
      const { data: userChallenge, error: fetchError } = await (supabase as any)
        .from('user_gamification_challenges')
        .select(`*, challenge:gamification_challenges(*)`)
        .eq('id', userChallengeId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !userChallenge) throw new Error('Défi non trouvé');

      const newProgress = Math.min(progress, userChallenge.target_value);
      const isCompleted = newProgress >= userChallenge.target_value;

      const updates: Record<string, unknown> = {
        current_progress: newProgress,
      };

      if (isCompleted && userChallenge.status === 'active') {
        updates.status = 'completed';
        updates.completed_at = new Date().toISOString();
        updates.xp_earned = userChallenge.challenge.xp_reward;

        // Enregistrer la complétion
        await (supabase as any).from('gamification_challenge_completions').insert({
          user_id: user.id,
          challenge_id: userChallenge.challenge_id,
          xp_earned: userChallenge.challenge.xp_reward,
        });
      }

      const { error } = await (supabase as any)
        .from('user_gamification_challenges')
        .update(updates)
        .eq('id', userChallengeId);

      if (error) throw error;

      return { 
        isCompleted, 
        challenge: userChallenge.challenge,
        xpEarned: isCompleted ? userChallenge.challenge.xp_reward : 0,
      };
    },
    onSuccess: ({ isCompleted, challenge, xpEarned }) => {
      queryClient.invalidateQueries({ queryKey: ['active-gamification-challenges'] });
      queryClient.invalidateQueries({ queryKey: ['gamification-profile'] });

      if (isCompleted) {
        toast.success(`🎉 Défi complété !`, {
          description: `${challenge.title} - +${xpEarned} XP`,
        });
      }
    },
  });
}

export function useChallengeStats() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['gamification-challenge-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await (supabase as any)
        .from('gamification_challenge_completions')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      return {
        totalCompleted: data?.length || 0,
        totalXPFromChallenges: data?.reduce((sum: number, c: { xp_earned: number }) => sum + (c.xp_earned || 0), 0) || 0,
      };
    },
    enabled: !!user?.id,
  });
}
