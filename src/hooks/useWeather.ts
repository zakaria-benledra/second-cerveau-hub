import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type WeatherSnapshot = Tables<'weather_snapshots'>;

export function useTodayWeather() {
  return useQuery({
    queryKey: ['weather', 'today'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('sync-weather', {
        body: {},
      });
      if (error) throw error;
      return data?.data as WeatherSnapshot | null;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
  });
}

export function useWeatherHistory(days = 7) {
  return useQuery({
    queryKey: ['weather', 'history', days],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('weather_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;
      return data as WeatherSnapshot[];
    },
  });
}

export function getWeatherIcon(weather: string): string {
  switch (weather) {
    case 'clear':
      return '☀️';
    case 'partly_cloudy':
      return '⛅';
    case 'cloudy':
      return '☁️';
    case 'rain':
      return '🌧️';
    case 'snow':
      return '❄️';
    case 'storm':
      return '⛈️';
    default:
      return '🌤️';
  }
}

export function getWeatherLabel(weather: string): string {
  switch (weather) {
    case 'clear':
      return 'Ensoleillé';
    case 'partly_cloudy':
      return 'Partiellement nuageux';
    case 'cloudy':
      return 'Nuageux';
    case 'rain':
      return 'Pluie';
    case 'snow':
      return 'Neige';
    case 'storm':
      return 'Orage';
    default:
      return 'Variable';
  }
}

export function getMoodImpact(moodIndex: number): { label: string; color: string } {
  if (moodIndex >= 70) return { label: 'Impact positif', color: 'text-green-500' };
  if (moodIndex >= 50) return { label: 'Impact neutre', color: 'text-muted-foreground' };
  if (moodIndex >= 30) return { label: 'Impact léger', color: 'text-yellow-500' };
  return { label: 'Impact négatif', color: 'text-red-500' };
}
