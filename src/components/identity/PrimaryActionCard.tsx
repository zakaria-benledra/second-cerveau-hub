import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, CheckCircle2, ArrowRight, Sparkles, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PrimaryActionCardProps {
  action: {
    id: string;
    title: string;
    description?: string | null;
    priority: string;
    estimate_min?: number | null;
    energy_level?: string | null;
  } | null;
  onStart: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function PrimaryActionCard({ 
  action, 
  onStart, 
  isLoading,
  disabled 
}: PrimaryActionCardProps) {
  const [justCompleted, setJustCompleted] = useState(false);
  // Empty state - all done!
  if (!action) {
    return (
      <Card className="glass-strong border-success/30">
        <CardContent className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Tout est accompli !
          </h3>
          <p className="text-muted-foreground">
            Tu as terminé toutes tes actions prioritaires du jour.
          </p>
        </CardContent>
      </Card>
    );
  }

  const priorityConfig: Record<string, { color: string; bg: string }> = {
    urgent: { color: 'text-destructive', bg: 'bg-destructive/15 border-destructive/30' },
    high: { color: 'text-warning', bg: 'bg-warning/15 border-warning/30' },
    medium: { color: 'text-info', bg: 'bg-info/15 border-info/30' },
    low: { color: 'text-muted-foreground', bg: 'bg-muted border-border' },
  };

  const config = priorityConfig[action.priority] || priorityConfig.medium;

  return (
    <Card className={cn(
      "glass-strong border-primary/30 overflow-hidden group hover:border-primary/50 transition-all duration-500",
      justCompleted && "animate-success-pulse border-success/50 bg-success/5"
    )}>
      <div className="h-1 w-full gradient-primary" />
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 text-primary">
          <div className="p-2 rounded-lg gradient-primary">
            <Target className="h-4 w-4 text-primary-foreground" />
          </div>
          <CardTitle className="text-sm font-semibold uppercase tracking-widest">
            Action Prioritaire
          </CardTitle>
        </div>
        <CardDescription>
          Ce qui aura le plus d'impact sur qui tu deviens
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="p-3 rounded-2xl gradient-primary shadow-lg">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-foreground mb-1">
              {action.title}
            </h3>
            {action.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {action.description}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Badge className={cn('border', config.bg, config.color)}>
                {action.priority}
              </Badge>
              {action.estimate_min && (
                <Badge variant="outline" className="text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  ~{action.estimate_min} min
                </Badge>
              )}
              {action.energy_level && (
                <Badge variant="outline" className="text-muted-foreground">
                  <Zap className="h-3 w-3 mr-1" />
                  {action.energy_level}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Button
          onClick={() => {
            setJustCompleted(true);
            onStart();
            setTimeout(() => setJustCompleted(false), 1000);
          }}
          disabled={isLoading || disabled}
          className="w-full gradient-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
        >
          {isLoading ? (
            'En cours...'
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Marquer comme fait
              <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
