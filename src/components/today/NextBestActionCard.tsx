import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Zap, 
  Play, 
  Clock, 
  Target, 
  Battery,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NextBestActionProps {
  task: {
    id: string;
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    estimateMin?: number;
    energyLevel?: 'low' | 'medium' | 'high';
    goalTitle?: string;
    impactScore?: number;
  };
  onStart: () => void;
  onSkip?: () => void;
  isLoading?: boolean;
}

const priorityConfig = {
  urgent: { label: 'Urgent', class: 'bg-destructive/15 text-destructive border-destructive/30' },
  high: { label: 'Haute', class: 'bg-warning/15 text-warning border-warning/30' },
  medium: { label: 'Moyenne', class: 'bg-primary/15 text-primary border-primary/30' },
  low: { label: 'Basse', class: 'bg-muted text-muted-foreground border-muted' },
};

const energyConfig = {
  high: { icon: Battery, label: 'Haute énergie', color: 'text-success' },
  medium: { icon: Battery, label: 'Énergie moyenne', color: 'text-warning' },
  low: { icon: Battery, label: 'Basse énergie', color: 'text-muted-foreground' },
};

export function NextBestActionCard({ 
  task, 
  onStart, 
  onSkip,
  isLoading 
}: NextBestActionProps) {
  const priority = priorityConfig[task.priority];
  const energy = task.energyLevel ? energyConfig[task.energyLevel] : null;

  return (
    <Card className="command-card glass-strong border-primary/30 overflow-hidden group">
      {/* Animated top gradient bar */}
      <div className="h-1 w-full gradient-primary" />
      
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          {/* Icon and header */}
          <div className="flex items-start gap-4 flex-1">
            <div className="relative">
              <div className="p-3 rounded-2xl gradient-primary shadow-lg glow animate-float">
                <Zap className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="absolute -inset-1 rounded-2xl bg-primary/20 blur-xl opacity-50" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                  Next Best Action
                </span>
                <Sparkles className="h-3 w-3 text-primary animate-pulse" />
              </div>
              
              <h3 className="text-xl lg:text-2xl font-bold text-foreground mb-2 line-clamp-2">
                {task.title}
              </h3>
              
              {task.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {task.description}
                </p>
              )}

              {/* Metadata badges */}
              <div className="flex flex-wrap gap-2">
                <Badge className={cn('border', priority.class)}>
                  {priority.label}
                </Badge>
                
                {task.estimateMin && (
                  <Badge variant="outline" className="text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {task.estimateMin} min
                  </Badge>
                )}
                
                {energy && (
                  <Badge variant="outline" className={cn('border-0', energy.color)}>
                    <energy.icon className="h-3 w-3 mr-1" />
                    {energy.label}
                  </Badge>
                )}

                {task.goalTitle && (
                  <Badge variant="secondary" className="gap-1">
                    <Target className="h-3 w-3" />
                    {task.goalTitle}
                  </Badge>
                )}

                {task.impactScore && (
                  <Badge 
                    className="border-0 bg-gradient-to-r from-primary/20 to-accent/20 text-foreground"
                  >
                    Impact: {task.impactScore}%
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-row lg:flex-col gap-2 lg:gap-3">
            <Button
              size="lg"
              className="gradient-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex-1 lg:flex-none"
              onClick={onStart}
              disabled={isLoading}
            >
              <Play className="h-4 w-4 mr-2" />
              Commencer
              <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Button>
            
            {onSkip && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={onSkip}
                disabled={isLoading}
              >
                Passer
              </Button>
            )}
          </div>
        </div>

        {/* Why this action - AI reasoning */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            <span className="text-primary font-medium">Pourquoi cette action ?</span>{' '}
            Haute priorité · Échéance proche · Correspond à votre niveau d'énergie actuel
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
