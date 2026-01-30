import { useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCurrentIdentity } from '@/hooks/useCurrentIdentity';
import { useScoreHistory } from '@/hooks/useScores';
import { useTodayTasks } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

// Mini sparkline component
function MiniSparkline({ data, className }: { data: number[]; className?: string }) {
  if (!data || data.length === 0) return null;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 80 - 10;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg 
      viewBox="0 0 100 40" 
      className={cn("w-full h-10", className)}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="1" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke="url(#sparklineGradient)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {/* End dot */}
      <circle
        cx={100}
        cy={100 - ((data[data.length - 1] - min) / range) * 80 - 10}
        r="3"
        fill="hsl(var(--primary))"
      />
    </svg>
  );
}

// Metric card component
function MetricCard({ 
  icon: Icon, 
  label, 
  value, 
  suffix = '%',
  color 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: number;
  suffix?: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center p-4 rounded-2xl bg-background/50 border border-border/50">
      <div className={cn("p-2 rounded-xl mb-2", color)}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-2xl font-bold">{value}{suffix}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

// Shaping behavior card
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
      <Card className="glass-subtle hover:glass transition-all duration-300">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="text-3xl">{behavior.icon}</div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm">{behavior.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">{behavior.description}</p>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progression</span>
                  <span className="font-medium">{behavior.completion}%</span>
                </div>
                <Progress value={behavior.completion} className="h-2" />
              </div>
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

  // Get sparkline data
  const sparklineData = useMemo(() => {
    if (!scoreHistory) return [];
    return scoreHistory.slice(-7).map(s => s.global_score || 0);
  }, [scoreHistory]);

  // Get transformative action
  const transformativeAction = useMemo(() => {
    if (!todayTasks || todayTasks.length === 0) return null;
    
    // Prioritize high-impact incomplete tasks
    const incomplete = todayTasks.filter(t => t.status !== 'done');
    if (incomplete.length === 0) return null;
    
    // Sort by priority
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const sorted = [...incomplete].sort((a, b) => 
      (priorityOrder[a.priority as keyof typeof priorityOrder] || 3) - 
      (priorityOrder[b.priority as keyof typeof priorityOrder] || 3)
    );
    
    return sorted[0];
  }, [todayTasks]);

  if (identityLoading) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto space-y-8 py-4">
          <div className="text-center space-y-4">
            <Skeleton className="h-20 w-20 rounded-full mx-auto" />
            <Skeleton className="h-10 w-64 mx-auto" />
            <Skeleton className="h-6 w-48 mx-auto" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-8 py-4">
        {/* Hero Section */}
        <AnimatedContainer delay={0}>
          <div className="text-center">
            {/* Avatar/Persona Icon */}
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center shadow-xl shadow-primary/20">
                <User className="h-12 w-12 text-primary-foreground" />
              </div>
              <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-background border-2 border-primary">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
            </div>

            {/* Current Persona */}
            <h1 className="text-4xl font-bold text-gradient mb-2">
              {identity?.currentPersona || 'Explorer'}
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              {identity?.tagline || 'Tu explores tes capacités'}
            </p>

            {/* 4 Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard
                icon={Flame}
                label="Discipline"
                value={identity?.disciplineLevel || 0}
                color="bg-destructive/15 text-destructive"
              />
              <MetricCard
                icon={Target}
                label="Cohérence"
                value={identity?.consistencyLevel || 0}
                color="bg-primary/15 text-primary"
              />
              <MetricCard
                icon={Shield}
                label="Stabilité"
                value={identity?.stabilityLevel || 0}
                color="bg-success/15 text-success"
              />
              <MetricCard
                icon={Zap}
                label="Croissance"
                value={Math.round((identity?.growthRate || 0) * 100)}
                suffix=""
                color="bg-warning/15 text-warning"
              />
            </div>
          </div>
        </AnimatedContainer>

        {/* Trajectory Micro-view */}
        <AnimatedContainer delay={100}>
          <Card className="glass overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Trajectoire 7 jours</span>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      trajectory.direction === 'up' && "border-success/50 text-success",
                      trajectory.direction === 'down' && "border-destructive/50 text-destructive",
                      trajectory.direction === 'stable' && "border-muted-foreground/50"
                    )}
                  >
                    {trajectory.direction === 'up' && (
                      <>
                        <TrendingUp className="h-3 w-3 mr-1" />
                        En progression
                      </>
                    )}
                    {trajectory.direction === 'down' && (
                      <>
                        <TrendingDown className="h-3 w-3 mr-1" />
                        En baisse
                      </>
                    )}
                    {trajectory.direction === 'stable' && (
                      <>
                        <Minus className="h-3 w-3 mr-1" />
                        Stable
                      </>
                    )}
                  </Badge>
                </div>
                <span className="text-2xl">
                  {trajectory.direction === 'up' ? '🔺' : trajectory.direction === 'down' ? '🔻' : '➖'}
                </span>
              </div>
              
              <MiniSparkline data={sparklineData} />
              
              <p className="text-xs text-muted-foreground mt-3 text-center">
                {trajectory.direction === 'up' && 'Tes efforts portent leurs fruits. Continue ainsi !'}
                {trajectory.direction === 'down' && 'Un moment de transition. Reviens aux fondamentaux.'}
                {trajectory.direction === 'stable' && 'Maintiens le cap. La cohérence est ta force.'}
              </p>
            </CardContent>
          </Card>
        </AnimatedContainer>

        {/* Ce qui te façonne aujourd'hui */}
        <div className="space-y-4">
          <AnimatedContainer delay={150}>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-xl">🔨</span>
              Ce qui te façonne aujourd'hui
            </h2>
          </AnimatedContainer>
          
          <div className="grid gap-4">
            {identity?.shapingBehaviors?.map((behavior, index) => (
              <ShapingBehaviorCard 
                key={behavior.id} 
                behavior={behavior}
                delay={200 + index * 50}
              />
            ))}
          </div>
        </div>

        {/* Action Transformatrice du Jour */}
        <AnimatedContainer delay={300}>
          <Card className="glass-strong border-primary/30 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
            <CardHeader className="relative pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-1.5 rounded-lg bg-primary/15">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                Action Transformatrice du Jour
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Ce qui aura le plus d'impact sur qui tu deviens
              </p>
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
                          <Badge variant="outline" className="text-xs">
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
                    className="w-full gradient-primary"
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

        {/* Quick Links */}
        <AnimatedContainer delay={350}>
          <div className="flex justify-center gap-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/today')}
              className="text-muted-foreground"
            >
              Vue classique
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/ai-coach')}
              className="text-muted-foreground"
            >
              Revue IA
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </AnimatedContainer>
      </div>
    </AppLayout>
  );
}
