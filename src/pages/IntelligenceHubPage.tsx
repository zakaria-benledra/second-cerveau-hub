import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTodayScore, useWeeklyScores } from '@/hooks/useScores';
import { ScoreRing } from '@/components/today/ScoreRing';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Brain,
  Target,
  Flame,
  Clock,
  Loader2,
  RefreshCw,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Minus
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export default function IntelligenceHubPage() {
  const [activeTab, setActiveTab] = useState('score');
  
  const { data: todayScore, isLoading: scoreLoading } = useTodayScore();
  const { data: weeklyScores = [] } = useWeeklyScores();

  // Fetch daily stats for trends
  const { data: dailyStats = [], isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['intelligence-daily-stats'],
    queryFn: async () => {
      const startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('daily_stats')
        .select('*')
        .gte('date', startDate)
        .order('date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate trend data
  const trendData = useMemo(() => {
    if (dailyStats.length < 7) return null;

    const last7 = dailyStats.slice(-7);
    const prev7 = dailyStats.slice(-14, -7);

    const calcAvg = (arr: any[], key: string) => {
      if (arr.length === 0) return 0;
      return arr.reduce((sum, s) => sum + (s[key] || 0), 0) / arr.length;
    };

    const habitRateLast = last7.map(s => s.habits_total > 0 ? s.habits_completed / s.habits_total * 100 : 0);
    const taskRateLast = last7.map(s => s.tasks_planned > 0 ? s.tasks_completed / s.tasks_planned * 100 : 0);
    const focusLast = last7.map(s => s.focus_minutes || 0);

    const habitRatePrev = prev7.map(s => s.habits_total > 0 ? s.habits_completed / s.habits_total * 100 : 0);
    const taskRatePrev = prev7.map(s => s.tasks_planned > 0 ? s.tasks_completed / s.tasks_planned * 100 : 0);
    const focusPrev = prev7.map(s => s.focus_minutes || 0);

    return {
      habits: {
        current: Math.round(habitRateLast.reduce((a, b) => a + b, 0) / 7),
        trend: Math.round((habitRateLast.reduce((a, b) => a + b, 0) - habitRatePrev.reduce((a, b) => a + b, 0)) / 7),
        data: habitRateLast,
      },
      tasks: {
        current: Math.round(taskRateLast.reduce((a, b) => a + b, 0) / 7),
        trend: Math.round((taskRateLast.reduce((a, b) => a + b, 0) - taskRatePrev.reduce((a, b) => a + b, 0)) / 7),
        data: taskRateLast,
      },
      focus: {
        current: Math.round(focusLast.reduce((a, b) => a + b, 0) / 7),
        trend: Math.round((focusLast.reduce((a, b) => a + b, 0) - focusPrev.reduce((a, b) => a + b, 0)) / 7),
        data: focusLast,
      },
    };
  }, [dailyStats]);

  // Generate AI insights
  const insights = useMemo(() => {
    const results: Array<{
      type: 'positive' | 'warning' | 'neutral';
      title: string;
      description: string;
      metric?: string;
    }> = [];

    if (!trendData || !todayScore) return results;

    // Score insight
    if (todayScore.global_score >= 80) {
      results.push({
        type: 'positive',
        title: 'Performance exceptionnelle',
        description: 'Votre score global est excellent. Maintenez ce rythme !',
        metric: `${todayScore.global_score}/100`,
      });
    } else if (todayScore.global_score < 50) {
      results.push({
        type: 'warning',
        title: 'Score en dessous de la moyenne',
        description: 'Concentrez-vous sur vos habitudes clés pour remonter.',
        metric: `${todayScore.global_score}/100`,
      });
    }

    // Habit trend insight
    if (trendData.habits.trend > 10) {
      results.push({
        type: 'positive',
        title: 'Progression des habitudes',
        description: `+${trendData.habits.trend}% cette semaine. Excellente discipline !`,
      });
    } else if (trendData.habits.trend < -10) {
      results.push({
        type: 'warning',
        title: 'Baisse des habitudes',
        description: `${trendData.habits.trend}% cette semaine. Attention au décrochage.`,
      });
    }

    // Focus insight
    if (trendData.focus.current > 120) {
      results.push({
        type: 'positive',
        title: 'Temps de focus élevé',
        description: `${trendData.focus.current} minutes en moyenne. Discipline optimale.`,
      });
    } else if (trendData.focus.current < 30) {
      results.push({
        type: 'warning',
        title: 'Peu de temps de focus',
        description: 'Planifiez des blocs de concentration pour renforcer votre discipline.',
      });
    }

    // Momentum insight
    if (todayScore.momentum_index > 0.1) {
      results.push({
        type: 'positive',
        title: 'Momentum positif',
        description: 'Vous êtes dans une phase ascendante. Capitalisez !',
      });
    } else if (todayScore.momentum_index < -0.1) {
      results.push({
        type: 'warning',
        title: 'Momentum négatif',
        description: 'Identifiez les blocages et simplifiez vos objectifs.',
      });
    }

    return results;
  }, [trendData, todayScore]);

  const isLoading = scoreLoading || statsLoading;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gradient flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              Intelligence Hub
            </h1>
            <p className="text-muted-foreground mt-1">
              Scores, tendances et insights comportementaux
            </p>
          </div>
          <Button variant="outline" onClick={() => refetchStats()} className="glass-hover gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        </div>

        {/* Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="glass-strong">
            <TabsTrigger value="score" className="gap-2">
              <Target className="h-4 w-4" />
              Score
            </TabsTrigger>
            <TabsTrigger value="trends" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Tendances
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-2">
              <Brain className="h-4 w-4" />
              Insights
            </TabsTrigger>
          </TabsList>

          {/* SCORE TAB */}
          <TabsContent value="score" className="space-y-6 mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Main Score */}
                <div className="grid gap-4 md:grid-cols-5">
                  <Card className="glass-strong md:col-span-2 md:row-span-2">
                    <CardContent className="pt-6 flex flex-col items-center justify-center h-full">
                      <ScoreRing
                        value={todayScore?.global_score ?? 0}
                        size="xl"
                        label="Global"
                        sublabel="Score du jour"
                        onClick={() => {}}
                      />
                      <div className="flex items-center gap-2 mt-4">
                        {(todayScore?.momentum_index ?? 0) > 0 ? (
                          <TrendingUp className="h-4 w-4 text-success" />
                        ) : (todayScore?.momentum_index ?? 0) < 0 ? (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        ) : (
                          <Minus className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm text-muted-foreground">
                          Momentum: {((todayScore?.momentum_index ?? 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sub-scores */}
                  <Card className="glass-hover hover-lift">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-success/15">
                          <Flame className="h-5 w-5 text-success" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold tabular-nums">
                            {todayScore?.habits_score ?? 0}
                          </p>
                          <p className="text-xs text-muted-foreground">Habitudes</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-hover hover-lift">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/15">
                          <Target className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold tabular-nums">
                            {todayScore?.tasks_score ?? 0}
                          </p>
                          <p className="text-xs text-muted-foreground">Tâches</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-hover hover-lift">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-accent/15">
                          <Clock className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold tabular-nums">
                            {todayScore?.health_score ?? 0}
                          </p>
                          <p className="text-xs text-muted-foreground">Santé</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-hover hover-lift">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-warning/15">
                          <TrendingUp className="h-5 w-5 text-warning" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold tabular-nums">
                            {todayScore?.finance_score ?? 0}
                          </p>
                          <p className="text-xs text-muted-foreground">Finance</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-hover hover-lift">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-destructive/15">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold tabular-nums">
                            {todayScore?.burnout_index ?? 0}
                          </p>
                          <p className="text-xs text-muted-foreground">Burnout Index</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Weekly Mini Chart */}
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="text-lg">Scores hebdomadaires</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-2 h-32">
                      {weeklyScores.map((score, i) => (
                        <div 
                          key={i}
                          className="flex-1 flex flex-col items-center gap-2"
                        >
                          <div 
                            className={cn(
                              'w-full rounded-t transition-all',
                              score.global_score >= 70 ? 'bg-success' : 
                              score.global_score >= 40 ? 'bg-warning' : 'bg-destructive/70'
                            )}
                            style={{ height: `${Math.max(8, score.global_score)}px` }}
                          />
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(score.week_start), 'd/M', { locale: fr })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* TRENDS TAB */}
          <TabsContent value="trends" className="space-y-6 mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : trendData ? (
              <div className="grid gap-4 md:grid-cols-3">
                {/* Habits Trend */}
                <Card className="glass-strong">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Flame className="h-5 w-5 text-warning" />
                        Habitudes
                      </span>
                      <Badge className={cn(
                        trendData.habits.trend > 0 ? 'bg-success/15 text-success' : 
                        trendData.habits.trend < 0 ? 'bg-destructive/15 text-destructive' : 
                        'bg-muted text-muted-foreground',
                        'border-0'
                      )}>
                        {trendData.habits.trend > 0 ? '+' : ''}{trendData.habits.trend}%
                      </Badge>
                    </CardTitle>
                    <CardDescription>Taux de complétion sur 7 jours</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-center mb-4">
                      {trendData.habits.current}%
                    </div>
                    <div className="flex items-end gap-1 h-16">
                      {trendData.habits.data.map((val, i) => (
                        <div 
                          key={i}
                          className="flex-1 bg-warning rounded-t"
                          style={{ height: `${Math.max(4, val * 0.6)}px` }}
                        />
                      ))}
                    </div>
                    <Link to="/history?metric=habits" className="flex items-center justify-center gap-1 mt-4 text-xs text-primary hover:underline">
                      Voir détails <ChevronRight className="h-3 w-3" />
                    </Link>
                  </CardContent>
                </Card>

                {/* Tasks Trend */}
                <Card className="glass-strong">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Tâches
                      </span>
                      <Badge className={cn(
                        trendData.tasks.trend > 0 ? 'bg-success/15 text-success' : 
                        trendData.tasks.trend < 0 ? 'bg-destructive/15 text-destructive' : 
                        'bg-muted text-muted-foreground',
                        'border-0'
                      )}>
                        {trendData.tasks.trend > 0 ? '+' : ''}{trendData.tasks.trend}%
                      </Badge>
                    </CardTitle>
                    <CardDescription>Taux d'accomplissement sur 7 jours</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-center mb-4">
                      {trendData.tasks.current}%
                    </div>
                    <div className="flex items-end gap-1 h-16">
                      {trendData.tasks.data.map((val, i) => (
                        <div 
                          key={i}
                          className="flex-1 bg-primary rounded-t"
                          style={{ height: `${Math.max(4, val * 0.6)}px` }}
                        />
                      ))}
                    </div>
                    <Link to="/history?metric=tasks" className="flex items-center justify-center gap-1 mt-4 text-xs text-primary hover:underline">
                      Voir détails <ChevronRight className="h-3 w-3" />
                    </Link>
                  </CardContent>
                </Card>

                {/* Focus Trend */}
                <Card className="glass-strong">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-accent" />
                        Focus
                      </span>
                      <Badge className={cn(
                        trendData.focus.trend > 0 ? 'bg-success/15 text-success' : 
                        trendData.focus.trend < 0 ? 'bg-destructive/15 text-destructive' : 
                        'bg-muted text-muted-foreground',
                        'border-0'
                      )}>
                        {trendData.focus.trend > 0 ? '+' : ''}{trendData.focus.trend} min
                      </Badge>
                    </CardTitle>
                    <CardDescription>Minutes de focus moyennes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-center mb-4">
                      {trendData.focus.current} <span className="text-lg text-muted-foreground">min</span>
                    </div>
                    <div className="flex items-end gap-1 h-16">
                      {trendData.focus.data.map((val, i) => (
                        <div 
                          key={i}
                          className="flex-1 bg-accent rounded-t"
                          style={{ height: `${Math.max(4, val * 0.4)}px` }}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="glass">
                <CardContent className="py-12 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    Pas assez de données pour afficher les tendances.
                    <br />
                    Continuez à utiliser l'app pendant quelques jours.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* INSIGHTS TAB */}
          <TabsContent value="insights" className="space-y-6 mt-6">
            <div className="grid gap-4 md:grid-cols-2">
              {insights.length > 0 ? (
                insights.map((insight, i) => (
                  <Card 
                    key={i}
                    className={cn(
                      'glass-hover transition-all',
                      insight.type === 'positive' && 'border-success/30 bg-success/5',
                      insight.type === 'warning' && 'border-warning/30 bg-warning/5'
                    )}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'p-2.5 rounded-xl',
                          insight.type === 'positive' ? 'bg-success/15' : 
                          insight.type === 'warning' ? 'bg-warning/15' : 'bg-primary/15'
                        )}>
                          {insight.type === 'positive' ? (
                            <TrendingUp className="h-5 w-5 text-success" />
                          ) : insight.type === 'warning' ? (
                            <AlertTriangle className="h-5 w-5 text-warning" />
                          ) : (
                            <Sparkles className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{insight.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {insight.description}
                          </p>
                          {insight.metric && (
                            <Badge className="mt-2 bg-card border-border">
                              {insight.metric}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="glass md:col-span-2">
                  <CardContent className="py-12 text-center">
                    <Brain className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      Pas encore d'insights disponibles.
                      <br />
                      L'IA analyse vos données pour générer des recommandations.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Link to AI Coach */}
            <Card className="glass-subtle border-primary/20">
              <CardContent className="p-4">
                <Link 
                  to="/ai-coach"
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl gradient-primary">
                      <Brain className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Analyse approfondie avec AI Coach</p>
                      <p className="text-xs text-muted-foreground">
                        Obtenez une revue comportementale complète
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
