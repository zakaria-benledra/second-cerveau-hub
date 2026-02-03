import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle2, Calendar, Flag, Sparkles, 
  AlertTriangle
} from 'lucide-react';
import { format, parseISO, isToday, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useUserProfile } from '@/hooks/useUserProfile';

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
  high: { label: 'Haute', color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
  urgent: { label: 'Urgente', color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
  medium: { label: 'Moyenne', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
  low: { label: 'Basse', color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border' },
};

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

export function TaskDetailModal({ task, open, onOpenChange, onComplete, isCompleting }: TaskDetailModalProps) {
  const { data: profile } = useUserProfile();
  
  if (!task) return null;

  const isCompleted = task.status === 'done';
  const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.medium;
  const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date));
  const isDueToday = task.due_date && isToday(parseISO(task.due_date));
  const userName = profile?.display_name || 'toi';

  // Parse enriched description (if it contains Pourquoi/Comment sections)
  const descriptionParts = task.description?.split('\n\n') || [];
  const mainDescription = descriptionParts[0] || '';
  const whySection = descriptionParts.find(p => p.includes('Pourquoi'));
  const howSection = descriptionParts.find(p => p.includes('Comment'));
  const hasEnrichedContent = task.created_from_program || whySection || howSection;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 overflow-hidden">
        {/* Header Card - Title Section */}
        <div className="p-4 bg-gradient-to-b from-primary/10 to-transparent">
          <div className="border-2 border-primary/30 rounded-lg p-4 bg-background/50 backdrop-blur">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <span className="text-3xl">📋</span>
                <div className="flex-1">
                  <DialogTitle className="text-lg font-bold">
                    {task.title}
                  </DialogTitle>
                </div>
              </div>
            </DialogHeader>
            
            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mt-3 pl-10">
              <Badge className={cn(priority.bg, priority.color, priority.border, "border text-xs")}>
                <Flag className="h-3 w-3 mr-1" />
                {priority.label}
              </Badge>
              
              {task.due_date && (
                <Badge 
                  variant={isOverdue ? "destructive" : "outline"}
                  className={cn("text-xs", isDueToday && "bg-primary/15 text-primary border-primary/30")}
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  {isOverdue ? 'Retard' : isDueToday ? "Aujourd'hui" : format(parseISO(task.due_date), 'd MMM', { locale: fr })}
                </Badge>
              )}
              
              {task.created_from_program && (
                <Badge className="bg-primary/15 text-primary border-primary/30 border text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  IA
                </Badge>
              )}
              
              {isCompleted && (
                <Badge className="bg-success/15 text-success border-success/30 border text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Fait
                </Badge>
              )}
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 px-4">
          <div className="pb-4">
            {/* Overdue Warning */}
            {isOverdue && !isCompleted && (
              <div className="mb-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive">
                  En retard de {Math.abs(Math.floor((new Date().getTime() - parseISO(task.due_date!).getTime()) / (1000 * 60 * 60 * 24)))} jour(s)
                </p>
              </div>
            )}

            {hasEnrichedContent ? (
              <div className="space-y-0">
                {/* 🧠 POURQUOI CETTE TÂCHE ? */}
                <TemplateSection emoji="🧠" title="Pourquoi maintenant ?" isFirst>
                  {whySection ? (
                    <p>{whySection.replace(/📖 Pourquoi.*?:/, '').replace(/Pourquoi.*?:/, '').trim()}</p>
                  ) : (
                    <p>
                      Cette tâche fait partie de ton programme de transformation. 
                      La compléter maintenant maintient ta dynamique et te rapproche de tes objectifs.
                    </p>
                  )}
                </TemplateSection>

                {/* 📖 BASE SCIENTIFIQUE */}
                <TemplateSection emoji="📖" title="Base scientifique">
                  <p>
                    Accomplir des micro-tâches libère de la dopamine, 
                    renforçant le circuit de récompense du cerveau. Chaque tâche complétée 
                    crée un momentum positif.
                  </p>
                  <p className="mt-2 text-xs italic opacity-70">
                    Source : BJ Fogg, Tiny Habits (Stanford)
                  </p>
                </TemplateSection>

                {/* ✅ COMMENT FAIRE */}
                <TemplateSection emoji="✅" title="Comment faire">
                  {howSection ? (
                    <p className="whitespace-pre-line">
                      {howSection.replace(/✅ Comment.*?:/, '').replace(/Comment faire.*?:/, '').trim()}
                    </p>
                  ) : (
                    <ol className="space-y-1.5">
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-primary">1.</span>
                        <span>Bloque un créneau de 25 min (Pomodoro)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-primary">2.</span>
                        <span>Élimine les distractions (notifications off)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-primary">3.</span>
                        <span>Concentre-toi uniquement sur cette tâche</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-primary">4.</span>
                        <span>Marque comme fait et célèbre !</span>
                      </li>
                    </ol>
                  )}
                </TemplateSection>

                {/* 🎯 CONSEIL PERSONNALISÉ */}
                <TemplateSection emoji="🎯" title={`Conseil personnalisé pour ${userName}`} isLast>
                  <p>
                    {mainDescription || 
                      `Commence par la partie la plus simple pour créer de l'élan. 
                      Tu peux ensuite enchaîner avec les aspects plus complexes.`}
                  </p>
                </TemplateSection>
              </div>
            ) : (
              /* Manual task with template structure */
              <div className="space-y-0">
                <TemplateSection emoji="🧠" title="Pourquoi maintenant ?" isFirst>
                  <p>
                    Tu as ajouté cette tâche à ta liste - c'est qu'elle compte pour toi.
                    La terminer libérera de l'espace mental précieux.
                  </p>
                </TemplateSection>

                <TemplateSection emoji="📖" title="Base scientifique">
                  <p>
                    L'effet Zeigarnik : notre cerveau garde en mémoire active les tâches 
                    inachevées, créant une tension mentale. Compléter une tâche libère 
                    cette charge cognitive.
                  </p>
                  <p className="mt-2 text-xs italic opacity-70">
                    Source : Bluma Zeigarnik (1927), The Psychology of Unfinished Tasks
                  </p>
                </TemplateSection>

                <TemplateSection emoji="✅" title="Comment faire">
                  <ol className="space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">1.</span>
                      <span>Définis le premier micro-pas (2 min max)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">2.</span>
                      <span>Lance-toi immédiatement, sans réfléchir</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">3.</span>
                      <span>Continue tant que tu es dans le flow</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">4.</span>
                      <span>Célèbre en cochant cette tâche !</span>
                    </li>
                  </ol>
                </TemplateSection>

                <TemplateSection emoji="🎯" title={`Conseil personnalisé pour ${userName}`} isLast>
                  <p>
                    {mainDescription || 
                      `Lance un programme IA pour recevoir des tâches avec des conseils 
                      entièrement personnalisés basés sur ton profil et tes objectifs.`}
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
          {!isCompleted && (
            <Button 
              onClick={onComplete} 
              disabled={isCompleting} 
              className="bg-success hover:bg-success/90 text-success-foreground"
            >
              {isCompleting ? (
                <>Enregistrement...</>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
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
