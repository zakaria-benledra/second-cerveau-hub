import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle2, Clock, Calendar, Flag, Sparkles, 
  AlertTriangle, BookOpen, Play, Target, Brain, Lightbulb, Info
} from 'lucide-react';
import { format, parseISO, isToday, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
  variant?: 'default' | 'success' | 'primary' | 'warning' | 'destructive';
}) {
  const variantStyles = {
    default: 'border-border/50 bg-muted/30',
    success: 'border-success/30 bg-success/5',
    primary: 'border-primary/30 bg-primary/5',
    warning: 'border-warning/30 bg-warning/5',
    destructive: 'border-destructive/30 bg-destructive/5',
  };

  const iconStyles = {
    default: 'text-foreground',
    success: 'text-success',
    primary: 'text-primary',
    warning: 'text-warning',
    destructive: 'text-destructive',
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

export function TaskDetailModal({ task, open, onOpenChange, onComplete, isCompleting }: TaskDetailModalProps) {
  if (!task) return null;

  const isCompleted = task.status === 'done';
  const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.medium;
  const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date));
  const isDueToday = task.due_date && isToday(parseISO(task.due_date));

  // Parser la description enrichie (si elle contient les sections Pourquoi/Comment)
  const descriptionParts = task.description?.split('\n\n') || [];
  const mainDescription = descriptionParts[0] || '';
  const whySection = descriptionParts.find(p => p.startsWith('📖 Pourquoi') || p.includes('Pourquoi'));
  const howSection = descriptionParts.find(p => p.startsWith('✅ Comment') || p.includes('Comment faire'));

  const hasEnrichedContent = whySection || howSection || task.created_from_program;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 bg-gradient-to-b from-primary/10 to-transparent">
          <DialogHeader>
            <div className="flex items-start gap-4">
              <div className="text-3xl p-3 rounded-xl bg-background/80 backdrop-blur shadow-sm">
                📋
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl leading-tight">{task.title}</DialogTitle>
                {mainDescription && !hasEnrichedContent && (
                  <DialogDescription className="mt-1.5 line-clamp-2">
                    {mainDescription}
                  </DialogDescription>
                )}
              </div>
            </div>
          </DialogHeader>
          
          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge className={cn(priority.bg, priority.color, priority.border, "border")}>
              <Flag className="h-3 w-3 mr-1" />
              {priority.label}
            </Badge>
            
            {task.due_date && (
              <Badge 
                variant={isOverdue ? "destructive" : "outline"}
                className={cn(isDueToday && "bg-primary/15 text-primary border-primary/30")}
              >
                <Calendar className="h-3 w-3 mr-1" />
                {isOverdue ? 'En retard' : isDueToday ? "Aujourd'hui" : format(parseISO(task.due_date), 'd MMM', { locale: fr })}
              </Badge>
            )}
            
            {task.created_from_program && (
              <Badge className="bg-primary/15 text-primary border-primary/30 border">
                <Sparkles className="h-3 w-3 mr-1" />
                Programme
              </Badge>
            )}
            
            {isCompleted && (
              <Badge className="bg-success/15 text-success border-success/30 border">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Terminée
              </Badge>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 pb-4">
            {hasEnrichedContent ? (
              <>
                {/* Description principale */}
                {mainDescription && (
                  <Section icon={Target} title="📋 Description" variant="default">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {mainDescription}
                    </p>
                  </Section>
                )}

                {/* 🧠 POURQUOI CETTE TÂCHE ? */}
                {whySection && (
                  <Section icon={Brain} title="🧠 Pourquoi maintenant ?" variant="primary">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {whySection.replace(/📖 Pourquoi.*?:/, '').replace(/Pourquoi.*?:/, '').trim()}
                    </p>
                  </Section>
                )}

                {/* ✅ COMMENT FAIRE */}
                {howSection && (
                  <Section icon={CheckCircle2} title="✅ Comment faire" variant="success">
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {howSection.replace(/✅ Comment.*?:/, '').replace(/Comment faire.*?:/, '').trim()}
                    </p>
                  </Section>
                )}

                {/* Conseil si vient d'un programme */}
                {task.created_from_program && !whySection && !howSection && (
                  <Section icon={Lightbulb} title="💡 Conseil" variant="warning">
                    <p className="text-sm text-muted-foreground">
                      Cette tâche fait partie de ton programme de transformation. 
                      Complète-la pour maintenir ta dynamique et progresser vers tes objectifs.
                    </p>
                  </Section>
                )}
              </>
            ) : (
              /* Tâche manuelle simple */
              <div className="py-8 text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                  <Info className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <div>
                  <p className="text-sm font-medium">Tâche personnelle</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Créée manuellement
                  </p>
                </div>
                {mainDescription && (
                  <div className="p-4 rounded-lg bg-muted/30 text-left">
                    <p className="text-sm text-muted-foreground">
                      {mainDescription}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Alerte si en retard */}
            {isOverdue && !isCompleted && (
              <Section icon={AlertTriangle} title="⚠️ Attention" variant="destructive">
                <p className="text-sm text-muted-foreground">
                  Cette tâche est en retard de{' '}
                  <strong className="text-destructive">
                    {Math.abs(Math.floor((new Date().getTime() - parseISO(task.due_date!).getTime()) / (1000 * 60 * 60 * 24)))} jour(s)
                  </strong>
                </p>
              </Section>
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
