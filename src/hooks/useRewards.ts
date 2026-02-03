import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import { useGamification } from './useGamification';

export interface Reward {
  id: string;
  name: string;
  description: string | null;
  reward_type: 'theme' | 'avatar' | 'badge_style' | 'title' | 'feature';
  xp_cost: number;
  icon: string | null;
  preview_url: string | null;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  is_active: boolean;
}

export interface UserReward {
  id: string;
  user_id: string;
  reward_id: string;
  unlocked_at: string;
  is_equipped: boolean;
  reward?: Reward;
}

export function useAvailableRewards() {
  return useQuery({
    queryKey: ['available-rewards'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('rewards')
        .select('*')
        .eq('is_active', true)
        .order('xp_cost');
      
      if (error) throw error;
      return data as Reward[];
    },
  });
}

export function useMyRewards() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['my-rewards', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await (supabase as any)
        .from('user_rewards')
        .select('*, reward:rewards(*)')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as (UserReward & { reward: Reward })[];
    },
    enabled: !!user?.id,
  });
}

export function usePurchaseReward() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { profile } = useGamification();

  return useMutation({
    mutationFn: async (rewardId: string) => {
      if (!user?.id) throw new Error('Non authentifié');

      // Vérifier le coût
      const { data: reward, error: rewardError } = await (supabase as any)
        .from('rewards')
        .select('*')
        .eq('id', rewardId)
        .single();

      if (rewardError || !reward) throw new Error('Récompense non trouvée');
      
      const currentXp = profile?.total_xp || 0;
      if (currentXp < reward.xp_cost) {
        throw new Error(`Il te manque ${reward.xp_cost - currentXp} XP`);
      }

      // Vérifier si déjà possédé
      const { data: existing } = await (supabase as any)
        .from('user_rewards')
        .select('id')
        .eq('user_id', user.id)
        .eq('reward_id', rewardId)
        .maybeSingle();

      if (existing) {
        throw new Error('Tu possèdes déjà cette récompense');
      }

      // Déduire l'XP
      const { error: updateError } = await supabase
        .from('gamification_profiles')
        .update({ total_xp: currentXp - reward.xp_cost })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Ajouter la récompense
      const { error: insertError } = await (supabase as any)
        .from('user_rewards')
        .insert({ user_id: user.id, reward_id: rewardId });

      if (insertError) throw insertError;

      return reward as Reward;
    },
    onSuccess: (reward) => {
      queryClient.invalidateQueries({ queryKey: ['my-rewards'] });
      queryClient.invalidateQueries({ queryKey: ['gamification-profile'] });
      toast.success(`${reward.icon} Récompense débloquée !`, {
        description: reward.name,
      });
    },
    onError: (error: Error) => {
      toast.error('Erreur', { description: error.message });
    },
  });
}

export function useEquipReward() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ userRewardId, rewardType }: { userRewardId: string; rewardType: string }) => {
      if (!user?.id) throw new Error('Non authentifié');

      // D'abord récupérer toutes les récompenses du même type pour les déséquiper
      const { data: sameTypeRewards } = await (supabase as any)
        .from('user_rewards')
        .select('id, reward:rewards(reward_type)')
        .eq('user_id', user.id);

      // Déséquiper les autres du même type
      const rewardsToUnequip = (sameTypeRewards || [])
        .filter((r: any) => r.reward?.reward_type === rewardType && r.id !== userRewardId)
        .map((r: any) => r.id);

      if (rewardsToUnequip.length > 0) {
        await (supabase as any)
          .from('user_rewards')
          .update({ is_equipped: false })
          .in('id', rewardsToUnequip);
      }

      // Équiper celui-ci
      const { error } = await (supabase as any)
        .from('user_rewards')
        .update({ is_equipped: true })
        .eq('id', userRewardId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-rewards'] });
      toast.success('Récompense équipée !');
    },
    onError: (error: Error) => {
      toast.error('Erreur', { description: error.message });
    },
  });
}

export function useUnequipReward() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (userRewardId: string) => {
      if (!user?.id) throw new Error('Non authentifié');

      const { error } = await (supabase as any)
        .from('user_rewards')
        .update({ is_equipped: false })
        .eq('id', userRewardId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-rewards'] });
      toast.success('Récompense retirée');
    },
  });
}
