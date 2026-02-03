import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, BookOpen, Target, CheckCircle2, AlertTriangle, 
  Lightbulb, Clock, Star, Sparkles, Flame, Play, Info,
  Calendar, User, Zap
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

// Section component for consistent styling
function Section({ 
  icon: Icon, 
  title, 
  children, 
  variant = 'default' 
}: { 
  icon: React.ElementType; 
  title: string; 
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'primary' | 'warning' | 'accent';
}) {
  const variantStyles = {
    default: 'border-border/50 bg-muted/30',
    success: 'border-success/30 bg-success/5',
    primary: 'border-primary/30 bg-primary/5',
    warning: 'border-warning/30 bg-warning/5',
    accent: 'border-accent/30 bg-accent/5',
  };

  const iconStyles = {
    default: 'text-foreground',
    success: 'text-success',
    primary: 'text-primary',
    warning: 'text-warning',
    accent: 'text-accent',
  };

  return (
    <div className={cn("rounded-lg border p-4", variantStyles[variant])}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={cn("h-4 w-4", iconStyles[variant])} />
        <h4 className="font-semibold text-sm">{title}</h4>
      </div>
      {children}
    </div>
  );
}

export function HabitDetailModal({ habit, open, onOpenChange, onComplete, isCompleting }: HabitDetailModalProps) {
  const { data: wiki, isLoading: wikiLoading } = useElementWiki(habit?.id);

  if (!habit) return null;

  const hasWiki = !!wiki;
  const isCompleted = habit.todayLog?.completed;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 overflow-hidden">
        {/* Header with icon and title */}
        <div className="p-6 pb-4 bg-gradient-to-b from-primary/10 to-transparent">
          <DialogHeader>
            <div className="flex items-start gap-4">
              <div className="text-4xl p-3 rounded-xl bg-background/80 backdrop-blur shadow-sm">
                {habit.icon || '✨'}
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl leading-tight">{habit.name}</DialogTitle>
                {habit.description && (
                  <DialogDescription className="mt-1.5 line-clamp-2">
                    {habit.description}
                  </DialogDescription>
                )}
              </div>
            </div>
          </DialogHeader>
          
          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            {habit.streak && habit.streak.current_streak > 0 && (
              <Badge className="bg-warning/15 text-warning border-warning/30 hover:bg-warning/20">
                <Flame className="h-3 w-3 mr-1" />
                {habit.streak.current_streak} jours
              </Badge>
            )}
            {habit.streak && habit.streak.max_streak > 0 && (
              <Badge variant="outline">
                <Star className="h-3 w-3 mr-1" />
                Record: {habit.streak.max_streak}
              </Badge>
            )}
            <Badge variant="outline">
              <Calendar className="h-3 w-3 mr-1" />
              {habit.target_frequency === 'daily' ? 'Quotidienne' : 'Hebdomadaire'}
            </Badge>
            {habit.created_from_program && (
              <Badge className="bg-primary/15 text-primary border-primary/30">
                <Sparkles className="h-3 w-3 mr-1" />
                Programme
              </Badge>
            )}
            {isCompleted && (
              <Badge className="bg-success/15 text-success border-success/30">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Fait aujourd'hui
              </Badge>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 pb-4">
            {hasWiki ? (
              <>
                {/* 🧠 POURQUOI CETTE PRATIQUE ? */}
                {wiki.why_this_practice && (
                  <Section icon={Brain} title="🧠 Pourquoi cette pratique ?" variant="primary">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {wiki.why_this_practice}
                    </p>
                  </Section>
                )}

                {/* 📖 BASE SCIENTIFIQUE */}
                {wiki.scientific_basis && (
                  <Section icon={BookOpen} title="📖 Base scientifique" variant="default">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {wiki.scientific_basis}
                    </p>
                    {wiki.methodology_source && (
                      <p className="text-xs text-muted-foreground/70 mt-2 italic flex items-center gap-1">
                        <span>📚</span> Source : {wiki.methodology_source}
                      </p>
                    )}
                  </Section>
                )}

                {/* ✅ COMMENT FAIRE */}
                {wiki.how_to_guide && wiki.how_to_guide.length > 0 && (
                  <Section icon={Target} title="✅ Comment faire" variant="success">
                    <ol className="space-y-2">
                      {wiki.how_to_guide.map((step, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="flex items-center justify-center h-6 w-6 rounded-full bg-success/20 text-success text-xs font-bold shrink-0">
                            {step.step || i + 1}
                          </span>
                          <p className="text-sm text-muted-foreground pt-0.5">{step.description}</p>
                        </li>
                      ))}
                    </ol>
                  </Section>
                )}

                {/* Bénéfices */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {wiki.immediate_benefits && wiki.immediate_benefits.length > 0 && (
                    <Section icon={Zap} title="⚡ Bénéfices immédiats" variant="success">
                      <ul className="space-y-1.5">
                        {wiki.immediate_benefits.map((b, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </Section>
                  )}
                  {wiki.long_term_benefits && wiki.long_term_benefits.length > 0 && (
                    <Section icon={Target} title="🎯 Long terme" variant="primary">
                      <ul className="space-y-1.5">
                        {wiki.long_term_benefits.map((b, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <Target className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </Section>
                  )}
                </div>

                {/* 🎯 CONSEIL PERSONNALISÉ */}
                {wiki.personalized_tips && wiki.personalized_tips.length > 0 && (
                  <Section icon={User} title="🎯 Conseil personnalisé pour toi" variant="accent">
                    <div className="space-y-2">
                      {wiki.personalized_tips.map((tip, i) => (
                        <p key={i} className="text-sm text-muted-foreground">
                          {tip}
                        </p>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Bonnes pratiques & Erreurs */}
                {((wiki.best_practices && wiki.best_practices.length > 0) || 
                  (wiki.common_mistakes && wiki.common_mistakes.length > 0)) && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {wiki.best_practices && wiki.best_practices.length > 0 && (
                      <Section icon={Lightbulb} title="💡 Bonnes pratiques" variant="warning">
                        <ul className="space-y-1.5">
                          {wiki.best_practices.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span>✓</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </Section>
                    )}
                    {wiki.common_mistakes && wiki.common_mistakes.length > 0 && (
                      <Section icon={AlertTriangle} title="❌ Erreurs à éviter" variant="default">
                        <ul className="space-y-1.5">
                          {wiki.common_mistakes.map((mistake, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="text-destructive">✗</span>
                              <span>{mistake}</span>
                            </li>
                          ))}
                        </ul>
                      </Section>
                    )}
                  </div>
                )}
              </>
            ) : wikiLoading ? (
              <div className="py-12 text-center">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
                  <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
                </div>
                <p className="text-sm text-muted-foreground mt-4">Chargement des explications...</p>
              </div>
            ) : (
              /* No wiki - show encouragement message */
              <div className="py-8 text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                  <Info className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <div>
                  <p className="text-sm font-medium">Habitude personnelle</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cette habitude a été créée manuellement.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-left">
                  <p className="text-xs text-muted-foreground">
                    💡 <strong>Astuce :</strong> Les programmes générés par l'IA incluent des explications scientifiques 
                    détaillées pour chaque habitude recommandée.
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t bg-muted/30">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button 
            onClick={onComplete}
            disabled={isCompleting || isCompleted}
            className={cn(
              isCompleted && "bg-success hover:bg-success/90 text-success-foreground"
            )}
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
