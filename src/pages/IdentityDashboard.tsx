import { useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCurrentIdentity } from '@/hooks/useCurrentIdentity';
import { useScoreHistory } from '@/hooks/useScores';
import { useTodayTasks } from '@/hooks/useTasks';
import { IdentityComparison } from '@/components/identity/IdentityComparison';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AnimatedContainer } from '@/components/ui/animated-container';
import { Skeleton } from '@/components/ui/skeleton';
import {
  User,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Flame,
  Shield,
  Zap,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Activity,
  BarChart3,
  Brain,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';

// Premium Metric Card
function MetricCard({ 
  icon: Icon, 
  label, 
  value, 
  suffix = '%',
  color,
  gradient
}: { 
  icon: React.ElementType; 
  label: string; 
  value: number;
  suffix?: string;
  color: string;
  gradient: string;
}) {
  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-default",
      gradient
    )}>
      <CardContent className="p-3 md:p-4">
        <div className="flex items-center gap-2 md:gap-3">
          <div className={cn("p-2 md:p-2.5 rounded-xl shrink-0", color)}>
            <Icon className="h-4 w-4 md:h-5 md:w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xl md:text-2xl font-bold">{value}{suffix}</div>
            <div className="text-[10px] md:text-xs text-muted-foreground truncate">{label}</div>
          </div>
        </div>
        <Progress value={value} className="mt-2 md:mt-3 h-1 md:h-1.5" />
      </CardContent>
    </Card>
  );
}

