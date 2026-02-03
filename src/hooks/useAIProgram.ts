import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useConfetti } from './useConfetti';

export interface GenerationConfig {
  programType: 'discipline' | 'mental' | 'finance' | 'balanced' | 'custom';
  durationDays: number;
  intensity: 'light' | 'moderate' | 'intense';
  focusAreas: string[];
  customGoal: string;
}

export interface AIGeneratedProgram {
  id: string;
  user_id: string;
  title: string;
  subtitle?: string;
  description: string;
  duration_days: number;
  program_type: string;
  methodologies: string[];
  scientific_references: Array<{ source: string; title: string; key_insight: string }>;
  global_explanation?: string;
  expected_outcomes: string[];
  daily_schedule: Array<{
    day: number;
    focus: string;
    tasks: Array<{ title: string; description: string }>;
    habits: Array<{ name: string; time: string }>;
    reflection_prompt?: string;
    sage_message?: string;
  }>;
  user_profile_snapshot: Record<string, unknown>;
  generation_prompt?: string;
  status: 'active' | 'completed' | 'paused' | 'archived';
  current_day: number;
  started_at: string;
  completed_at?: string;
  total_xp_available: number;
  total_xp_earned: number;
  created_at: string;
  updated_at: string;
}

export interface ProgramElementWiki {
  id: string;
  program_id: string;
  user_id: string;
  element_type: 'habit' | 'task' | 'goal' | 'milestone' | 'reflection';
  linked_item_id?: string;
  title: string;
  short_description?: string;
  why_this_practice: string;
  scientific_basis?: string;
  methodology_source?: string;
  how_to_guide: Array<{ step: number; title: string; description: string; tip?: string }>;
  best_practices: string[];
  common_mistakes: string[];
  immediate_benefits: string[];
  medium_term_benefits: string[];
  long_term_benefits: string[];
  personalized_tips: string[];
  adaptation_suggestions?: string;
  scheduled_day?: number;
  recommended_time?: string;
  duration_minutes?: number;
  frequency?: string;
  difficulty_level: number;
  xp_reward: number;
  streak_bonus_xp: number;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
}

export interface DailyProgramProgress {
  id: string;
  program_id: string;
  user_id: string;
  day_number: number;
  progress_date: string;
  planned_habits: Array<{ id: string; name: string }>;
  planned_tasks: Array<{ id: string; title: string }>;
  daily_focus?: string;
  sage_message_of_day?: string;
  reflection_prompt?: string;
  completed_habits: Array<{ id: string; completed_at: string }>;
  completed_tasks: Array<{ id: string; completed_at: string }>;
  completion_rate: number;
  xp_earned: number;
  user_reflection?: string;
  mood?: string;
  energy_level?: string;
  sage_feedback?: string;
  created_at: string;
}

