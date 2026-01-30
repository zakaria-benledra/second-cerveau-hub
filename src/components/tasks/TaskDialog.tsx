import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Clock, Zap, FolderKanban, Target, Flag } from 'lucide-react';
import type { Task, CreateTaskInput, UpdateTaskInput } from '@/lib/api/tasks';
import { useProjects, useGoals } from '@/hooks/useProjects';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  onSave: (data: CreateTaskInput | UpdateTaskInput) => Promise<void>;
  isPending?: boolean;
  mode: 'create' | 'edit';
}

const priorityOptions = [
  { value: 'low', label: 'Basse', color: 'text-muted-foreground' },
  { value: 'medium', label: 'Moyenne', color: 'text-primary' },
  { value: 'high', label: 'Haute', color: 'text-warning' },
  { value: 'urgent', label: 'Urgente', color: 'text-destructive' },
];

const energyOptions = [
  { value: 'low', label: 'Faible', icon: '🔋' },
  { value: 'medium', label: 'Moyenne', icon: '⚡' },
  { value: 'high', label: 'Haute', icon: '🚀' },
];

const statusOptions = [
  { value: 'todo', label: 'À faire' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'done', label: 'Terminé' },
];

export function TaskDialog({ open, onOpenChange, task, onSave, isPending, mode }: TaskDialogProps) {
  const { data: projects = [] } = useProjects();
  const { data: goals = [] } = useGoals();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as string,
    status: 'todo' as string,
    due_date: '',
    start_date: '',
    estimate_min: '',
    energy_level: '',
    project_id: '',
    goal_id: '',
  });

  useEffect(() => {
    if (task && mode === 'edit') {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        status: task.status || 'todo',
        due_date: task.due_date || '',
        start_date: task.start_date || '',
        estimate_min: task.estimate_min?.toString() || '',
        energy_level: task.energy_level || '',
        project_id: task.project_id || '',
        goal_id: task.goal_id || '',
      });
    } else if (mode === 'create') {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'todo',
        due_date: '',
        start_date: '',
        estimate_min: '',
        energy_level: '',
        project_id: '',
        goal_id: '',
      });
    }
  }, [task, mode, open]);

  const handleSave = async () => {
    if (!formData.title.trim()) return;

    const data: CreateTaskInput | UpdateTaskInput = {
      title: formData.title,
      description: formData.description || undefined,
      priority: formData.priority as Task['priority'],
      due_date: formData.due_date || undefined,
      start_date: formData.start_date || undefined,
      estimate_min: formData.estimate_min ? parseInt(formData.estimate_min) : undefined,
      energy_level: (formData.energy_level || undefined) as Task['energy_level'],
      project_id: formData.project_id || undefined,
      goal_id: formData.goal_id || undefined,
    };

    if (mode === 'edit') {
      (data as UpdateTaskInput).status = formData.status as Task['status'];
    }

    await onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nouvelle tâche' : 'Modifier la tâche'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Créez une nouvelle tâche avec tous les détails'
              : 'Modifiez les informations de cette tâche'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Finir le rapport trimestriel"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Détails, notes, contexte..."
              rows={3}
            />
          </div>

          {/* Priorité & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Flag className="w-4 h-4" />
                Priorité
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(v) => setFormData({ ...formData, priority: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className={opt.color}>{opt.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {mode === 'edit' && (
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {mode === 'create' && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Énergie requise
                </Label>
                <Select
                  value={formData.energy_level}
                  onValueChange={(v) => setFormData({ ...formData, energy_level: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {energyOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.icon} {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date de début
              </Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Échéance
              </Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

          {/* Estimation & Énergie (en mode edit) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Estimation (min)
              </Label>
              <Input
                type="number"
                value={formData.estimate_min}
                onChange={(e) => setFormData({ ...formData, estimate_min: e.target.value })}
                placeholder="30"
                min={1}
              />
            </div>
            {mode === 'edit' && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Énergie requise
                </Label>
                <Select
                  value={formData.energy_level}
                  onValueChange={(v) => setFormData({ ...formData, energy_level: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {energyOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.icon} {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Projet & Objectif */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4" />
                Projet
              </Label>
              <Select
                value={formData.project_id}
                onValueChange={(v) => setFormData({ ...formData, project_id: v === 'none' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Aucun projet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun projet</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Objectif
              </Label>
              <Select
                value={formData.goal_id}
                onValueChange={(v) => setFormData({ ...formData, goal_id: v === 'none' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Aucun objectif" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun objectif</SelectItem>
                  {goals.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isPending || !formData.title.trim()}
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {mode === 'create' ? 'Créer' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
