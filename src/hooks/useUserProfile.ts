import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AIPreferences {
  suggestion_frequency?: string;
  exploration_enabled?: boolean;
  explain_suggestions?: boolean;
}

export interface UserProfile {
  id: string;
  first_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string;
  theme: string;
  sound_enabled: boolean;
  onboarding_completed: boolean;
  onboarding_step: number;
  preferred_sage_tone: 'encouraging' | 'direct' | 'gentle';
  personalization_level: 'conservative' | 'balanced' | 'exploratory';
  ai_preferences: AIPreferences;
  interests: string[];
  location_city: string | null;
  location_country: string | null;
  birth_year: number | null;
  gender: string | null;
  created_at: string;
  updated_at: string;
}

export function useUserProfile() {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        // Si le profil n'existe pas, le créer
        if (error.code === 'PGRST116') {
          const { data: newProfile } = await supabase
            .from('user_profiles')
            .insert({ id: user.id })
            .select()
            .single();
          return newProfile as UserProfile;
        }
        console.error('Error fetching profile:', error);
        return null;
      }
      return data as UserProfile;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Convert AIPreferences to Json type for Supabase
      const dbUpdates = {
        ...updates,
        updated_at: new Date().toISOString(),
        ai_preferences: updates.ai_preferences ? JSON.parse(JSON.stringify(updates.ai_preferences)) : undefined,
      };
      
      const { data, error } = await supabase
        .from('user_profiles')
        .update(dbUpdates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as UserProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
}

export function useFirstName() {
  const { data: profile, isLoading, error } = useUserProfile();
  
  // Fallback sécurisé
  if (isLoading || error || !profile) {
    return null;
  }
  
  return profile.first_name || profile.display_name || null;
}
