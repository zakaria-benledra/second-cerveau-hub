import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle2, Clock, Calendar, Flag, Sparkles, 
  AlertTriangle, BookOpen, Play
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
  high: { label: 'Haute', color: 'text-destructive', bg: 'bg-destructive/10' },
  medium: { label: 'Moyenne', color: 'text-warning', bg: 'bg-warning/10' },
  low: { label: 'Basse', color: 'text-muted-foreground', bg: 'bg-muted' },
};

export function TaskDetailModal({ task, open, onOpenChange, onComplete, isCompleting }: TaskDetailModalProps) {
  if (!task) return null;

  const isCompleted = task.status === 'done';
  const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.medium;
  const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date));
  const isDueToday = task.due_date && isToday(parseISO(task.due_date));

  // Parser la description enrichie (si elle contient les sections Pourquoi/Comment)
  const descriptionParts = task.description?.split('\n\n') || [];
  const mainDescription = descriptionParts[0] || '';
  const whySection = descriptionParts.find(p => p.startsWith('📖 Pourquoi'));
  const howSection = descriptionParts.find(p => p.startsWith('✅ Comment'));

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
            
            {task.created_from_program && (
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
          <div className="space-y-4 py-2">
            {/* Description principale */}
            {mainDescription && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {mainDescription}
                </p>
              </div>
            )}

            {/* Section Pourquoi (si vient du programme) */}
            {whySection && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold text-sm">Pourquoi maintenant ?</h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {whySection.replace('📖 Pourquoi maintenant:', '').trim()}
                </p>
              </div>
            )}

            {/* Section Comment (si vient du programme) */}
            {howSection && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <h4 className="font-semibold text-sm">Comment faire</h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {howSection.replace('✅ Comment faire:', '').trim()}
                </p>
              </div>
            )}

            {/* Alerte si en retard */}
            {isOverdue && !isCompleted && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                  <p className="text-sm text-destructive">
                    Cette tâche est en retard de {Math.abs(Math.floor((new Date().getTime() - parseISO(task.due_date!).getTime()) / (1000 * 60 * 60 * 24)))} jour(s)
                  </p>
                </div>
              </div>
            )}
          </div>
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
