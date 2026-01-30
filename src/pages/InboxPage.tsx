import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  useInboxItems, 
  useCreateInboxItem, 
  useConvertInboxToTask, 
  useArchiveInboxItem,
  useDeleteInboxItem 
} from '@/hooks/useInbox';
import { 
  Plus, 
  Inbox, 
  Loader2, 
  ArrowRight, 
  Archive, 
  Trash2,
  Mail,
  StickyNote,
  Zap,
  Calendar,
  Sparkles
} from 'lucide-react';
import type { CreateInboxInput } from '@/lib/api/inbox';
import { cn } from '@/lib/utils';

const sourceIcons: Record<string, React.ReactNode> = {
  email: <Mail className="h-4 w-4" />,
  note: <StickyNote className="h-4 w-4" />,
  capture: <Zap className="h-4 w-4" />,
  agent: <Zap className="h-4 w-4" />,
  calendar: <Calendar className="h-4 w-4" />,
};

const sourceLabels: Record<string, string> = {
  email: 'Email',
  note: 'Note',
  capture: 'Capture',
  agent: 'Agent IA',
  calendar: 'Calendrier',
};

export default function InboxPage() {
  const { data: items, isLoading } = useInboxItems();
  const createItem = useCreateInboxItem();
  const convertToTask = useConvertInboxToTask();
  const archiveItem = useArchiveInboxItem();
  const deleteItem = useDeleteInboxItem();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState<CreateInboxInput>({
    title: '',
    content: '',
    source: 'capture',
  });

  const handleCreateItem = async () => {
    if (!newItem.title.trim()) return;
    
    await createItem.mutateAsync(newItem);
    setNewItem({ title: '', content: '', source: 'capture' });
    setIsDialogOpen(false);
  };

  const newItems = items?.filter(i => i.status === 'new') || [];
  const processedItems = items?.filter(i => i.status === 'processed') || [];

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
            <p className="text-muted-foreground mt-1">
              {newItems.length} élément{newItems.length > 1 ? 's' : ''} à traiter
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient">
                <Plus className="h-4 w-4 mr-2" />
                Capturer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Capture rapide</DialogTitle>
                <DialogDescription>
                  Capturez une idée, une tâche ou une note pour la traiter plus tard
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre</Label>
                  <Input
                    id="title"
                    value={newItem.title}
                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                    placeholder="Ex: Rappeler le client demain"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Détails (optionnel)</Label>
                  <Textarea
                    id="content"
                    value={newItem.content || ''}
                    onChange={(e) => setNewItem({ ...newItem, content: e.target.value })}
                    placeholder="Plus de contexte..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleCreateItem} 
                  disabled={createItem.isPending || !newItem.title.trim()}
                >
                  {createItem.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Capturer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="hover-lift">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Inbox className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{newItems.length}</p>
                <p className="text-xs text-muted-foreground">À traiter</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-lift">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Archive className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{processedItems.length}</p>
                <p className="text-xs text-muted-foreground">Traités</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* New Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Inbox className="h-5 w-5 text-primary" />
              À traiter
            </CardTitle>
            <CardDescription>
              Éléments en attente de traitement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {newItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-4 p-4 rounded-xl border hover:bg-muted/50 transition-colors group hover-lift"
              >
                <div className="p-2.5 rounded-lg bg-muted">
                  {sourceIcons[item.source]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{item.title}</p>
                  {item.content && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {item.content}
                    </p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <Badge variant="muted" className="text-xs">
                      {sourceLabels[item.source]}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {new Date(item.created_at).toLocaleDateString('fr-FR')}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => convertToTask.mutate(item.id)}
                    disabled={convertToTask.isPending}
                    title="Convertir en tâche"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => archiveItem.mutate(item.id)}
                    title="Archiver"
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => deleteItem.mutate(item.id)}
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}

            {newItems.length === 0 && (
              <div className="text-center py-12">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-lg mb-1">Inbox vide</h3>
                <p className="text-muted-foreground mb-4">
                  Bravo ! Vous avez tout traité ✨
                </p>
                <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Capturer quelque chose
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Processed Items */}
        {processedItems.length > 0 && (
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-muted-foreground text-base">
                <Archive className="h-5 w-5" />
                Traités récemment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {processedItems.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-background/50"
                >
                  {sourceIcons[item.source]}
                  <span className="text-sm text-muted-foreground flex-1 truncate">
                    {item.title}
                  </span>
                  <Badge variant="success" className="text-xs">
                    Converti
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
