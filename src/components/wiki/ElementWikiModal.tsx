import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, BookOpen, Target, CheckCircle2, AlertTriangle, Lightbulb, Clock, Star, Sparkles } from 'lucide-react';
import type { ElementWiki } from '@/hooks/useElementWiki';

interface ElementWikiModalProps {
  wiki: ElementWiki;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ElementWikiModal({ wiki, open, onOpenChange }: ElementWikiModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Brain className="h-5 w-5 text-primary" />
            {wiki.title}
          </DialogTitle>
          <DialogDescription>{wiki.short_description}</DialogDescription>
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {wiki.duration_minutes} min
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Star className="h-3 w-3" />
              +{wiki.xp_reward} XP
            </Badge>
            <Badge variant="outline">
              Niveau {wiki.difficulty_level}/5
            </Badge>
            {wiki.methodology_source && (
              <Badge variant="default" className="gap-1">
                <BookOpen className="h-3 w-3" />
                {wiki.methodology_source.split(' - ')[0]}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Pourquoi cette pratique */}
            {wiki.why_this_practice && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Target className="h-5 w-5 text-primary" />
                  <h3>Pourquoi cette pratique ?</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {wiki.why_this_practice}
                </p>
              </div>
            )}

            {/* Base scientifique */}
            {wiki.scientific_basis && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Brain className="h-5 w-5 text-info" />
                  <h3>Base scientifique</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {wiki.scientific_basis}
                </p>
                {wiki.methodology_source && (
                  <p className="text-sm text-primary italic">
                    📚 Source : {wiki.methodology_source}
                  </p>
                )}
              </div>
            )}

            {/* Guide pas à pas */}
            {wiki.how_to_guide && wiki.how_to_guide.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <h3>Comment faire</h3>
                </div>
                <div className="space-y-2">
                  {wiki.how_to_guide.map((step, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                        {step.step || i + 1}
                      </div>
                      <p className="text-muted-foreground pt-1">{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bénéfices */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wiki.immediate_benefits && wiki.immediate_benefits.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">⚡ Bénéfices immédiats</h4>
                  <ul className="space-y-1">
                    {wiki.immediate_benefits.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {wiki.long_term_benefits && wiki.long_term_benefits.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">🎯 Bénéfices long terme</h4>
                  <ul className="space-y-1">
                    {wiki.long_term_benefits.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Target className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Conseils personnalisés */}
            {wiki.personalized_tips && wiki.personalized_tips.length > 0 && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-primary">
                  <Sparkles className="h-5 w-5" />
                  <h3>Conseils personnalisés pour toi</h3>
                </div>
                <ul className="space-y-2">
                  {wiki.personalized_tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span>🎯</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Bonnes pratiques */}
            {wiki.best_practices && wiki.best_practices.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Lightbulb className="h-5 w-5 text-warning" />
                  <h3>Bonnes pratiques</h3>
                </div>
                <ul className="space-y-1">
                  {wiki.best_practices.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span>💡</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Erreurs à éviter */}
            {wiki.common_mistakes && wiki.common_mistakes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <h3>Erreurs à éviter</h3>
                </div>
                <ul className="space-y-1">
                  {wiki.common_mistakes.map((mistake, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span>❌</span>
                      <span>{mistake}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default ElementWikiModal;
