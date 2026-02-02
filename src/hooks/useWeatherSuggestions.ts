import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTodayWeather, getWeatherLabel } from './useWeather';

export interface WeatherData {
  condition: 'clear' | 'partly_cloudy' | 'cloudy' | 'rain' | 'snow' | 'storm';
  temperature: number;
  humidity: number;
  description: string;
}

export interface WeatherSuggestion {
  activity: string;
  reason: string;
  indoor: boolean;
  interests: string[];
}

export function useWeatherSuggestions() {
  const { data: weatherSnapshot, isLoading: weatherLoading } = useTodayWeather();

  // Transform weather_snapshot to WeatherData format
  // Note: table uses 'weather' and 'temp' columns
  const weather: WeatherData | null = weatherSnapshot ? {
    condition: (weatherSnapshot.weather ?? 'clear') as WeatherData['condition'],
    temperature: weatherSnapshot.temp ?? 20,
    humidity: weatherSnapshot.humidity ?? 50,
    description: getWeatherLabel(weatherSnapshot.weather ?? 'clear'),
  } : null;

  const location = weatherSnapshot?.location ?? null;

  const { data: suggestions, isLoading: suggestionsLoading } = useQuery<WeatherSuggestion[]>({
    queryKey: ['weather-suggestions', weather?.condition, weather?.temperature],
    queryFn: async () => {
      if (!weather) return [];

      const { data, error } = await supabase.functions.invoke('smart-suggestions', {
        body: {
          includeWeather: true,
          weather: {
            condition: weather.condition,
            temperature: weather.temperature,
            humidity: weather.humidity,
            description: weather.description,
          },
        },
      });

      if (error) throw error;

      return data?.weatherSuggestions || [];
    },
    enabled: !!weather,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  return {
    weather,
    suggestions: suggestions ?? [],
    location,
    isLoading: weatherLoading || suggestionsLoading,
  };
}
