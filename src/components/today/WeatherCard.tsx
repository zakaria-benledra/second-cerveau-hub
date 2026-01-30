import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTodayWeather, useWeatherHistory, getWeatherIcon, getWeatherLabel, getMoodImpact } from '@/hooks/useWeather';
import { Skeleton } from '@/components/ui/skeleton';
import { Cloud, Thermometer, Droplets, TrendingUp, AlertTriangle, Zap, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

// Behavioral prediction based on weather
function getBehavioralPrediction(weather: string, moodIndex: number): { 
  label: string; 
  description: string; 
  variant: 'success' | 'warning' | 'default';
  icon: React.ReactNode;
} {
  if (moodIndex >= 70 && (weather === 'clear' || weather === 'partly_cloudy')) {
    return {
      label: 'Conditions favorables au focus',
      description: 'Profitez pour les tâches complexes',
      variant: 'success',
      icon: <Zap className="h-3 w-3" />,
    };
  }
  if (moodIndex < 50 || weather === 'rain' || weather === 'storm') {
    return {
      label: 'Risque de baisse d\'énergie',
      description: 'Privilégiez les habitudes clés',
      variant: 'warning',
      icon: <AlertTriangle className="h-3 w-3" />,
    };
  }
  return {
    label: 'Conditions neutres',
    description: 'Journée standard prévue',
    variant: 'default',
    icon: <Brain className="h-3 w-3" />,
  };
}

export function WeatherCard() {
  const { data: weather, isLoading } = useTodayWeather();
  const { data: history = [] } = useWeatherHistory(7);

  // Mini sparkline data for weather vs mood correlation
  const correlationData = useMemo(() => {
    return history.slice(0, 7).reverse().map(h => ({
      temp: h.temp,
      mood: Number(h.mood_index) || 50,
    }));
  }, [history]);

  if (isLoading) {
    return (
      <Card className="border-2 border-border">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!weather) {
    return null;
  }

  const moodIndex = Number(weather.mood_index) || 50;
  const moodImpact = getMoodImpact(moodIndex);
  const prediction = getBehavioralPrediction(weather.weather || 'clear', moodIndex);

  return (
    <Card className="border-2 border-border bg-gradient-to-br from-background to-muted/30 hover-lift transition-all">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Cloud className="h-4 w-4" />
          Météo & Impact Comportemental
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
            <p className={cn('text-sm font-semibold', moodImpact.color)}>
              {moodImpact.label}
            </p>
            <p className="text-xs text-muted-foreground">
              Index: {Math.round(moodIndex)}%
            </p>
          </div>
        </div>

        {/* Behavioral Prediction Badge */}
        <div className={cn(
          'p-3 rounded-lg border flex items-start gap-3',
          prediction.variant === 'success' && 'bg-success/5 border-success/20',
          prediction.variant === 'warning' && 'bg-warning/5 border-warning/20',
          prediction.variant === 'default' && 'bg-muted/50 border-border'
        )}>
          <div className={cn(
            'p-1.5 rounded-full',
            prediction.variant === 'success' && 'bg-success/15 text-success',
            prediction.variant === 'warning' && 'bg-warning/15 text-warning',
            prediction.variant === 'default' && 'bg-muted text-muted-foreground'
          )}>
            {prediction.icon}
          </div>
          <div>
            <p className={cn(
              'text-sm font-medium',
              prediction.variant === 'success' && 'text-success',
              prediction.variant === 'warning' && 'text-warning'
            )}>
              {prediction.label}
            </p>
            <p className="text-xs text-muted-foreground">{prediction.description}</p>
          </div>
        </div>

        {/* Mini correlation sparkline */}
        {correlationData.length > 0 && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Corrélation météo ↔ humeur (7j)</p>
            <div className="flex items-end gap-1 h-8">
              {correlationData.map((d, i) => (
                <div 
                  key={i} 
                  className="flex-1 flex flex-col items-center gap-0.5"
                >
                  <div 
                    className="w-full rounded-t bg-primary/60"
                    style={{ height: `${Math.max(4, d.mood * 0.3)}px` }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Productivity Correlation */}
        {Number(weather.productivity_correlation) > 0 && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              📊 Corrélation productivité estimée: {Math.round(Number(weather.productivity_correlation))}%
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
