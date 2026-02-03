import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle2, Calendar, Flag, Sparkles, 
  AlertTriangle, BookOpen, Play, Target, Brain, Lightbulb
} from 'lucide-react';
import { format, parseISO, isToday, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useElementWiki } from '@/hooks/useElementWiki';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  created_from_program?: string;
}

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  isCompleting?: boolean;
}

const priorityConfig = {
  high: { label: 'Haute', color: 'text-destructive', bg: 'bg-destructive/10' },
  medium: { label: 'Moyenne', color: 'text-warning', bg: 'bg-warning/10' },
  low: { label: 'Basse', color: 'text-muted-foreground', bg: 'bg-muted' },
};

export function TaskDetailModal({ task, open, onOpenChange, onComplete, isCompleting }: TaskDetailModalProps) {
  // ===== CHARGER LE WIKI =====
  const { data: wiki, isLoading: wikiLoading } = useElementWiki(task?.id);
  
  if (!task) return null;

  const isCompleted = task.status === 'done';
  const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.medium;
  const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date));
  const isDueToday = task.due_date && isToday(parseISO(task.due_date));
  const hasWiki = !!wiki;
  const isFromProgram = !!task.created_from_program;

  // Parser la description enrichie (fallback si pas de wiki)
  const descriptionParts = task.description?.split('\n\n') || [];
  const mainDescription = descriptionParts[0] || '';
  const whySection = descriptionParts.find(p => p.includes('Pourquoi'));
  const howSection = descriptionParts.find(p => p.includes('Comment'));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg pr-8">{task.title}</DialogTitle>
          
          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge className={cn(priority.bg, priority.color, "border-0")}>
              <Flag className="h-3 w-3 mr-1" />
              {priority.label}
            </Badge>
            
            {task.due_date && (
              <Badge variant={isOverdue ? "destructive" : isDueToday ? "default" : "outline"}>
                <Calendar className="h-3 w-3 mr-1" />
                {isOverdue ? 'En retard' : isDueToday ? "Aujourd'hui" : format(parseISO(task.due_date), 'd MMM', { locale: fr })}
              </Badge>
            )}
            
            {isFromProgram && (
              <Badge className="bg-primary/15 text-primary border-0">
                <Sparkles className="h-3 w-3 mr-1" />
                Programme
              </Badge>
            )}
            
            {isCompleted && (
              <Badge className="bg-success/15 text-success border-0">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Terminée
              </Badge>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {/* ===== SI WIKI DISPONIBLE ===== */}
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

              <TabsContent value="why" className="mt-0">
                <ScrollArea className="h-[300px] pr-3">
                  <div className="space-y-4">
                    {/* Pourquoi */}
                    {wiki.why_this_practice && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-primary" />
                          <h4 className="font-semibold text-sm">Pourquoi cette tâche ?</h4>
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
                            {wiki.immediate_benefits.map((b: string, i: number) => (
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
                            {wiki.long_term_benefits.map((b: string, i: number) => (
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
                          {wiki.personalized_tips.map((tip: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 p-2 rounded bg-accent/5 text-xs">
                              <span>🎯</span>
                              <span>{tip}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="how" className="mt-0">
                <ScrollArea className="h-[300px] pr-3">
                  <div className="space-y-4">
                    {/* Guide pas à pas */}
                    {wiki.how_to_guide && wiki.how_to_guide.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-primary" />
                          <h4 className="font-semibold text-sm">Comment faire</h4>
                        </div>
                        <div className="space-y-2">
                          {wiki.how_to_guide.map((step: any, i: number) => (
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
                          {wiki.best_practices.map((tip: string, i: number) => (
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
                          {wiki.common_mistakes.map((mistake: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <span>❌</span>
                              <span>{mistake}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          ) : wikiLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Chargement...
            </div>
          ) : (
            /* ===== FALLBACK : PARSER LA DESCRIPTION ===== */
            <div className="space-y-4 py-2">
              {/* Description principale */}
              {mainDescription && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {mainDescription}
                </p>
              )}

              {/* Section Pourquoi (depuis description) */}
              {whySection && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold text-sm">Pourquoi maintenant ?</h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {whySection.replace(/📖\s*Pourquoi[^:]*:\s*/i, '').trim()}
                  </p>
                </div>
              )}

              {/* Section Comment (depuis description) */}
              {howSection && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <h4 className="font-semibold text-sm">Comment faire</h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {howSection.replace(/✅\s*Comment[^:]*:\s*/i, '').trim()}
                  </p>
                </div>
              )}

              {/* Message si rien */}
              {!mainDescription && !whySection && !howSection && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Pas de détails supplémentaires pour cette tâche.
                </p>
              )}
            </div>
          )}

          {/* Alerte si en retard */}
          {isOverdue && !isCompleted && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 mt-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                <p className="text-sm text-destructive">
                  Cette tâche est en retard de {Math.abs(Math.floor((new Date().getTime() - parseISO(task.due_date!).getTime()) / (1000 * 60 * 60 * 24)))} jour(s)
                </p>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Footer avec bouton compléter */}
        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          {!isCompleted && (
            <Button onClick={onComplete} disabled={isCompleting} className="bg-success hover:bg-success/90">
              {isCompleting ? (
                <>Enregistrement...</>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Terminer
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TaskDetailModal;
