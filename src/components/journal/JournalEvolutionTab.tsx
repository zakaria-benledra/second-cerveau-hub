import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useJournalAnalysis } from '@/hooks/useJournalAnalysis';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Calendar,
  Sparkles,
  AlertTriangle,
  Sun,
  Moon,
  Target
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PhaseMarker {
  date: string;
  type: 'peak' | 'trough' | 'transition';
  metric: 'clarity' | 'positivity' | 'stress';
  value: number;
  label: string;
}

export function JournalEvolutionTab() {
  const { data: analysis, isLoading, error } = useJournalAnalysis(90);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!analysis?.mentalEvolution) return [];
    
    const { clarity, positivity, stress } = analysis.mentalEvolution;
    
    // Merge all data points by date
    const dataMap = new Map<string, { date: string; clarity?: number; positivity?: number; stress?: number }>();
    
    clarity.forEach(d => {
      if (!dataMap.has(d.date)) dataMap.set(d.date, { date: d.date });
      dataMap.get(d.date)!.clarity = d.value;
    });
    
    positivity.forEach(d => {
      if (!dataMap.has(d.date)) dataMap.set(d.date, { date: d.date });
      dataMap.get(d.date)!.positivity = d.value;
    });
    
    stress.forEach(d => {
      if (!dataMap.has(d.date)) dataMap.set(d.date, { date: d.date });
      dataMap.get(d.date)!.stress = d.value;
    });
    
    return Array.from(dataMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({
        ...d,
        dateLabel: format(parseISO(d.date), 'd MMM', { locale: fr })
      }));
  }, [analysis]);

  // Detect significant phases
  const phases = useMemo((): PhaseMarker[] => {
    if (!analysis?.mentalEvolution || chartData.length < 3) return [];
    
    const phases: PhaseMarker[] = [];
    const metrics: Array<{ key: 'clarity' | 'positivity' | 'stress'; label: string }> = [
      { key: 'clarity', label: 'Clarté' },
      { key: 'positivity', label: 'Positivité' },
      { key: 'stress', label: 'Stress' }
    ];
    
    for (const metric of metrics) {
      const values = chartData
        .filter(d => d[metric.key] !== undefined)
        .map(d => ({ date: d.date, value: d[metric.key] as number }));
      
      if (values.length < 3) continue;
      
      // Find local peaks and troughs
      for (let i = 1; i < values.length - 1; i++) {
        const prev = values[i - 1].value;
        const curr = values[i].value;
        const next = values[i + 1].value;
        
        // Peak detection
        if (curr > prev && curr > next && curr >= 70) {
          phases.push({
            date: values[i].date,
            type: 'peak',
            metric: metric.key,
            value: curr,
            label: `Pic de ${metric.label.toLowerCase()}`
          });
        }
        
        // Trough detection
        if (curr < prev && curr < next && curr <= 30) {
          phases.push({
            date: values[i].date,
            type: 'trough',
            metric: metric.key,
            value: curr,
            label: `Creux de ${metric.label.toLowerCase()}`
          });
        }
        
        // Transition detection (big change)
        if (Math.abs(curr - prev) > 25) {
          phases.push({
            date: values[i].date,
            type: 'transition',
            metric: metric.key,
            value: curr,
            label: curr > prev 
              ? `Amélioration ${metric.label.toLowerCase()}`
              : `Déclin ${metric.label.toLowerCase()}`
          });
        }
      }
    }
    
    // Sort by date and deduplicate
    const seen = new Set<string>();
    return phases
      .filter(p => {
        const key = `${p.date}-${p.metric}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6);
  }, [chartData, analysis]);

  // Calculate period comparison
  const comparison = useMemo(() => {
    if (chartData.length < 4) return null;
    
    const midpoint = Math.floor(chartData.length / 2);
    const firstHalf = chartData.slice(0, midpoint);
    const secondHalf = chartData.slice(midpoint);
    
    const avg = (arr: typeof chartData, key: 'clarity' | 'positivity' | 'stress') => {
      const values = arr.filter(d => d[key] !== undefined).map(d => d[key] as number);
      return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    };
    
    return {
      clarity: {
        first: avg(firstHalf, 'clarity'),
        second: avg(secondHalf, 'clarity'),
        change: avg(secondHalf, 'clarity') - avg(firstHalf, 'clarity')
      },
      positivity: {
        first: avg(firstHalf, 'positivity'),
        second: avg(secondHalf, 'positivity'),
        change: avg(secondHalf, 'positivity') - avg(firstHalf, 'positivity')
      },
      stress: {
        first: avg(firstHalf, 'stress'),
        second: avg(secondHalf, 'stress'),
        change: avg(secondHalf, 'stress') - avg(firstHalf, 'stress')
      }
    };
  }, [chartData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="glass">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>Impossible de charger l'évolution mentale.</AlertDescription>
      </Alert>
    );
  }

  if (!analysis || chartData.length === 0) {
    return (
      <Card className="glass border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Activity className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Pas assez de données pour afficher l'évolution.
          </p>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Écris régulièrement pour voir tes tendances apparaître !
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Evolution Chart */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Évolution mentale
          </CardTitle>
          <CardDescription>
            Suivi de ta clarté, positivité et niveau de stress sur 90 jours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="dateLabel" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  className="fill-muted-foreground"
                />
                <YAxis 
                  domain={[0, 100]} 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  className="fill-muted-foreground"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="clarity" 
                  name="Clarté" 
                  stroke="hsl(262, 85%, 62%)" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="positivity" 
                  name="Positivité" 
                  stroke="hsl(155, 75%, 48%)" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="stress" 
                  name="Stress" 
                  stroke="hsl(0, 65%, 55%)" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Period Comparison */}
      {comparison && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-accent" />
              Comparaison des périodes
            </CardTitle>
            <CardDescription>
              Évolution entre la première et la seconde moitié de la période
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Clarity */}
              <div className={cn(
                "p-4 rounded-xl border",
                comparison.clarity.change >= 0 ? "bg-success/5 border-success/20" : "bg-warning/5 border-warning/20"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Clarté</span>
                  <div className={cn(
                    "flex items-center gap-1 text-sm font-semibold",
                    comparison.clarity.change >= 0 ? "text-success" : "text-warning"
                  )}>
                    {comparison.clarity.change >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {comparison.clarity.change >= 0 ? '+' : ''}{comparison.clarity.change.toFixed(1)}%
                  </div>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Avant: {comparison.clarity.first.toFixed(0)}%</span>
                  <span>Après: {comparison.clarity.second.toFixed(0)}%</span>
                </div>
              </div>

              {/* Positivity */}
              <div className={cn(
                "p-4 rounded-xl border",
                comparison.positivity.change >= 0 ? "bg-success/5 border-success/20" : "bg-warning/5 border-warning/20"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Positivité</span>
                  <div className={cn(
                    "flex items-center gap-1 text-sm font-semibold",
                    comparison.positivity.change >= 0 ? "text-success" : "text-warning"
                  )}>
                    {comparison.positivity.change >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {comparison.positivity.change >= 0 ? '+' : ''}{comparison.positivity.change.toFixed(1)}%
                  </div>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Avant: {comparison.positivity.first.toFixed(0)}%</span>
                  <span>Après: {comparison.positivity.second.toFixed(0)}%</span>
                </div>
              </div>

              {/* Stress (inverted - lower is better) */}
              <div className={cn(
                "p-4 rounded-xl border",
                comparison.stress.change <= 0 ? "bg-success/5 border-success/20" : "bg-warning/5 border-warning/20"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Stress</span>
                  <div className={cn(
                    "flex items-center gap-1 text-sm font-semibold",
                    comparison.stress.change <= 0 ? "text-success" : "text-warning"
                  )}>
                    {comparison.stress.change <= 0 ? (
                      <TrendingDown className="h-4 w-4" />
                    ) : (
                      <TrendingUp className="h-4 w-4" />
                    )}
                    {comparison.stress.change >= 0 ? '+' : ''}{comparison.stress.change.toFixed(1)}%
                  </div>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Avant: {comparison.stress.first.toFixed(0)}%</span>
                  <span>Après: {comparison.stress.second.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phase Timeline */}
      {phases.length > 0 && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Phases marquantes
            </CardTitle>
            <CardDescription>
              Moments clés de ton parcours émotionnel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {phases.map((phase, index) => (
                <div 
                  key={`${phase.date}-${phase.metric}-${index}`}
                  className="flex items-center gap-4"
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                    phase.type === 'peak' && "bg-success/20",
                    phase.type === 'trough' && "bg-warning/20",
                    phase.type === 'transition' && "bg-primary/20"
                  )}>
                    {phase.type === 'peak' ? (
                      <Sun className="h-5 w-5 text-success" />
                    ) : phase.type === 'trough' ? (
                      <Moon className="h-5 w-5 text-warning" />
                    ) : (
                      <Activity className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{phase.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(phase.date), 'd MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                  <Badge 
                    variant="outline"
                    className={cn(
                      phase.metric === 'clarity' && "border-primary text-primary",
                      phase.metric === 'positivity' && "border-success text-success",
                      phase.metric === 'stress' && "border-destructive text-destructive"
                    )}
                  >
                    {phase.value}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insight */}
      {comparison && (
        <Card className="glass border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Insight IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {comparison.positivity.change >= 5 && comparison.stress.change <= -5 && (
                <>
                  🎉 <strong>Excellente progression !</strong> Ta positivité augmente et ton stress diminue. 
                  Continue sur cette lancée, tes efforts de réflexion portent leurs fruits.
                </>
              )}
              {comparison.positivity.change <= -5 && comparison.stress.change >= 5 && (
                <>
                  ⚠️ <strong>Période difficile détectée.</strong> Ta positivité baisse et ton stress augmente. 
                  C'est le moment de prendre soin de toi et peut-être d'en parler à quelqu'un.
                </>
              )}
              {Math.abs(comparison.clarity.change) < 5 && Math.abs(comparison.positivity.change) < 5 && (
                <>
                  📊 <strong>Stabilité émotionnelle.</strong> Tes indicateurs restent relativement stables. 
                  C'est un bon signe d'équilibre, continue à pratiquer ton journal régulièrement.
                </>
              )}
              {comparison.clarity.change >= 10 && (
                <>
                  🧠 <strong>Clarté mentale en hausse !</strong> Tu développes une meilleure compréhension de toi-même. 
                  Le journaling t'aide à organiser tes pensées.
                </>
              )}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
