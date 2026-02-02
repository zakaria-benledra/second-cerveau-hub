import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { usePWA } from './usePWA';
import { cacheSuggestions, getCachedSuggestions } from '@/lib/offline-store';

export interface SmartSuggestion {
  title: string;
  description: string;
  interests_combined: string[];
  difficulty: 'facile' | 'moyen' | 'challengeant';
  duration: string;
}

interface SmartSuggestionsResponse {
  suggestions: SmartSuggestion[];
  interests?: string[];
  location?: string;
  message?: string;
  error?: string;
  cached?: boolean;
  responseTime?: number;
}

export function useSmartSuggestions() {
  const { user } = useAuth();
  const { isOnline } = usePWA();

  return useQuery<SmartSuggestion[]>({
    queryKey: ['smart-suggestions', user?.id],
    queryFn: async () => {
      // Offline mode: return cached suggestions
      if (!isOnline) {
        console.log('[SmartSuggestions] Offline - using cached data');
        const cached = await getCachedSuggestions();
        return cached.length > 0 ? cached : [];
      }

      try {
        const { data, error } = await supabase.functions.invoke<SmartSuggestionsResponse>('smart-suggestions');
        
        if (error) {
          console.error('Smart suggestions error:', error);
          // Fallback to cache on error
          const cached = await getCachedSuggestions();
          if (cached.length > 0) {
            console.log('[SmartSuggestions] API error - using cached data');
            return cached;
          }
          throw error;
        }
        
        const suggestions = data?.suggestions || [];
        
        // Cache suggestions for offline use
        if (suggestions.length > 0) {
          await cacheSuggestions(suggestions);
          console.log(`[SmartSuggestions] Cached ${suggestions.length} suggestions (${data?.cached ? 'from server cache' : 'fresh'})`);
        }
        
        return suggestions;
      } catch (error) {
        // Network error - try cache
        console.error('[SmartSuggestions] Network error, trying cache:', error);
        const cached = await getCachedSuggestions();
        if (cached.length > 0) {
          return cached;
        }
        throw error;
      }
    },
    enabled: !!user?.id,
    staleTime: 60 * 60 * 1000, // 1 heure
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// Hook pour gérer les intérêts utilisateur
export function useUserInterests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-interests', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_interests')
        .select(`
          id,
          intensity,
          interests!inner(id, name, category, icon)
        `)
        .eq('user_id', user?.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
}

// Hook pour récupérer tous les intérêts disponibles
export function useAvailableInterests() {
  return useQuery({
    queryKey: ['available-interests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interests')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 heures
  });
}
