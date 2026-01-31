import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useJournalAnalysis } from '@/hooks/useJournalAnalysis';
import { cn } from '@/lib/utils';
import { 
  Sparkles, 
  Brain, 
  Heart, 
  AlertTriangle, 
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Info,
  Tag
} from 'lucide-react';

export function JournalInsightsTab() {
  const { data: analysis, isLoading, error } = useJournalAnalysis(90);

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card className="glass">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>Impossible de charger l'analyse du journal.</AlertDescription>
      </Alert>
    );
  }

  if (!analysis || analysis.recurringEmotions.length === 0) {
    return (
      <Card className="glass border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Brain className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Pas assez d'entrées pour générer des insights.
          </p>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Continue à écrire dans ton journal pour découvrir tes patterns !
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      {analysis.summary && (
        <Card className="glass-strong border-primary/20">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-center gap-6 text-center">
              {analysis.summary.dominantEmotion && (
                <div>
                  <p className="text-xs text-muted-foreground">Émotion dominante</p>
                  <p className="font-semibold">{analysis.summary.dominantEmotion}</p>
                </div>
              )}
              {analysis.summary.mainFocus && (
                <div>
                  <p className="text-xs text-muted-foreground">Focus principal</p>
                  <p className="font-semibold">{analysis.summary.mainFocus}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Entrées analysées</p>
                <p className="font-semibold">{analysis.summary.entriesAnalyzed}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tendance mentale</p>
                <Badge variant={analysis.summary.patternBalance === 'positive' ? 'default' : 'secondary'}>
                  {analysis.summary.patternBalance === 'positive' ? '✨ Positive' : '⚡ À surveiller'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recurring Emotions */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-destructive" />
              Émotions récurrentes
            </CardTitle>
            <CardDescription>
              Les émotions les plus présentes dans tes écrits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.recurringEmotions.map((emotion, index) => {
                const maxFrequency = analysis.recurringEmotions[0]?.frequency || 1;
                const percentage = (emotion.frequency / maxFrequency) * 100;
                
                return (
                  <div key={emotion.name} className="flex items-center gap-3">
                    <span className="text-2xl">{emotion.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{emotion.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {emotion.frequency}x
                        </Badge>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all",
                            index === 0 ? "bg-primary" : "bg-primary/60"
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Thinking Domains - Tag Cloud */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-accent" />
              Domaines de réflexion
            </CardTitle>
            <CardDescription>
              Les sujets qui occupent ton esprit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analysis.thinkingDomains.map((domain, index) => {
                const maxCount = analysis.thinkingDomains[0]?.count || 1;
                const intensity = domain.count / maxCount;
                
                return (
                  <Badge
                    key={domain.name}
                    variant="outline"
                    className={cn(
                      "transition-all cursor-default",
                      intensity >= 0.8 && "bg-primary/20 border-primary text-primary font-semibold text-base px-4 py-2",
                      intensity >= 0.5 && intensity < 0.8 && "bg-accent/10 border-accent/50 text-sm px-3 py-1.5",
                      intensity < 0.5 && "text-xs px-2 py-1 opacity-80"
                    )}
                  >
                    {domain.name}
                    <span className="ml-1 opacity-60">({domain.count})</span>
                  </Badge>
                );
              })}
            </div>
            
            {analysis.thinkingDomains.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun domaine détecté pour le moment
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cognitive Patterns */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Patterns cognitifs détectés
          </CardTitle>
          <CardDescription>
            Tendances de pensée identifiées dans tes réflexions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analysis.cognitivePatterns.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Continue à écrire pour révéler tes patterns de pensée
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {analysis.cognitivePatterns.map((pattern) => (
                <Alert 
                  key={pattern.type}
                  className={cn(
                    "border-l-4",
                    pattern.sentiment === 'positive' && "border-l-success bg-success/5",
                    pattern.sentiment === 'negative' && "border-l-warning bg-warning/5",
                    pattern.sentiment === 'neutral' && "border-l-muted bg-muted/30"
                  )}
                >
                  {pattern.sentiment === 'positive' ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : pattern.sentiment === 'negative' ? (
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  ) : (
                    <Info className="h-4 w-4 text-muted-foreground" />
                  )}
                  <AlertTitle className="flex items-center gap-2">
                    {pattern.type}
                    <Badge variant="outline" className="text-xs ml-auto">
                      {pattern.occurrences}x
                    </Badge>
                  </AlertTitle>
                  <AlertDescription className="text-sm">
                    {pattern.description}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Recommendations based on patterns */}
      {analysis.cognitivePatterns.some(p => p.sentiment === 'negative' && p.occurrences > 5) && (
        <Card className="glass border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Recommandations IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.cognitivePatterns
              .filter(p => p.sentiment === 'negative' && p.occurrences > 5)
              .slice(0, 3)
              .map((pattern) => (
                <div key={pattern.type} className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="font-medium text-sm mb-1">
                    Pour contrer la {pattern.type.toLowerCase()}:
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {pattern.type === 'Rumination' && 
                      "Essaie la technique du 'worry time': réserve 15 min par jour pour tes préoccupations, puis recentre-toi."}
                    {pattern.type === 'Catastrophisme' && 
                      "Demande-toi: 'Quelle est la probabilité réelle que cela arrive?' et 'Que ferais-je si cela arrivait?'"}
                    {pattern.type === 'Autodépréciation' && 
                      "Note 3 petites victoires chaque jour, même minimes. La bienveillance envers soi s'entraîne."}
                    {pattern.type === 'Comparaison sociale' && 
                      "Rappelle-toi que tu ne vois que la surface des autres. Compare-toi à ton toi d'hier."}
                  </p>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
