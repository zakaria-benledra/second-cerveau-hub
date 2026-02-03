import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, BookOpen, Target, CheckCircle2, AlertTriangle, 
  Lightbulb, Clock, Star, Sparkles, Flame, Play, Info,
  Calendar
} from 'lucide-react';
import { useElementWiki } from '@/hooks/useElementWiki';
import { cn } from '@/lib/utils';

interface HabitWithLog {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  target_frequency?: string;
  created_from_program?: string;
  streak?: {
    current_streak: number;
    max_streak: number;
  };
  todayLog?: {
    completed: boolean;
  };
}

interface HabitDetailModalProps {
  habit: HabitWithLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  isCompleting?: boolean;
}

export function HabitDetailModal({ habit, open, onOpenChange, onComplete, isCompleting }: HabitDetailModalProps) {
  const { data: wiki, isLoading: wikiLoading } = useElementWiki(habit?.id);

  if (!habit) return null;

  const hasWiki = !!wiki;
  const isCompleted = habit.todayLog?.completed;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader className="pb-2">
          <div className="flex items-start gap-3">
            <span className="text-3xl">{habit.icon || '✨'}</span>
            <div className="flex-1">
              <DialogTitle className="text-lg">{habit.name}</DialogTitle>
              {habit.description && (
                <DialogDescription className="mt-1">{habit.description}</DialogDescription>
              )}
            </div>
          </div>
          
          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-3">
            {habit.streak && habit.streak.current_streak > 0 && (
              <Badge variant="secondary" className="bg-warning/15 text-warning border-0">
                <Flame className="h-3 w-3 mr-1" />
                Streak: {habit.streak.current_streak} jours
              </Badge>
            )}
            {habit.streak && habit.streak.max_streak > 0 && (
              <Badge variant="outline">
                Record: {habit.streak.max_streak} jours
              </Badge>
            )}
            <Badge variant="outline">
              <Calendar className="h-3 w-3 mr-1" />
              {habit.target_frequency === 'daily' ? 'Quotidienne' : 'Hebdomadaire'}
            </Badge>
            {habit.created_from_program && (
              <Badge className="bg-primary/15 text-primary border-0">
                <Sparkles className="h-3 w-3 mr-1" />
                Programme
              </Badge>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6 max-h-[50vh]">
          {hasWiki ? (
            <Tabs defaultValue="why" className="w-full">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="why" className="flex-1 gap-1.5">
                  <Brain className="h-3.5 w-3.5" />
                  Explications
                </TabsTrigger>
                <TabsTrigger value="how" className="flex-1 gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  Guide
                </TabsTrigger>
              </TabsList>

              <TabsContent value="why" className="space-y-4 mt-0">
                {/* Pourquoi */}
                {wiki.why_this_practice && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold text-sm">Pourquoi cette pratique ?</h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {wiki.why_this_practice}
                    </p>
                  </div>
                )}

                {/* Base scientifique */}
                {wiki.scientific_basis && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold text-sm">Base scientifique</h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {wiki.scientific_basis}
                    </p>
                    {wiki.methodology_source && (
                      <p className="text-xs text-muted-foreground/70 italic">
                        📚 {wiki.methodology_source}
                      </p>
                    )}
                  </div>
                )}

                {/* Bénéfices */}
                <div className="grid gap-3">
                  {wiki.immediate_benefits && wiki.immediate_benefits.length > 0 && (
                    <div className="p-3 rounded-lg bg-success/5 border border-success/20">
                      <h5 className="font-medium text-sm mb-2">⚡ Bénéfices immédiats</h5>
                      <ul className="space-y-1">
                        {wiki.immediate_benefits.map((b, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <CheckCircle2 className="h-3 w-3 text-success mt-0.5 shrink-0" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {wiki.long_term_benefits && wiki.long_term_benefits.length > 0 && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <h5 className="font-medium text-sm mb-2">🎯 Long terme</h5>
                      <ul className="space-y-1">
                        {wiki.long_term_benefits.map((b, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <Target className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Conseils personnalisés */}
                {wiki.personalized_tips && wiki.personalized_tips.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-accent" />
                      <h4 className="font-semibold text-sm">Conseils pour toi</h4>
                    </div>
                    <div className="space-y-2">
                      {wiki.personalized_tips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded bg-accent/5 text-xs">
                          <span>🎯</span>
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="how" className="space-y-4 mt-0">
                {/* Guide pas à pas */}
                {wiki.how_to_guide && wiki.how_to_guide.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold text-sm">Comment faire</h4>
                    </div>
                    <div className="space-y-2">
                      {wiki.how_to_guide.map((step, i) => (
                        <div key={i} className="flex items-start gap-3 p-2 rounded bg-muted/50">
                          <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                            {step.step || i + 1}
                          </span>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bonnes pratiques */}
                {wiki.best_practices && wiki.best_practices.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-warning" />
                      <h4 className="font-semibold text-sm">Bonnes pratiques</h4>
                    </div>
                    <div className="space-y-1">
                      {wiki.best_practices.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span>💡</span>
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Erreurs */}
                {wiki.common_mistakes && wiki.common_mistakes.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <h4 className="font-semibold text-sm">Erreurs à éviter</h4>
                    </div>
                    <div className="space-y-1">
                      {wiki.common_mistakes.map((mistake, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span>❌</span>
                          <span>{mistake}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : wikiLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Chargement des explications...
            </div>
          ) : (
            <div className="py-8 text-center">
              <Info className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                Pas d'explications détaillées pour cette habitude.
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Les habitudes créées par un programme ont des explications scientifiques.
              </p>
            </div>
          )}
        </ScrollArea>

        {/* Footer avec bouton compléter */}
        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button 
            onClick={onComplete}
            disabled={isCompleting || isCompleted}
            className={cn(isCompleted && "bg-success hover:bg-success")}
          >
            {isCompleting ? (
              <>Enregistrement...</>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Complétée !
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Marquer comme faite
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default HabitDetailModal;
