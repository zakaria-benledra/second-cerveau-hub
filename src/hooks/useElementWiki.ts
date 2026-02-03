import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ElementWiki {
  id: string;
  element_type: 'habit' | 'task' | 'goal';
  linked_item_id: string;
  title: string;
  short_description: string;
  why_this_practice: string;
  scientific_basis: string;
  methodology_source: string;
  how_to_guide: { step: number; description: string }[];
  best_practices: string[];
  common_mistakes: string[];
  immediate_benefits: string[];
  long_term_benefits: string[];
  personalized_tips: string[];
  recommended_time: string;
  duration_minutes: number;
  difficulty_level: number;
  xp_reward: number;
}

export function useElementWiki(elementId: string | undefined) {
  return useQuery({
    queryKey: ['element-wiki', elementId],
    queryFn: async () => {
      if (!elementId) return null;

      const { data, error } = await supabase
        .from('program_elements_wiki')
        .select('*')
        .eq('linked_item_id', elementId)
        .maybeSingle();

      if (error || !data) return null;
      return data as unknown as ElementWiki;
    },
    enabled: !!elementId,
  });
}

export function useProgramWikis(programId: string | undefined) {
  return useQuery({
    queryKey: ['program-wikis', programId],
    queryFn: async () => {
      if (!programId) return [];

      const { data, error } = await supabase
        .from('program_elements_wiki')
        .select('*')
        .eq('program_id', programId);

      if (error) return [];
      return data as unknown as ElementWiki[];
    },
    enabled: !!programId,
  });
}

// Messages Sage du jour
export function useTodaySageMessage(programId: string | undefined, dayNumber: number) {
  return useQuery({
    queryKey: ['sage-daily-message', programId, dayNumber],
    queryFn: async () => {
      if (!programId) return null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('program_daily_messages')
        .select('*')
        .eq('program_id', programId)
        .eq('user_id', user.id)
        .eq('day_number', dayNumber)
        .maybeSingle();

      if (error) return null;
      return data as {
        morning_message: string;
        evening_message: string;
        daily_tip: string;
        reflection_prompt: string;
      } | null;
    },
    enabled: !!programId && dayNumber > 0,
  });
}
