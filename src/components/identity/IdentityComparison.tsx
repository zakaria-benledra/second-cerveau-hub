import { useIdentityComparison } from '@/hooks/useIdentityComparison';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedContainer } from '@/components/ui/animated-container';
import {
  Flame,
  Target,
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricRowProps {
  icon: React.ElementType;
  label: string;
  value: number;
  muted?: boolean;
}

function MetricRow({ icon: Icon, label, value, muted }: MetricRowProps) {
  return (
    <div className={cn(
      "flex items-center justify-between py-2",
      muted && "opacity-60"
    )}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <span className="text-sm">{label}</span>
      </div>
      <span className="font-bold">{value}%</span>
    </div>
  );
}

interface PersonaCardProps {
  persona: string;
  tagline: string;
  disciplineLevel: number;
  consistencyLevel: number;
  stabilityLevel: number;
  date: string;
  variant: 'past' | 'current';
}

function PersonaCard({ 
  persona, 
  tagline, 
  disciplineLevel, 
  consistencyLevel, 
  stabilityLevel,
  date,
  variant 
}: PersonaCardProps) {
  const isPast = variant === 'past';
  
  // Representative quotes based on persona
  const quotes: Record<string, string> = {
    "Maître de Discipline": "La discipline est la liberté.",
    "Bâtisseur en Progression": "Chaque jour, une brique de plus.",
    "En Reconstruction": "Tomber n'est pas échouer. Rester à terre, si.",
    "Roc de Stabilité": "La constance forge les légendes.",
    "Performeur Régulier": "L'excellence est une habitude.",
    "Explorer": "Le voyage commence par un premier pas."
  };

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all",
      isPast ? "bg-muted/30 border-border/50" : "border-2 border-primary bg-background"
    )}>
      {!isPast && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      )}
      <CardContent className="relative p-5">
        {/* Header */}
        <div className="text-center mb-4">
          <Badge 
            variant={isPast ? "secondary" : "default"}
            className={cn(
              "mb-3",
              !isPast && "bg-primary/15 text-primary border-0"
            )}
          >
            {isPast ? `Il y a 30 jours` : "Aujourd'hui"}
          </Badge>
          
          <h3 className={cn(
            "text-xl font-bold mb-1",
            isPast ? "text-muted-foreground" : "text-gradient"
          )}>
            {persona}
          </h3>
          <p className="text-xs text-muted-foreground">{tagline}</p>
        </div>

        {/* Metrics */}
        <div className={cn(
          "space-y-1 py-3 border-y",
          isPast ? "border-border/30" : "border-border/50"
        )}>
          <MetricRow 
            icon={Flame} 
            label="Discipline" 
            value={disciplineLevel} 
            muted={isPast}
          />
          <MetricRow 
            icon={Target} 
            label="Cohérence" 
            value={consistencyLevel} 
            muted={isPast}
          />
          <MetricRow 
            icon={Shield} 
            label="Stabilité" 
            value={stabilityLevel} 
            muted={isPast}
          />
        </div>

        {/* Quote */}
        <div className={cn(
          "mt-4 p-3 rounded-lg text-center",
          isPast ? "bg-muted/50" : "bg-primary/10"
        )}>
          <p className={cn(
            "text-sm italic",
            isPast ? "text-muted-foreground" : "text-foreground"
          )}>
            "{quotes[persona] || quotes["Explorer"]}"
          </p>
        </div>

        {/* Date */}
        <p className="text-xs text-muted-foreground text-center mt-3">
          {new Date(date).toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}
        </p>
      </CardContent>
    </Card>
  );
}

interface DeltaBadgeProps {
  label: string;
  value: number;
}

function DeltaBadge({ label, value }: DeltaBadgeProps) {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Badge 
        variant="outline"
        className={cn(
          "font-bold",
          isPositive && "border-success/50 bg-success/10 text-success",
          !isPositive && !isNeutral && "border-destructive/50 bg-destructive/10 text-destructive",
          isNeutral && "border-muted-foreground/50 text-muted-foreground"
        )}
      >
        {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : 
         isNeutral ? <Minus className="h-3 w-3 mr-1" /> :
         <TrendingDown className="h-3 w-3 mr-1" />}
        {isPositive ? '+' : ''}{Math.round(value)}%
      </Badge>
    </div>
  );
}

interface IdentityComparisonProps {
  daysAgo?: number;
  className?: string;
}

export function IdentityComparison({ daysAgo = 30, className }: IdentityComparisonProps) {
  const { data: comparison, isLoading } = useIdentityComparison(daysAgo);

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (!comparison) {
    return (
      <Card className={cn("p-6 text-center", className)}>
        <p className="text-muted-foreground">
          Pas assez de données pour comparer. Reviens dans quelques jours.
        </p>
      </Card>
    );
  }

  const { past, current, delta, transformationInsight, transformationType } = comparison;

  // Default values if no data
  const pastData = past || {
    persona: "Explorer",
    tagline: "Tu explores tes capacités",
    disciplineLevel: 50,
    consistencyLevel: 50,
    stabilityLevel: 50,
    date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  };

  const currentData = current || {
    persona: "Explorer",
    tagline: "Tu explores tes capacités",
    disciplineLevel: 50,
    consistencyLevel: 50,
    stabilityLevel: 50,
    date: new Date().toISOString().split('T')[0]
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Comparison Grid */}
      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatedContainer delay={0}>
            <PersonaCard {...pastData} variant="past" />
          </AnimatedContainer>
          
          <AnimatedContainer delay={100}>
            <PersonaCard {...currentData} variant="current" />
          </AnimatedContainer>
        </div>

        {/* Center Arrow (desktop) */}
        <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="p-3 rounded-full bg-background border-2 border-primary shadow-lg">
            <ArrowRight className="h-5 w-5 text-primary" />
          </div>
        </div>
      </div>

      {/* Deltas */}
      <AnimatedContainer delay={150}>
        <Card className="glass-subtle">
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-8">
              <DeltaBadge label="Discipline" value={delta.discipline} />
              <DeltaBadge label="Cohérence" value={delta.consistency} />
              <DeltaBadge label="Stabilité" value={delta.stability} />
            </div>
          </CardContent>
        </Card>
      </AnimatedContainer>

      {/* Transformation Insight */}
      <AnimatedContainer delay={200}>
        <Card className={cn(
          "overflow-hidden",
          transformationType === 'major_growth' && "border-success/30 bg-success/5",
          transformationType === 'steady_progress' && "border-primary/30 bg-primary/5",
          transformationType === 'stable' && "border-border",
          transformationType === 'decline' && "border-warning/30 bg-warning/5",
          transformationType === 'critical_decline' && "border-destructive/30 bg-destructive/5"
        )}>
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className={cn(
                "p-2.5 rounded-xl shrink-0",
                transformationType === 'major_growth' && "bg-success/15 text-success",
                transformationType === 'steady_progress' && "bg-primary/15 text-primary",
                transformationType === 'stable' && "bg-muted text-muted-foreground",
                transformationType === 'decline' && "bg-warning/15 text-warning",
                transformationType === 'critical_decline' && "bg-destructive/15 text-destructive"
              )}>
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">
                  {transformationType === 'major_growth' && "Transformation Majeure"}
                  {transformationType === 'steady_progress' && "Progression Constante"}
                  {transformationType === 'stable' && "Stabilité"}
                  {transformationType === 'decline' && "Point d'attention"}
                  {transformationType === 'critical_decline' && "Intervention Requise"}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {transformationInsight}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </AnimatedContainer>
    </div>
  );
}
