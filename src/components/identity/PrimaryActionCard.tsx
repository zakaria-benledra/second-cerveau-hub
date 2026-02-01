import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, CheckCircle2, ArrowRight, Sparkles, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PrimaryActionCardProps {
  action: {
    id: string;
    title: string;
    description?: string | null;
    priority: string;
    estimate_min?: number | null;
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
  if (!action) {
    return (
      <Card className="border-success/30 bg-success/5">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <div className="p-3 rounded-full bg-success/10 mb-4">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <p className="text-lg font-semibold text-success">Tout est accompli !</p>
          <p className="text-sm text-muted-foreground mt-1">
            Tu as terminé toutes tes actions prioritaires du jour.
          </p>
        </CardContent>
      </Card>
    );
  }

  const priorityColors: Record<string, string> = {
    urgent: 'bg-destructive/15 text-destructive border-destructive/30',
    high: 'bg-warning/15 text-warning border-warning/30',
    medium: 'bg-info/15 text-info border-info/30',
    low: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden relative">
      <div className="absolute top-0 right-0 p-2">
        <Sparkles className="h-4 w-4 text-primary/40" />
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Target className="h-4 w-4 text-primary" />
          </div>
          Action Prioritaire
        </CardTitle>
        <CardDescription>
          Ce qui aura le plus d'impact sur qui tu deviens
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-card/80 rounded-lg p-4 border border-border/50">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
              <ArrowRight className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <p className="font-medium leading-tight">{action.title}</p>
              {action.description && (
                <p className="text-sm text-muted-foreground">
                  {action.description}
                </p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={cn("text-xs capitalize", priorityColors[action.priority])}>
                  {action.priority}
                </Badge>
                {action.estimate_min && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    ~{action.estimate_min} min
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={onStart} 
          className="w-full" 
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            'En cours...'
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Marquer comme fait
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
