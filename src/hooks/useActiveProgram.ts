import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useGamification } from './useGamification';
import { useConfetti } from './useConfetti';

export interface Program {
  id: string;
  name: string;
  slug: string;
  description: string;
  duration_days: number;
  focus_domain: string;
  difficulty: string;
  icon: string;
  xp_reward: number;
  is_active: boolean;
}

export interface ProgramDay {
  id: string;
  program_id: string;
  day_number: number;
  title: string;
  description: string;
  mission_type: string;
  mission_target: Record<string, unknown>;
  sage_tip: string;
  xp_reward: number;
}

export interface UserProgram {
  id: string;
  user_id: string;
  program_id: string;
  status: 'active' | 'completed' | 'paused' | 'abandoned';
  started_at: string;
  current_day: number;
  total_xp_earned: number;
  programs: Program;
  todayMission?: ProgramDay;
  progress?: number;
}

export function useActiveProgram() {
  return useQuery({
    queryKey: ['active-program'],
    queryFn: async (): Promise<UserProgram | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: userProgram, error } = await supabase
        .from('user_programs' as never)
        .select('*, programs(*)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      
      if (error || !userProgram) return null;
      
      const program = userProgram as unknown as UserProgram;
      
      const { data: todayMission } = await supabase
        .from('program_days' as never)
        .select('*')
        .eq('program_id', program.program_id)
        .eq('day_number', program.current_day)
        .maybeSingle();
      
      const progress = Math.round((program.current_day / program.programs.duration_days) * 100);
      
      return {
        ...program,
        todayMission: todayMission as ProgramDay | undefined,
        progress,
      };
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useAvailablePrograms() {
  return useQuery({
    queryKey: ['available-programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs' as never)
        .select('*')
        .eq('is_active', true)
        .order('duration_days');
      
      if (error) throw error;
      return data as unknown as Program[];
    },
  });
}

export function useJoinProgram() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { fire } = useConfetti();
  
  return useMutation({
    mutationFn: async (programId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Appeler l'Edge Function de bootstrap
      const response = await supabase.functions.invoke('bootstrap-program', {
        body: { programId, userId: user.id },
      });
      
      if (response.error) throw response.error;
      
      return response.data as {
        success: boolean;
        userProgramId: string;
        programName: string;
        itemsCreated: number;
        details: { habits: number; tasks: number; goals: number };
        archivedPrevious: boolean;
      };
    },
    onSuccess: (data) => {
      // Invalider TOUS les caches pertinents
      queryClient.invalidateQueries({ queryKey: ['active-program'] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['gamification-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-badges'] });
      queryClient.invalidateQueries({ queryKey: ['current-identity'] });
      
      // Célébration
      fire('fireworks');
      
      toast({
        title: `🚀 Programme "${data.programName}" lancé !`,
        description: `${data.itemsCreated} éléments créés automatiquement`,
        duration: 5000,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de démarrer le programme',
        variant: 'destructive',
      });
    },
  });
}

export function useCompleteMission() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { addXP } = useGamification();
  
  return useMutation({
    mutationFn: async ({ userProgramId, programDayId, xpReward }: {
      userProgramId: string;
      programDayId: string;
      xpReward: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Enregistrer la progression
      const { error: progressError } = await supabase
        .from('user_program_progress' as never)
        .upsert({
          user_id: user.id,
          user_program_id: userProgramId,
          program_day_id: programDayId,
          main_mission_completed: true,
          xp_earned: xpReward,
          completed_at: new Date().toISOString(),
        } as never);
      
      if (progressError) throw progressError;
      
      // Avancer au jour suivant
      const { data: userProgram } = await supabase
        .from('user_programs' as never)
        .select('*, programs(*)')
        .eq('id', userProgramId)
        .single();
      
      if (userProgram) {
        const program = userProgram as unknown as UserProgram;
        const nextDay = program.current_day + 1;
        const isCompleted = nextDay > program.programs.duration_days;
        
        await supabase
          .from('user_programs' as never)
          .update({
            current_day: isCompleted ? program.current_day : nextDay,
            status: isCompleted ? 'completed' : 'active',
            completed_at: isCompleted ? new Date().toISOString() : null,
            total_xp_earned: (program.total_xp_earned || 0) + xpReward,
          } as never)
          .eq('id', userProgramId);
        
        return { isCompleted, nextDay, program: program.programs };
      }
      
      return { isCompleted: false, nextDay: 1, program: null };
    },
    onSuccess: async ({ isCompleted, program, nextDay }, { xpReward }) => {
      queryClient.invalidateQueries({ queryKey: ['active-program'] });
      
      if (addXP) {
        await addXP.mutateAsync({ amount: xpReward, reason: 'bonus' });
      }
      
      if (isCompleted && program) {
        toast({
          title: '🎉 Programme terminé !',
          description: `${program.name} complété ! +${program.xp_reward} XP bonus`,
        });
        if (addXP) {
          await addXP.mutateAsync({ amount: program.xp_reward, reason: 'challenge_complete' });
        }
      } else {
        toast({
          title: '✅ Mission accomplie !',
          description: `+${xpReward} XP - Jour ${nextDay} débloqué`,
        });
      }
    },
  });
}
