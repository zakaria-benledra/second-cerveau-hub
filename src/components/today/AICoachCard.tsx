import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, Clock, Brain, AlertTriangle, TrendingUp, Zap, Sparkles } from 'lucide-react';
import { useAICoachEngine } from '@/hooks/useAIBehavior';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const interventionIcons: Record<string, typeof Brain> = {
  motivation: TrendingUp,
  warning: AlertTriangle,
  challenge: Zap,
  praise: TrendingUp,
  restructure: Brain
};

const interventionColors: Record<string, string> = {
  motivation: 'border-info/30 bg-info/5',
  warning: 'border-warning/30 bg-warning/5',
  challenge: 'border-primary/30 bg-primary/5',
  praise: 'border-success/30 bg-success/5',
  restructure: 'border-secondary/30 bg-secondary/5'
};

export function AICoachCard() {
  const {
    intervention,
    behaviorContext,
    currentSignals,
    isLoading,
    refetch,
    accept,
    ignore,
    reject,
    isResponding
  } = useAICoachEngine();

  const [showDetails, setShowDetails] = useState(false);
  const [applyingAction, setApplyingAction] = useState(false);
  const [appliedResult, setAppliedResult] = useState<any>(null);

  // Apply intervention with real backend action
  const handleApply = async (interventionId: string) => {
    setApplyingAction(true);
    try {
      const { data, error } = await supabase.functions.invoke('apply-ai-intervention', {
        body: { interventionId }
      });

      if (error) throw error;

      setAppliedResult(data);
      toast.success(data?.message || 'Action appliquée !');
      
      // Also mark as accepted in the hook
      accept(interventionId);
      
      // Refresh after a delay
      setTimeout(() => {
        refetch();
        setAppliedResult(null);
      }, 3000);
      
    } catch (err) {
      console.error('Apply error:', err);
      toast.error('Erreur lors de l\'application');
    } finally {
      setApplyingAction(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-strong">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Analyse comportementale...</span>
        </CardContent>
      </Card>
    );
  }

  // Show applied result
  if (appliedResult) {
    return (
      <Card className="glass-strong border-success/30 bg-success/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
              <Check className="h-6 w-6 text-success" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-success">Action appliquée !</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {appliedResult.message}
              </p>
              {appliedResult.actions?.length > 0 && (
                <div className="mt-3 space-y-1">
                  {appliedResult.actions.map((action: any, idx: number) => (
                    <div key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                      <Sparkles className="h-3 w-3 text-success" />
                      {action.action}: {action.count || action.task || 'OK'}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!intervention) {
    // Show behavioral summary if no intervention
    return (
      <Card className="glass-strong border-border/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Second Cerveau</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {currentSignals.length === 0 
                  ? "Tout va bien ! Continue sur cette lancée."
                  : `${currentSignals.length} signal${currentSignals.length > 1 ? 's' : ''} détecté${currentSignals.length > 1 ? 's' : ''}`
                }
              </p>
              
              {behaviorContext && (
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline" className="text-xs">
                    Cohérence: {Math.round((behaviorContext.habits_consistency || 0) * 100)}%
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Actions: {behaviorContext.recent_completions || 0}
                  </Badge>
                  {behaviorContext.tasks_overdue > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {behaviorContext.tasks_overdue} en retard
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              Analyser
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const IconComponent = interventionIcons[intervention.intervention_type] || Brain;
  const colorClass = interventionColors[intervention.intervention_type] || 'border-border bg-background';

  return (
    <Card className={cn("glass-strong border-2 transition-all", colorClass)}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg">
            <IconComponent className="h-7 w-7 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-lg">Message du Second Cerveau</h3>
              <Badge variant="secondary" className="capitalize text-xs">
                {intervention.intervention_type}
              </Badge>
            </div>
            
            <p className="text-foreground leading-relaxed">
              {intervention.ai_message}
            </p>

            {/* Action buttons - REAL MUTATIONS */}
            <div className="flex items-center gap-2 mt-4">
              <Button
                size="sm"
                onClick={() => handleApply(intervention.id)}
                disabled={isResponding || applyingAction}
                className="gap-2"
              >
                {applyingAction ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Appliquer
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => ignore(intervention.id)}
                disabled={isResponding || applyingAction}
                className="gap-2"
              >
                <Clock className="h-4 w-4" />
                Plus tard
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => reject(intervention.id)}
                disabled={isResponding || applyingAction}
                className="gap-2 text-muted-foreground"
              >
                <X className="h-4 w-4" />
                Ignorer
              </Button>
            </div>

            {/* Signal details toggle */}
            {currentSignals.length > 0 && (
              <Button
                variant="link"
                size="sm"
                className="mt-3 p-0 h-auto text-xs text-muted-foreground"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Masquer' : 'Voir'} les signaux détectés
              </Button>
            )}

            {/* Signal details */}
            {showDetails && currentSignals.length > 0 && (
              <div className="mt-3 p-3 rounded-lg bg-background/50 space-y-2">
                {currentSignals.map((signal, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-muted-foreground">{signal.type.replace('_', ' ')}</span>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(signal.score * 100)}%
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