// Fetch active AI-generated program
export function useActiveAIProgram() {
  return useQuery({
    queryKey: ['active-ai-program'],
    queryFn: async (): Promise<AIGeneratedProgram | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('ai_generated_programs' as never)
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching AI program:', error);
        return null;
      }
      
      return data as unknown as AIGeneratedProgram;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Fetch program elements wiki
export function useProgramWiki(programId: string | undefined) {
  return useQuery({
    queryKey: ['program-wiki', programId],
    queryFn: async (): Promise<ProgramElementWiki[]> => {
      if (!programId) return [];
      
      const { data, error } = await supabase
        .from('program_elements_wiki' as never)
        .select('*')
        .eq('program_id', programId)
        .order('scheduled_day', { ascending: true });
      
      if (error) throw error;
      return (data || []) as unknown as ProgramElementWiki[];
    },
    enabled: !!programId,
  });
}

// Fetch daily progress
export function useDailyProgress(programId: string | undefined, dayNumber?: number) {
  return useQuery({
    queryKey: ['daily-progress', programId, dayNumber],
    queryFn: async (): Promise<DailyProgramProgress | null> => {
      if (!programId) return null;
      
      let query = supabase
        .from('daily_program_progress' as never)
        .select('*')
        .eq('program_id', programId);
      
      if (dayNumber !== undefined) {
        query = query.eq('day_number', dayNumber);
      } else {
        query = query.order('day_number', { ascending: false });
      }
      
      const { data, error } = await query.maybeSingle();
      
      if (error) {
        console.error('Error fetching daily progress:', error);
        return null;
      }
      
      return data as unknown as DailyProgramProgress;
    },
    enabled: !!programId,
  });
}

// Fetch all progress for a program
export function useAllProgress(programId: string | undefined) {
  return useQuery({
    queryKey: ['all-progress', programId],
    queryFn: async (): Promise<DailyProgramProgress[]> => {
      if (!programId) return [];
      
      const { data, error } = await supabase
        .from('daily_program_progress' as never)
        .select('*')
        .eq('program_id', programId)
        .order('day_number', { ascending: true });
      
      if (error) throw error;
      return (data || []) as unknown as DailyProgramProgress[];
    },
    enabled: !!programId,
  });
}

// Complete a day in the program
export function useCompleteDay() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { fire } = useConfetti();
  
  return useMutation({
    mutationFn: async ({ programId, dayNumber, reflection, mood, energyLevel }: {
      programId: string;
      dayNumber: number;
      reflection?: string;
      mood?: string;
      energyLevel?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Update daily progress
      const { error: progressError } = await supabase
        .from('daily_program_progress' as never)
        .upsert({
          program_id: programId,
          user_id: user.id,
          day_number: dayNumber,
          progress_date: new Date().toISOString().split('T')[0],
          completion_rate: 100,
          user_reflection: reflection,
          mood,
          energy_level: energyLevel,
        } as never, { onConflict: 'program_id,day_number' });
      
      if (progressError) throw progressError;
      
      // Update program current_day
      const { data: program, error: programError } = await supabase
        .from('ai_generated_programs' as never)
        .select('duration_days, current_day')
        .eq('id', programId)
        .single();
      
      if (programError) throw programError;
      
      const prog = program as unknown as { duration_days: number; current_day: number };
      const nextDay = dayNumber + 1;
      const isCompleted = nextDay > prog.duration_days;
      
      await supabase
        .from('ai_generated_programs' as never)
        .update({
          current_day: isCompleted ? prog.current_day : nextDay,
          status: isCompleted ? 'completed' : 'active',
          completed_at: isCompleted ? new Date().toISOString() : null,
        } as never)
        .eq('id', programId);
      
      return { isCompleted, nextDay };
    },
    onSuccess: ({ isCompleted, nextDay }) => {
      queryClient.invalidateQueries({ queryKey: ['active-ai-program'] });
      queryClient.invalidateQueries({ queryKey: ['daily-progress'] });
      queryClient.invalidateQueries({ queryKey: ['all-progress'] });
      
      if (isCompleted) {
        fire('fireworks');
        toast({
          title: '🎉 Programme terminé !',
          description: 'Félicitations ! Tu as complété tout le programme.',
        });
      } else {
        toast({
          title: '✅ Jour complété !',
          description: `Jour ${nextDay} débloqué. Continue !`,
        });
      }
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

// Archive current program
export function useArchiveProgram() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (programId: string) => {
      const { error } = await supabase
        .from('ai_generated_programs' as never)
        .update({ status: 'archived' } as never)
        .eq('id', programId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-ai-program'] });
      toast({
        title: 'Programme archivé',
        description: 'Tu peux maintenant créer un nouveau programme.',
      });
    },
  });
}

// Generate a new AI program
export function useGenerateProgram() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { fire } = useConfetti();
  
  return useMutation({
    mutationFn: async (config: GenerationConfig) => {
      const { data, error } = await supabase.functions.invoke('generate-ai-program', {
        body: { request: config },
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['active-ai-program'] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['program-wiki'] });
      
      fire('fireworks');
      
      toast({
        title: `🚀 Programme "${data.program.title}" créé !`,
        description: `${data.program.habits_created} habitudes et ${data.program.tasks_created} tâches générées`,
        duration: 5000,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur de génération',
        description: error.message || 'Impossible de générer le programme',
        variant: 'destructive',
      });
    },
  });
}
