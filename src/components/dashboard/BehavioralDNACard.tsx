import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, TrendingUp, AlertTriangle, Zap, Moon, Sun } from 'lucide-react';
import { BehavioralDNAEngine, type BehavioralDNA } from '@/ai/behavioral-dna';
import { useAuth } from '@/hooks/useAuth';

export function BehavioralDNACard() {
  const { user } = useAuth();
  const [dna, setDna] = useState<BehavioralDNA | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const engine = new BehavioralDNAEngine(user.id);
    engine.loadDNA().then(data => {
      setDna(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Ton ADN Comportemental
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dna) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-muted-foreground" />
            Ton ADN Comportemental
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-2">
            Continue d'utiliser Minded pendant 7 jours pour générer ton profil personnalisé.
          </p>
        </CardContent>
      </Card>
    );
  }

  const dropoutRisk = dna.predictions.dropoutRisk72h;
  const riskColor = dropoutRisk > 60 ? 'text-destructive' : dropoutRisk > 30 ? 'text-warning' : 'text-success';
  const riskBg = dropoutRisk > 60 ? 'bg-destructive/10' : dropoutRisk > 30 ? 'bg-warning/10' : 'bg-success/10';

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Ton ADN Comportemental
          </CardTitle>
          <Badge variant="secondary" className="text-[10px]">IA</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chronotype */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {dna.chronotype.peakHours[0] < 12 ? (
              <Sun className="h-4 w-4 text-warning" />
            ) : (
              <Moon className="h-4 w-4 text-info" />
            )}
            Heures optimales
          </div>
          <span className="font-medium text-sm">
            {dna.chronotype.peakHours.slice(0, 2).join('h, ')}h
          </span>
        </div>

        {/* Risque décrochage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <AlertTriangle className={`h-4 w-4 ${riskColor}`} />
              Risque décrochage (72h)
            </span>
            <span className={`font-medium ${riskColor}`}>{dropoutRisk}%</span>
          </div>
          <Progress value={dropoutRisk} className={`h-1.5 ${riskBg}`} />
        </div>

        {/* Prédictions */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div className="text-center">
            <p className="text-lg font-bold text-primary">{dna.predictions.scoreIn30Days}</p>
            <p className="text-[10px] text-muted-foreground">Score dans 30j</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-success">{dna.predictions.streakProbability30d}%</p>
            <p className="text-[10px] text-muted-foreground">Prob. streak 30j</p>
          </div>
        </div>

        {/* Triggers */}
        {dna.disciplineProfile.motivationTriggers.length > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <Zap className="h-3 w-3 text-warning" />
              Ce qui te motive
            </div>
            <div className="flex flex-wrap gap-1">
              {dna.disciplineProfile.motivationTriggers.slice(0, 3).map((trigger, i) => (
                <Badge key={i} variant="secondary" className="text-[10px]">
                  {trigger}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
