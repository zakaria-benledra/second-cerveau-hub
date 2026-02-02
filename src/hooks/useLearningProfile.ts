import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface LearningProfile {
  totalInteractions: number;
  positiveFeedbackRate: number;
  preferredTone: string;
  responseLengthPref: string;
  bestEngagementTime: string | null;
  prefCoachMotivation: number;
  prefCoachPractical: number;
  prefCoachAnalytical: number;
  prefJournalIntrospection: number;
  prefJournalGratitude: number;
  prefJournalGoals: number;
  learningData: Record<string, unknown>;
}

export function useLearningProfile() {
  const { user } = useAuth();

  return useQuery<LearningProfile | null>({
    queryKey: ['learning-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_learning_profile')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error || !data) return null;

      return {
        totalInteractions: data.total_interactions ?? 0,
        positiveFeedbackRate: data.positive_feedback_rate ?? 0.5,
        preferredTone: data.preferred_tone ?? 'balanced',
        responseLengthPref: data.response_length_pref ?? 'medium',
        bestEngagementTime: data.best_engagement_time ?? null,
        prefCoachMotivation: data.pref_coach_motivation ?? 50,
        prefCoachPractical: data.pref_coach_practical ?? 50,
        prefCoachAnalytical: data.pref_coach_analytical ?? 50,
        prefJournalIntrospection: data.pref_journal_introspection ?? 50,
        prefJournalGratitude: data.pref_journal_gratitude ?? 50,
        prefJournalGoals: data.pref_journal_goals ?? 50,
        learningData: (data.learning_data as Record<string, unknown>) ?? {},
      };
    },
    enabled: !!user?.id,
  });
}

// Utility to get engagement quality score based on learning profile
export function getEngagementQuality(profile: LearningProfile | null): 'excellent' | 'good' | 'needs_attention' {
  if (!profile) return 'good';
  
  if (profile.positiveFeedbackRate >= 0.7 && profile.totalInteractions >= 10) {
    return 'excellent';
  }
  if (profile.positiveFeedbackRate < 0.3 && profile.totalInteractions >= 5) {
    return 'needs_attention';
  }
  return 'good';
}
