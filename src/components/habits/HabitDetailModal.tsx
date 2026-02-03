import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, BookOpen, Target, CheckCircle2, 
  Sparkles, Flame, Play, Info,
  Calendar, User, Star
} from 'lucide-react';
import { useElementWiki } from '@/hooks/useElementWiki';
import { useUserProfile } from '@/hooks/useUserProfile';
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

// Template Section component matching the exact visual format
function TemplateSection({ 
  emoji,
  title, 
  children,
  isFirst = false,
  isLast = false,
}: { 
  emoji: string;
  title: string; 
  children: React.ReactNode;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  return (
    <div className={cn(
      "border-x-2 border-primary/30 px-4 py-3",
      isFirst && "border-t-2 rounded-t-lg pt-4",
      isLast && "border-b-2 rounded-b-lg pb-4",
      !isFirst && "border-t border-primary/20"
    )}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{emoji}</span>
        <h4 className="font-bold text-sm uppercase tracking-wide text-primary">{title}</h4>
      </div>
      <div className="text-sm text-muted-foreground leading-relaxed pl-6">
        {children}
      </div>
    </div>
  );
}

export function HabitDetailModal({ habit, open, onOpenChange, onComplete, isCompleting }: HabitDetailModalProps) {
  const { data: wiki, isLoading: wikiLoading } = useElementWiki(habit?.id);
  const { data: profile } = useUserProfile();

  if (!habit) return null;

  const hasWiki = !!wiki;
  const isCompleted = habit.todayLog?.completed;
  const userName = profile?.display_name || 'toi';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 overflow-hidden">
        {/* Header Card - Title Section */}
        <div className="p-4 bg-gradient-to-b from-primary/10 to-transparent">
          <div className="border-2 border-primary/30 rounded-lg p-4 bg-background/50 backdrop-blur">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{habit.icon || '📚'}</span>
                <div className="flex-1">
                  <DialogTitle className="text-lg font-bold">
                    {habit.name}
                  </DialogTitle>
                  {habit.description && (
                    <DialogDescription className="text-xs mt-0.5">
                      {habit.description}
                    </DialogDescription>
                  )}
                </div>
              </div>
            </DialogHeader>
            
            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mt-3 pl-10">
              {habit.streak && habit.streak.current_streak > 0 && (
                <Badge className="bg-warning/15 text-warning border-warning/30 text-xs">
                  <Flame className="h-3 w-3 mr-1" />
                  {habit.streak.current_streak}j
                </Badge>
              )}
              {habit.streak && habit.streak.max_streak > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Star className="h-3 w-3 mr-1" />
                  Max: {habit.streak.max_streak}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {habit.target_frequency === 'daily' ? 'Quotidien' : 'Hebdo'}
              </Badge>
              {habit.created_from_program && (
                <Badge className="bg-primary/15 text-primary border-primary/30 text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  IA
                </Badge>
              )}
              {isCompleted && (
                <Badge className="bg-success/15 text-success border-success/30 text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Fait
                </Badge>
              )}
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 px-4">
          <div className="pb-4">
            {hasWiki ? (
              <div className="space-y-0">
                {/* 🧠 POURQUOI CETTE PRATIQUE ? */}
                {wiki.why_this_practice && (
                  <TemplateSection emoji="🧠" title="Pourquoi cette pratique ?" isFirst>
                    <p>{wiki.why_this_practice}</p>
                  </TemplateSection>
                )}

                {/* 📖 BASE SCIENTIFIQUE */}
                {wiki.scientific_basis && (
                  <TemplateSection 
                    emoji="📖" 
                    title="Base scientifique"
                    isFirst={!wiki.why_this_practice}
                  >
                    <p>{wiki.scientific_basis}</p>
                    {wiki.methodology_source && (
                      <p className="mt-2 text-xs italic opacity-70">
                        Source : {wiki.methodology_source}
                      </p>
                    )}
                  </TemplateSection>
                )}

                {/* ✅ COMMENT FAIRE */}
                {wiki.how_to_guide && wiki.how_to_guide.length > 0 && (
                  <TemplateSection 
                    emoji="✅" 
                    title="Comment faire"
                    isFirst={!wiki.why_this_practice && !wiki.scientific_basis}
                  >
                    <ol className="space-y-1.5">
                      {wiki.how_to_guide.map((step, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="font-bold text-primary">{step.step || i + 1}.</span>
                          <span>{step.description}</span>
                        </li>
                      ))}
                    </ol>
                  </TemplateSection>
                )}

                {/* 🎯 CONSEIL PERSONNALISÉ */}
                {wiki.personalized_tips && wiki.personalized_tips.length > 0 ? (
                  <TemplateSection 
                    emoji="🎯" 
                    title={`Conseil personnalisé pour ${userName}`}
                    isLast
                  >
                    {wiki.personalized_tips.map((tip, i) => (
                      <p key={i}>{tip}</p>
                    ))}
                  </TemplateSection>
                ) : (
                  <TemplateSection 
                    emoji="🎯" 
                    title={`Conseil personnalisé pour ${userName}`}
                    isLast
                  >
                    <p>
                      Continue ainsi ! Chaque répétition renforce les connexions neuronales
                      et t'approche de ton objectif.
                    </p>
                  </TemplateSection>
                )}
              </div>
            ) : wikiLoading ? (
              <div className="py-12 text-center">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
                  <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
                </div>
                <p className="text-sm text-muted-foreground mt-4">Chargement des explications...</p>
              </div>
            ) : (
              /* No wiki - manual habit with template structure */
              <div className="space-y-0">
                <TemplateSection emoji="🧠" title="Pourquoi cette pratique ?" isFirst>
                  <p>
                    Cette habitude personnelle contribue à ta progression quotidienne.
                    La régularité crée des connexions neuronales durables.
                  </p>
                </TemplateSection>

                <TemplateSection emoji="📖" title="Base scientifique">
                  <p>
                    La répétition régulière d'une action renforce les circuits neuronaux 
                    associés (neuroplasticité). Après 21-66 jours, l'habitude devient automatique.
                  </p>
                  <p className="mt-2 text-xs italic opacity-70">
                    Source : European Journal of Social Psychology, Phillippa Lally (2009)
                  </p>
                </TemplateSection>

                <TemplateSection emoji="✅" title="Comment faire">
                  <ol className="space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">1.</span>
                      <span>Choisis un moment fixe dans ta journée</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">2.</span>
                      <span>Associe-la à une habitude existante (habit stacking)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">3.</span>
                      <span>Commence petit, augmente progressivement</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">4.</span>
                      <span>Célèbre chaque accomplissement</span>
                    </li>
                  </ol>
                </TemplateSection>

                <TemplateSection emoji="🎯" title={`Conseil personnalisé pour ${userName}`} isLast>
                  <p>
                    Les programmes IA génèrent des conseils personnalisés basés sur 
                    ton profil et tes objectifs. Lance un programme pour débloquer cette fonctionnalité !
                  </p>
                </TemplateSection>
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