// Shaping behavior card - Premium style
function ShapingBehaviorCard({ 
  behavior,
  delay
}: { 
  behavior: {
    id: string;
    title: string;
    description: string;
    completion: number;
    icon: string;
  };
  delay: number;
}) {
  return (
    <AnimatedContainer delay={delay}>
      <Card className="hover:border-primary/50 transition-all duration-300">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="text-3xl p-2 bg-muted/50 rounded-xl">{behavior.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-sm">{behavior.title}</h4>
                <Badge variant="outline" className="text-xs">
                  {behavior.completion}%
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{behavior.description}</p>
              <Progress value={behavior.completion} className="mt-3 h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </AnimatedContainer>
  );
}

export default function IdentityDashboard() {
  const navigate = useNavigate();
  const { data: identity, isLoading: identityLoading } = useCurrentIdentity();
  const { data: scoreHistory } = useScoreHistory(7);
  const { data: todayTasks } = useTodayTasks();

  // Calculate trajectory
  const trajectory = useMemo(() => {
    if (!scoreHistory || scoreHistory.length < 2) {
      return { direction: 'stable', change: 0 };
    }
    
    const recentScores = scoreHistory.slice(-7);
    const firstHalf = recentScores.slice(0, Math.floor(recentScores.length / 2));
    const secondHalf = recentScores.slice(Math.floor(recentScores.length / 2));
    
    const firstAvg = firstHalf.reduce((acc, s) => acc + (s.global_score || 0), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((acc, s) => acc + (s.global_score || 0), 0) / secondHalf.length;
    
    const change = secondAvg - firstAvg;
    
    if (change > 3) return { direction: 'up', change };
    if (change < -3) return { direction: 'down', change };
    return { direction: 'stable', change };
  }, [scoreHistory]);

  // Chart data for 7-day trend
  const chartData = useMemo(() => {
    if (!scoreHistory) return [];
    return scoreHistory.slice(-7).map(s => ({
      date: format(new Date(s.date), 'EEE', { locale: fr }),
      score: s.global_score || 0,
    }));
  }, [scoreHistory]);

  // Get transformative action
  const transformativeAction = useMemo(() => {
    if (!todayTasks || todayTasks.length === 0) return null;
    
    const incomplete = todayTasks.filter(t => t.status !== 'done');
    if (incomplete.length === 0) return null;
    
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const sorted = [...incomplete].sort((a, b) => 
      (priorityOrder[a.priority as keyof typeof priorityOrder] || 3) - 
      (priorityOrder[b.priority as keyof typeof priorityOrder] || 3)
    );
    
    return sorted[0];
  }, [todayTasks]);

  const getTrendIcon = () => {
    if (trajectory.direction === 'up') return <TrendingUp className="h-5 w-5 text-success" />;
    if (trajectory.direction === 'down') return <TrendingDown className="h-5 w-5 text-destructive" />;
    return <Minus className="h-5 w-5 text-muted-foreground" />;
  };

  if (identityLoading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-6 py-4">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 px-1 py-2 md:py-4">
        
        {/* 4 METRICS GRID */}
        <AnimatedContainer delay={50}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
            <MetricCard
              icon={Flame}
              label="Discipline"
              value={identity?.disciplineLevel || 0}
              color="bg-destructive/15 text-destructive"
              gradient="border-destructive/20"
            />
            <MetricCard
              icon={Target}
              label="Cohérence"
              value={identity?.consistencyLevel || 0}
              color="bg-primary/15 text-primary"
              gradient="border-primary/20"
            />
            <MetricCard
              icon={Shield}
              label="Stabilité"
              value={identity?.stabilityLevel || 0}
              color="bg-success/15 text-success"
              gradient="border-success/20"
            />
            <MetricCard
              icon={Zap}
              label="Croissance"
              value={Math.round((identity?.growthRate || 0) * 100)}
              suffix="%"
              color="bg-warning/15 text-warning"
              gradient="border-warning/20"
            />
          </div>
        </AnimatedContainer>

        {/* TRAJECTORY CHART */}
        {chartData.length >= 2 && (
          <AnimatedContainer delay={100}>
            <Card>
              <CardHeader className="pb-2 px-4 md:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                      <Activity className="h-4 w-4 text-primary" />
                      Trajectoire 7 jours
                    </CardTitle>
                    <CardDescription className="text-xs md:text-sm">Évolution de ton score</CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-xs">7j</Badge>
                </div>
              </CardHeader>
              <CardContent className="px-4 md:px-6">
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="identityGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={30}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="hsl(var(--primary))"
                        fill="url(#identityGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  {trajectory.direction === 'up' && '🔺 Tes efforts portent leurs fruits. Continue ainsi !'}
                  {trajectory.direction === 'down' && '🔻 Un moment de transition. Reviens aux fondamentaux.'}
                  {trajectory.direction === 'stable' && '➖ Maintiens le cap. La cohérence est ta force.'}
                </p>
              </CardContent>
            </Card>
          </AnimatedContainer>
        )}

        {/* CE QUI TE FAÇONNE */}
        <AnimatedContainer delay={150}>
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base md:text-lg font-semibold">Ce qui te façonne</h2>
              <Badge variant="outline" className="text-xs">Live</Badge>
            </div>
            
            <div className="grid gap-3">
              {identity?.shapingBehaviors?.map((behavior, index) => (
                <ShapingBehaviorCard 
                  key={behavior.id} 
                  behavior={behavior}
                  delay={200 + index * 50}
                />
              ))}
            </div>
          </div>
        </AnimatedContainer>

        {/* ACTION TRANSFORMATRICE */}
        <AnimatedContainer delay={300}>
          <Card className="relative overflow-hidden border-primary/30">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
            <CardHeader className="relative pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-1.5 rounded-lg bg-primary/15">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                Action Transformatrice du Jour
              </CardTitle>
              <CardDescription>
                Ce qui aura le plus d'impact sur qui tu deviens
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              {transformativeAction ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/15 shrink-0">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold">{transformativeAction.title}</h4>
                        {transformativeAction.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {transformativeAction.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {transformativeAction.priority}
                          </Badge>
                          {transformativeAction.estimate_min && (
                            <span className="text-xs text-muted-foreground">
                              ~{transformativeAction.estimate_min} min
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full"
                    onClick={() => navigate('/tasks')}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Commencer maintenant
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/15 mb-4">
                    <CheckCircle2 className="h-8 w-8 text-success" />
                  </div>
                  <h4 className="font-semibold text-success">Tout est accompli !</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tu as terminé toutes tes actions du jour
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </AnimatedContainer>

        {/* IDENTITY COMPARISON - 30 DAYS */}
        <AnimatedContainer delay={250}>
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base md:text-lg font-semibold flex items-center gap-2">
                🔄 Évolution 30 jours
              </h2>
              <Badge variant="secondary" className="text-xs">Comparaison</Badge>
            </div>
            
            <IdentityComparison daysAgo={30} />
          </div>
        </AnimatedContainer>

        {/* QUICK ACTIONS */}
        <AnimatedContainer delay={300}>
          <Card>
            <CardHeader className="pb-2 md:pb-3 px-4 md:px-6">
              <CardTitle className="text-sm md:text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Actions Rapides
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 md:px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                <Button 
                  variant="outline" 
                  className="justify-start h-auto py-2 md:py-3 px-3"
                  onClick={() => navigate('/dashboard')}
                >
                  <div className="flex flex-col items-start gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <BarChart3 className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                      <span className="font-medium text-xs md:text-sm">Dashboard</span>
                    </div>
                    <span className="text-[10px] md:text-xs text-muted-foreground">Vue BI</span>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="justify-start h-auto py-2 md:py-3 px-3"
                  onClick={() => navigate('/ai-coach')}
                >
                  <div className="flex flex-col items-start gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <Brain className="h-3.5 w-3.5 md:h-4 md:w-4 text-accent" />
                      <span className="font-medium text-xs md:text-sm">AI Coach</span>
                    </div>
                    <span className="text-[10px] md:text-xs text-muted-foreground">Revue IA</span>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="justify-start h-auto py-2 md:py-3 px-3"
                  onClick={() => navigate('/behavior-hub')}
                >
                  <div className="flex flex-col items-start gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 md:h-4 md:w-4 text-success" />
                      <span className="font-medium text-xs md:text-sm">Habitudes</span>
                    </div>
                    <span className="text-[10px] md:text-xs text-muted-foreground">Comportement</span>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="justify-start h-auto py-2 md:py-3 px-3"
                  onClick={() => navigate('/today')}
                >
                  <div className="flex flex-col items-start gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 md:h-4 md:w-4 text-warning" />
                      <span className="font-medium text-xs md:text-sm">Aujourd'hui</span>
                    </div>
                    <span className="text-[10px] md:text-xs text-muted-foreground">Vue classique</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </AnimatedContainer>
      </div>
    </AppLayout>
  );
}
