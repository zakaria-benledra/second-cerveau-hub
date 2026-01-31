import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EmotionData {
  name: string;
  frequency: number;
  emoji: string;
}

export interface DomainData {
  name: string;
  count: number;
}

export interface CognitivePatternData {
  type: string;
  description: string;
  occurrences: number;
  sentiment: 'negative' | 'positive' | 'neutral';
}

export interface MentalEvolutionData {
  clarity: Array<{ date: string; value: number }>;
  positivity: Array<{ date: string; value: number }>;
  stress: Array<{ date: string; value: number }>;
}

export interface JournalAnalysisResult {
  recurringEmotions: EmotionData[];
  thinkingDomains: DomainData[];
  cognitivePatterns: CognitivePatternData[];
  mentalEvolution: MentalEvolutionData;
  summary?: {
    dominantEmotion: string | null;
    mainFocus: string | null;
    patternBalance: 'positive' | 'needs_attention';
    entriesAnalyzed: number;
    periodDays: number;
  };
}

export function useJournalAnalysis(days: number = 90) {
  return useQuery({
    queryKey: ['journal-analysis', days],
    queryFn: async (): Promise<JournalAnalysisResult> => {
      const { data, error } = await supabase.functions.invoke('analyze-journal', {
        body: { days },
      });

      if (error) throw error;
      return data as JournalAnalysisResult;
    },
    staleTime: 1000 * 60 * 15, // 15 minutes cache
    refetchOnWindowFocus: false,
  });
}
