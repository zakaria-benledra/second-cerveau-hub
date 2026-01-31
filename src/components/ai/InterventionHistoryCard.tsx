import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Check, X, Clock, AlertTriangle, TrendingUp, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { InterventionType, UserAction } from '@/ai';

interface Intervention {
  id: string;
  intervention_type: string;
  ai_message: string;
  user_action: string | null;
  created_at: string;
  responded_at?: string | null;
}

interface InterventionHistoryCardProps {
  interventions: Intervention[];
  isLoading?: boolean;
  className?: string;
}

const typeIcons: Record<string, typeof Brain> = {
  motivation: TrendingUp,
  warning: AlertTriangle,
  challenge: Zap,
  praise: TrendingUp,
  restructure: Brain
};

const actionIcons: Record<string, typeof Check> = {
  accepted: Check,
  ignored: Clock,
  rejected: X,
  pending: Clock
};

const actionColors: Record<string, string> = {
  accepted: 'text-success',
  ignored: 'text-muted-foreground',
  rejected: 'text-destructive',
  pending: 'text-warning'
};

export function InterventionHistoryCard({ 
  interventions, 
  isLoading,
  className 
}: InterventionHistoryCardProps) {
  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-6 text-center text-muted-foreground">
          Chargement de l'historique...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Historique des Interventions
          </div>
          <Badge variant="secondary" className="text-xs">
            {interventions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[280px] pr-3">
          {interventions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucune intervention pour le moment
            </p>
          ) : (
            <div className="space-y-3">
              {interventions.map((intervention) => {
                const TypeIcon = typeIcons[intervention.intervention_type] || Brain;
                const userAction = intervention.user_action || 'pending';
                const ActionIcon = actionIcons[userAction] || Clock;
                
                return (
                  <div
                    key={intervention.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                  >
                    <div className="flex-shrink-0 p-1.5 rounded-md bg-primary/10">
                      <TypeIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {intervention.intervention_type}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(intervention.created_at), { 
                            addSuffix: true, 
                            locale: fr 
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/80 line-clamp-2">
                        {intervention.ai_message}
                      </p>
                    </div>
                    <div className={cn("flex items-center gap-1 text-xs", actionColors[userAction] || 'text-muted-foreground')}>
                      <ActionIcon className="h-3.5 w-3.5" />
                      <span className="capitalize">{userAction}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
