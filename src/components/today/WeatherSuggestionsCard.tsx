import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sun, Cloud, CloudRain, Snowflake, CloudLightning, CloudSun, Thermometer } from 'lucide-react';
import { useWeatherSuggestions } from '@/hooks/useWeatherSuggestions';

const WEATHER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  clear: Sun,
  sunny: Sun,
  partly_cloudy: CloudSun,
  cloudy: Cloud,
  rain: CloudRain,
  rainy: CloudRain,
  snow: Snowflake,
  snowy: Snowflake,
  storm: CloudLightning,
  stormy: CloudLightning,
};

const WEATHER_COLORS: Record<string, string> = {
  clear: 'text-warning',
  sunny: 'text-warning',
  partly_cloudy: 'text-muted-foreground',
  cloudy: 'text-muted-foreground',
  rain: 'text-primary',
  rainy: 'text-primary',
  snow: 'text-accent',
  snowy: 'text-accent',
  storm: 'text-destructive',
  stormy: 'text-destructive',
};

export function WeatherSuggestionsCard() {
  const { weather, suggestions, location, isLoading } = useWeatherSuggestions();

  if (isLoading) {
    return (
      <Card className="glass">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!weather || !location) return null;

  const Icon = WEATHER_ICONS[weather.condition] || Cloud;
  const colorClass = WEATHER_COLORS[weather.condition] || 'text-muted-foreground';

  // Parse location to show just city
  const cityName = typeof location === 'string' 
    ? location.split(',')[0] 
    : 'Ta ville';

  return (
    <Card className="glass overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${colorClass}`} />
            <span>Météo à {cityName}</span>
          </div>
          <div className="flex items-center gap-1 text-sm font-normal text-muted-foreground">
            <Thermometer className="h-4 w-4" />
            <span>{weather.temperature}°C</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{weather.description}</p>

        {suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Suggestions adaptées à la météo
            </p>
            <div className="space-y-2">
              {suggestions.slice(0, 2).map((suggestion, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-muted/50 border border-border/50"
                >
                  <p className="font-medium text-sm">{suggestion.activity}</p>
                  <p className="text-xs text-muted-foreground mt-1">{suggestion.reason}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {suggestion.indoor ? '🏠 Indoor' : '🌳 Outdoor'}
                    </Badge>
                    {suggestion.interests?.map((interest) => (
                      <Badge key={interest} variant="secondary" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
