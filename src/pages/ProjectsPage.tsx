import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  FolderKanban, 
  MoreHorizontal, 
  Calendar,
  CheckCircle2,
  Circle,
  Archive,
  Trash2,
  Edit,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject, useDomains, useCreateDomain } from '@/hooks/useProjects';
import { useToast } from '@/hooks/use-toast';

const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/20',
  on_hold: 'bg-warning/10 text-warning border-warning/20',
  completed: 'bg-muted text-muted-foreground border-muted',
  archived: 'bg-muted/50 text-muted-foreground border-muted/50',
};

const statusLabels: Record<string, string> = {
  active: 'Actif',
  on_hold: 'En pause',
  completed: 'Terminé',
  archived: 'Archivé',
};

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const { data: domains } = useDomains();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const createDomain = useCreateDomain();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [domainDialogOpen, setDomainDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', domain_id: '' });
  const [newDomain, setNewDomain] = useState({ name: '', color: '#8B5CF6' });
  const [filter, setFilter] = useState<string>('all');

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) return;

    try {
      await createProject.mutateAsync({
        name: newProject.name,
        description: newProject.description || null,
        domain_id: newProject.domain_id || null,
        status: 'active',
      });
      setNewProject({ name: '', description: '', domain_id: '' });
      setDialogOpen(false);
      toast({ title: 'Projet créé avec succès' });
    } catch (error) {
      toast({ title: 'Erreur lors de la création', variant: 'destructive' });
    }
  };

  const handleCreateDomain = async () => {
    if (!newDomain.name.trim()) return;

    try {
      await createDomain.mutateAsync({
        name: newDomain.name,
        color: newDomain.color,
      });
      setNewDomain({ name: '', color: '#8B5CF6' });
      setDomainDialogOpen(false);
      toast({ title: 'Domaine créé avec succès' });
    } catch (error) {
      toast({ title: 'Erreur lors de la création', variant: 'destructive' });
    }
  };

  const handleStatusChange = async (projectId: string, status: string) => {
    try {
      await updateProject.mutateAsync({ id: projectId, updates: { status } });
      toast({ title: 'Statut mis à jour' });
    } catch (error) {
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  };

  const handleDelete = async (projectId: string) => {
    try {
      await deleteProject.mutateAsync(projectId);
      toast({ title: 'Projet supprimé' });
    } catch (error) {
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  };

  const filteredProjects = projects?.filter(p => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const activeCount = projects?.filter(p => p.status === 'active').length || 0;
  const completedCount = projects?.filter(p => p.status === 'completed').length || 0;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projets</h1>
            <p className="text-muted-foreground mt-1">
              Gérez vos projets et domaines d'activité
            </p>
          </div>

          <div className="flex gap-2">
            <Dialog open={domainDialogOpen} onOpenChange={setDomainDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Domaine
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouveau domaine</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <Input
                    placeholder="Nom du domaine"
                    value={newDomain.name}
                    onChange={(e) => setNewDomain({ ...newDomain, name: e.target.value })}
                  />
                  <Input
                    type="color"
                    value={newDomain.color}
                    onChange={(e) => setNewDomain({ ...newDomain, color: e.target.value })}
                    className="h-10 w-20"
                  />
                  <Button onClick={handleCreateDomain} className="w-full">
                    Créer le domaine
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau projet
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouveau projet</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <Input
                    placeholder="Nom du projet"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  />
                  <Input
                    placeholder="Description (optionnel)"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  />
                  {domains && domains.length > 0 && (
                    <Select
                      value={newProject.domain_id}
                      onValueChange={(value) => setNewProject({ ...newProject, domain_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un domaine" />
                      </SelectTrigger>
                      <SelectContent>
                        {domains.map((domain) => (
                          <SelectItem key={domain.id} value={domain.id}>
                            {domain.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Button onClick={handleCreateProject} className="w-full">
                    Créer le projet
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="hover-lift cursor-pointer" onClick={() => setFilter('all')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FolderKanban className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{projects?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-lift cursor-pointer" onClick={() => setFilter('active')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <Circle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeCount}</p>
                  <p className="text-xs text-muted-foreground">Actifs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-lift cursor-pointer" onClick={() => setFilter('completed')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <CheckCircle2 className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedCount}</p>
                  <p className="text-xs text-muted-foreground">Terminés</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-lift cursor-pointer" onClick={() => setFilter('on_hold')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Calendar className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{projects?.filter(p => p.status === 'on_hold').length || 0}</p>
                  <p className="text-xs text-muted-foreground">En pause</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6 h-40" />
              </Card>
            ))}
          </div>
        ) : filteredProjects && filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover-lift group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      {project.description && (
                        <CardDescription className="mt-1 line-clamp-2">
                          {project.description}
                        </CardDescription>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStatusChange(project.id, 'active')}>
                          <Circle className="h-4 w-4 mr-2 text-success" />
                          Marquer actif
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(project.id, 'on_hold')}>
                          <Calendar className="h-4 w-4 mr-2 text-warning" />
                          Mettre en pause
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(project.id, 'completed')}>
                          <CheckCircle2 className="h-4 w-4 mr-2 text-info" />
                          Marquer terminé
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(project.id, 'archived')}>
                          <Archive className="h-4 w-4 mr-2" />
                          Archiver
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(project.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={statusColors[project.status]}>
                      {statusLabels[project.status] || project.status}
                    </Badge>
                    {(project as any).domains?.name && (
                      <Badge variant="muted">
                        {(project as any).domains.name}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderKanban className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold text-lg mb-1">Aucun projet</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Créez votre premier projet pour organiser vos tâches
              </p>
              <Button variant="gradient" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un projet
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
