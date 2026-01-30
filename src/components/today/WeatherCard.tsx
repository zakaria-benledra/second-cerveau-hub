import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTodayWeather, getWeatherIcon, getWeatherLabel, getMoodImpact } from '@/hooks/useWeather';
import { Skeleton } from '@/components/ui/skeleton';
import { Cloud, Thermometer, Droplets, TrendingUp } from 'lucide-react';

export function WeatherCard() {
  const { data: weather, isLoading } = useTodayWeather();

  if (isLoading) {
    return (
      <Card className="border-2 border-border">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!weather) {
    return null;
  }

  const moodImpact = getMoodImpact(Number(weather.mood_index) || 50);

  return (
    <Card className="border-2 border-border bg-gradient-to-br from-background to-muted/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Cloud className="h-4 w-4" />
          Météo & Impact
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          {/* Weather Icon & Condition */}
          <div className="flex items-center gap-3">
            <span className="text-4xl">{getWeatherIcon(weather.weather || 'clear')}</span>
            <div>
              <p className="font-semibold">{getWeatherLabel(weather.weather || 'clear')}</p>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Thermometer className="h-3 w-3" />
                  {weather.temp}°C
                </span>
                <span className="flex items-center gap-1">
                  <Droplets className="h-3 w-3" />
                  {weather.humidity}%
                </span>
              </div>
            </div>
          </div>

          {/* Mood Impact */}
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Productivité</span>
            </div>
            <p className={`text-sm font-semibold ${moodImpact.color}`}>
              {moodImpact.label}
            </p>
            <p className="text-xs text-muted-foreground">
              Index: {Math.round(Number(weather.mood_index) || 50)}%
            </p>
          </div>
        </div>

        {/* Productivity Correlation */}
        {Number(weather.productivity_correlation) > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              📊 Corrélation productivité estimée: {Math.round(Number(weather.productivity_correlation))}%
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
