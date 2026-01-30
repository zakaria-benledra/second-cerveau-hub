import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface JournalAISuggestion {
  id: string;
  suggestion: string;
  suggestion_type: string;
  accepted: boolean;
}

export function useJournalAI() {
  const queryClient = useQueryClient();

  // Get AI suggestions for current journal entry
  const getSuggestionsMutation = useMutation({
    mutationFn: async ({ 
      entryId, 
      domain, 
      moodScore, 
      content 
    }: { 
      entryId?: string; 
      domain?: string; 
      moodScore?: number; 
      content?: string;
    }): Promise<string[]> => {
      const { data, error } = await supabase.functions.invoke('journal-ai-assist', {
        body: {
          action: 'get_suggestions',
          entry_id: entryId,
          domain,
          mood_score: moodScore,
          content
        }
      });

      if (error) throw error;
      return data.suggestions || [];
    }
  });

  // Accept a suggestion
  const acceptSuggestionMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      const { data, error } = await supabase.functions.invoke('journal-ai-assist', {
        body: {
          action: 'accept_suggestion',
          suggestion_id: suggestionId
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-ai-suggestions'] });
    }
  });

  // Get reformulation suggestions
  const getReformulationMutation = useMutation({
    mutationFn: async (content: string): Promise<string[]> => {
      const { data, error } = await supabase.functions.invoke('journal-ai-assist', {
        body: {
          action: 'reformulate',
          content
        }
      });

      if (error) throw error;
      return data.reformulations || [];
    }
  });

  // Get suggestion history for an entry
  const useSuggestionHistory = (entryId: string | undefined) => {
    return useQuery({
      queryKey: ['journal-ai-suggestions', entryId],
      queryFn: async () => {
        if (!entryId) return [];

        const { data, error } = await supabase
          .from('journal_ai_assists')
          .select('*')
          .eq('entry_id', entryId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data as JournalAISuggestion[];
      },
      enabled: !!entryId
    });
  };

  return {
    // Get suggestions
    getSuggestions: getSuggestionsMutation.mutateAsync,
    isGettingSuggestions: getSuggestionsMutation.isPending,
    suggestions: getSuggestionsMutation.data || [],

    // Accept suggestion
    acceptSuggestion: acceptSuggestionMutation.mutate,
    isAccepting: acceptSuggestionMutation.isPending,

    // Reformulation
    getReformulations: getReformulationMutation.mutateAsync,
    isReformulating: getReformulationMutation.isPending,
    reformulations: getReformulationMutation.data || [],

    // History
    useSuggestionHistory,
  };
}

// Mood to score conversion
export function moodToScore(mood: string): number {
  const scores: Record<string, number> = {
    great: 90,
    good: 70,
    okay: 50,
    bad: 30,
    terrible: 10
  };
  return scores[mood] || 50;
}

// Domain options for journal
export const journalDomains = [
  { value: 'travail', label: 'Travail', icon: '💼' },
  { value: 'santé', label: 'Santé', icon: '💪' },
  { value: 'finance', label: 'Finance', icon: '💰' },
  { value: 'relation', label: 'Relations', icon: '❤️' },
  { value: 'identité', label: 'Identité', icon: '🧠' }
];
