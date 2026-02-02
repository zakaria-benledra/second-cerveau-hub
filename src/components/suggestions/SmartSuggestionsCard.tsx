import { useSmartSuggestions } from '@/hooks/useSmartSuggestions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Clock, RefreshCw, Lightbulb } from 'lucide-react';
import { SuggestionFeedback } from '@/components/feedback/SuggestionFeedback';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function SmartSuggestionsCard() {
  const { data: suggestions, isLoading, refetch, isFetching } = useSmartSuggestions();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Suggestions personnalisées
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Ajoute des centres d'intérêt pour recevoir des suggestions personnalisées
          </p>
        </CardContent>
      </Card>
    );
  }

  const difficultyStyles: Record<string, string> = {
    facile: 'bg-success/10 text-success border-success/20',
    moyen: 'bg-warning/10 text-warning border-warning/20',
    challengeant: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Suggestions pour toi
        </CardTitle>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-8 w-8"
        >
          <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.map((suggestion, index) => (
          <div 
            key={index} 
            className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-medium text-foreground">{suggestion.title}</h4>
              <Badge 
                variant="outline" 
                className={cn("text-xs shrink-0", difficultyStyles[suggestion.difficulty])}
              >
                {suggestion.difficulty}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">
              {suggestion.description}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{suggestion.duration}</span>
                <span className="text-muted-foreground/50">•</span>
                <span className="text-primary/80">
                  {suggestion.interests_combined.join(' + ')}
                </span>
              </div>
              
              <SuggestionFeedback
                suggestionId={`smart-${index}-${Date.now()}`}
                suggestionType="insight"
                compact
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
