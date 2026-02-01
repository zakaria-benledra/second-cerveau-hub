import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useConfetti } from '@/hooks/useConfetti';

interface GamificationProfile {
  id: string;
  total_xp: number;
  current_level: number;
  xp_to_next_level: number;
  lifetime_habits_completed: number;
  lifetime_tasks_completed: number;
  longest_streak: number;
  current_streak: number;
  last_activity_date: string | null;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface UserBadge {
  id: string;
  badge_id: string;
  unlocked_at: string;
  badges: Badge;
}

// XP par action
const XP_REWARDS = {
  habit_complete: 10,
  task_complete: 15,
  streak_day: 25,
  perfect_day: 50,
  challenge_complete: 100,
};

export function useGamificationProfile() {
  return useQuery({
    queryKey: ['gamification-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('gamification_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (!data) {
        // Créer le profil s'il n'existe pas
        const { data: newProfile } = await supabase
          .from('gamification_profiles')
          .insert({ id: user.id })
          .select()
          .single();
        return newProfile as GamificationProfile;
      }
      
      return data as GamificationProfile;
    },
  });
}

export function useUserBadges() {
  return useQuery({
    queryKey: ['user-badges'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_badges')
        .select('*, badges(*)')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false });
      
      if (error) throw error;
      return data as UserBadge[];
    },
  });
}

export function useAllBadges() {
  return useQuery({
    queryKey: ['all-badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('requirement_value');
      
      if (error) throw error;
      return data as Badge[];
    },
  });
}

export function useAddXP() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { fire } = useConfetti();

  return useMutation({
    mutationFn: async ({ 
      amount, 
      reason 
    }: { 
      amount: number; 
      reason: keyof typeof XP_REWARDS | 'bonus';
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Récupérer le profil actuel
      const { data: profile } = await supabase
        .from('gamification_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const newXP = (profile.total_xp || 0) + amount;
      const newLevel = Math.max(1, Math.floor(Math.sqrt(newXP / 50)));
      const leveledUp = newLevel > (profile.current_level || 1);

      // Mettre à jour le profil
      const updates: Partial<GamificationProfile> = {
        total_xp: newXP,
        current_level: newLevel,
        xp_to_next_level: (newLevel + 1) * (newLevel + 1) * 50,
      };

      // Mettre à jour les compteurs selon la raison
      if (reason === 'habit_complete') {
        updates.lifetime_habits_completed = (profile.lifetime_habits_completed || 0) + 1;
      } else if (reason === 'task_complete') {
        updates.lifetime_tasks_completed = (profile.lifetime_tasks_completed || 0) + 1;
      }

      const { error } = await supabase
        .from('gamification_profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      return { newXP, newLevel, leveledUp, amount };
    },
    onSuccess: ({ leveledUp, newLevel, amount }) => {
      queryClient.invalidateQueries({ queryKey: ['gamification-profile'] });
      
      // Notification XP
      toast({
        title: `+${amount} XP`,
        description: leveledUp ? `Niveau ${newLevel} atteint ! 🎉` : undefined,
        duration: 2000,
      });

      // Si level up, grosse célébration
      if (leveledUp) {
        fire('fireworks');
      }
    },
  });
}

export function useCheckBadges() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { fire } = useConfetti();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Récupérer le profil et les badges déjà débloqués
      const [profileRes, unlockedRes, allBadgesRes] = await Promise.all([
        supabase.from('gamification_profiles').select('*').eq('id', user.id).single(),
        supabase.from('user_badges').select('badge_id').eq('user_id', user.id),
        supabase.from('badges').select('*'),
      ]);

      const profile = profileRes.data;
      const unlockedIds = new Set(unlockedRes.data?.map(b => b.badge_id) || []);
      const allBadges = allBadgesRes.data || [];

      if (!profile) return [];

      const newBadges: Badge[] = [];

      for (const badge of allBadges) {
        if (unlockedIds.has(badge.id)) continue;

        let shouldUnlock = false;

        switch (badge.requirement_type) {
          case 'streak_days':
            shouldUnlock = (profile.current_streak || 0) >= badge.requirement_value;
            break;
          case 'habits_count':
            shouldUnlock = (profile.lifetime_habits_completed || 0) >= badge.requirement_value;
            break;
          case 'tasks_count':
            shouldUnlock = (profile.lifetime_tasks_completed || 0) >= badge.requirement_value;
            break;
          case 'level':
            shouldUnlock = (profile.current_level || 1) >= badge.requirement_value;
            break;
        }

        if (shouldUnlock) {
          await supabase.from('user_badges').insert({
            user_id: user.id,
            badge_id: badge.id,
          });

          // Ajouter l'XP du badge
          await supabase
            .from('gamification_profiles')
            .update({ total_xp: (profile.total_xp || 0) + badge.xp_reward })
            .eq('id', user.id);

          newBadges.push(badge as Badge);
        }
      }

      return newBadges;
    },
    onSuccess: (newBadges) => {
      if (newBadges.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['user-badges'] });
        queryClient.invalidateQueries({ queryKey: ['gamification-profile'] });

        // Notifier pour chaque nouveau badge
        newBadges.forEach((badge, index) => {
          setTimeout(() => {
            fire('badge');
            toast({
              title: `${badge.icon} Nouveau badge !`,
              description: `${badge.name} - ${badge.description}`,
              duration: 5000,
            });
          }, index * 1500);
        });
      }
    },
  });
}

// Hook combiné pour faciliter l'utilisation
export function useGamification() {
  const { data: profile, isLoading: profileLoading } = useGamificationProfile();
  const { data: badges, isLoading: badgesLoading } = useUserBadges();
  const { data: allBadges } = useAllBadges();
  const addXP = useAddXP();
  const checkBadges = useCheckBadges();

  const rewardAction = async (action: keyof typeof XP_REWARDS) => {
    const xp = XP_REWARDS[action];
    await addXP.mutateAsync({ amount: xp, reason: action });
    await checkBadges.mutateAsync();
  };

  return {
    profile,
    badges,
    allBadges,
    isLoading: profileLoading || badgesLoading,
    rewardAction,
    addXP,
    checkBadges,
    XP_REWARDS,
  };
}
