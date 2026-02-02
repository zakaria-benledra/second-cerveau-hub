import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface UserLevel {
  currentXp: number;
  currentLevel: number;
  totalXpEarned: number;
  xpToNextLevel: number;
  progressPercent: number;
}

interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  rarity: string | null;
  xpReward: number | null;
  unlocked: boolean;
  unlockedAt?: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  type: string | null;
  targetValue: number | null;
  currentProgress: number;
  xpReward: number | null;
  completed: boolean;
  endsAt?: string | null;
}

// Calculate XP needed for a level
function xpForLevel(level: number): number {
  return Math.pow(level, 2) * 100;
}

// Calculate level from XP
function levelFromXp(xp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);
}

export function useGamificationV2() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // User level and XP
  const { data: level, isLoading: levelLoading } = useQuery<UserLevel>({
    queryKey: ['user-level', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_levels')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create entry if doesn't exist
        const { data: newData } = await supabase
          .from('user_levels')
          .insert({ user_id: user!.id })
          .select()
          .single();

        return {
          currentXp: 0,
          currentLevel: 1,
          totalXpEarned: 0,
          xpToNextLevel: 100,
          progressPercent: 0,
        };
      }

      const currentLevel = data.current_level ?? 1;
      const currentXp = data.current_xp ?? 0;
      const nextLevelXp = xpForLevel(currentLevel);
      const prevLevelXp = xpForLevel(currentLevel - 1);
      const xpInCurrentLevel = currentXp - prevLevelXp;
      const xpNeeded = nextLevelXp - prevLevelXp;

      return {
        currentXp,
        currentLevel,
        totalXpEarned: data.total_xp_earned ?? 0,
        xpToNextLevel: nextLevelXp - currentXp,
        progressPercent: xpNeeded > 0 ? Math.round((xpInCurrentLevel / xpNeeded) * 100) : 0,
      };
    },
    enabled: !!user?.id,
  });

  // All badges with unlock status
  const { data: badges, isLoading: badgesLoading } = useQuery<Badge[]>({
    queryKey: ['user-badges-v2', user?.id],
    queryFn: async () => {
      const { data: allBadges, error: badgesError } = await supabase
        .from('badges')
        .select('*')
        .order('rarity');

      if (badgesError) throw badgesError;

      const { data: userBadges } = await supabase
        .from('user_badges')
        .select('badge_id, unlocked_at')
        .eq('user_id', user!.id);

      const unlockedMap = new Map(
        userBadges?.map(b => [b.badge_id, b.unlocked_at]) ?? []
      );

      return allBadges?.map(badge => ({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        category: badge.category,
        rarity: badge.rarity,
        xpReward: badge.xp_reward,
        unlocked: unlockedMap.has(badge.id),
        unlockedAt: unlockedMap.get(badge.id) ?? undefined,
      })) ?? [];
    },
    enabled: !!user?.id,
  });

  // Active challenges
  const { data: challenges, isLoading: challengesLoading } = useQuery<Challenge[]>({
    queryKey: ['user-challenges', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_challenges')
        .select(`
          *,
          gamification_challenges(*)
        `)
        .eq('user_id', user!.id)
        .eq('completed', false);

      if (error) throw error;

      return data?.map(uc => ({
        id: uc.challenge_id,
        title: (uc as any).gamification_challenges?.title ?? 'Challenge',
        description: (uc as any).gamification_challenges?.description ?? null,
        type: (uc as any).gamification_challenges?.challenge_type ?? null,
        targetValue: (uc as any).gamification_challenges?.target_value ?? null,
        currentProgress: uc.current_progress ?? 0,
        xpReward: (uc as any).gamification_challenges?.xp_reward ?? null,
        completed: uc.completed ?? false,
        endsAt: (uc as any).gamification_challenges?.end_date ?? null,
      })) ?? [];
    },
    enabled: !!user?.id,
  });

  // Add XP mutation
  const addXp = useMutation({
    mutationFn: async ({ amount, reason }: { amount: number; reason: string }) => {
      const { data: current } = await supabase
        .from('user_levels')
        .select('current_xp, current_level, total_xp_earned, last_level_up_at')
        .eq('user_id', user!.id)
        .maybeSingle();

      const currentXp = current?.current_xp ?? 0;
      const currentLevel = current?.current_level ?? 1;
      const totalEarned = current?.total_xp_earned ?? 0;

      const newXp = currentXp + amount;
      const newLevel = levelFromXp(newXp);
      const leveledUp = newLevel > currentLevel;

      const { error } = await supabase
        .from('user_levels')
        .upsert({
          user_id: user!.id,
          current_xp: newXp,
          current_level: newLevel,
          total_xp_earned: totalEarned + amount,
          last_level_up_at: leveledUp ? new Date().toISOString() : (current?.last_level_up_at ?? null),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      return { newXp, newLevel, leveledUp, amount };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-level'] });
      
      if (data.leveledUp) {
        toast({
          title: `🎉 Niveau ${data.newLevel} !`,
          description: `Tu as atteint le niveau ${data.newLevel} ! Continue comme ça !`,
        });
      } else {
        toast({
          title: `+${data.amount} XP`,
          description: 'Progression enregistrée',
        });
      }
    },
  });

  // Unlock badge mutation
  const unlockBadge = useMutation({
    mutationFn: async (badgeId: string) => {
      const badge = badges?.find(b => b.id === badgeId);
      if (!badge || badge.unlocked) return null;

      const { error } = await supabase
        .from('user_badges')
        .insert({
          user_id: user!.id,
          badge_id: badgeId,
        });

      if (error && !error.message.includes('duplicate')) throw error;

      // Add XP reward if badge has one
      if (badge.xpReward) {
        await addXp.mutateAsync({ 
          amount: badge.xpReward, 
          reason: `Badge débloqué: ${badge.name}` 
        });
      }

      return badge;
    },
    onSuccess: (badge) => {
      if (badge) {
        queryClient.invalidateQueries({ queryKey: ['user-badges-v2'] });
        toast({
          title: `${badge.icon} Badge débloqué !`,
          description: badge.name,
        });
      }
    },
  });

  return {
    level,
    badges: badges ?? [],
    challenges: challenges ?? [],
    unlockedBadges: badges?.filter(b => b.unlocked) ?? [],
    lockedBadges: badges?.filter(b => !b.unlocked) ?? [],
    isLoading: levelLoading || badgesLoading || challengesLoading,
    addXp,
    unlockBadge,
  };
}
