import { useState, useMemo } from 'react';
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
  Zap,
  Sparkles,
  Target,
  CheckSquare,
  FolderOpen,
  Brain,
  TrendingUp,
  Lightbulb
} from 'lucide-react';
import type { CreateInboxInput } from '@/lib/api/inbox';
import { cn } from '@/lib/utils';

// AI Classification suggestions based on content analysis
function classifyInboxItem(title: string, content?: string): {
  suggestion: 'task' | 'habit' | 'project' | 'archive';
  confidence: number;
  reason: string;
} {
  const text = `${title} ${content || ''}`.toLowerCase();
  
  // Task patterns
  if (text.match(/(faire|rappeler|envoyer|finir|terminer|appeler|répondre|préparer|acheter|réserver)/)) {
    return { suggestion: 'task', confidence: 0.85, reason: 'Action concrète détectée' };
  }
  
  // Habit patterns
  if (text.match(/(chaque jour|quotidien|routine|habitude|tous les|matin|soir|régulièrement)/)) {
    return { suggestion: 'habit', confidence: 0.9, reason: 'Récurrence suggérée' };
  }
  
  // Project patterns
  if (text.match(/(projet|lancer|créer|développer|planifier|stratégie|objectif long terme)/)) {
    return { suggestion: 'project', confidence: 0.75, reason: 'Scope important détecté' };
  }
  
  // Default to task with medium confidence
  return { suggestion: 'task', confidence: 0.6, reason: 'Classification par défaut' };
}

const classificationIcons = {
  task: CheckSquare,
  habit: TrendingUp,
  project: FolderOpen,
  archive: Archive,
};

const classificationLabels = {
  task: 'Tâche',
  habit: 'Habitude',
  project: 'Projet',
  archive: 'Archiver',
};

const classificationColors = {
  task: 'bg-primary/10 text-primary border-primary/20',
  habit: 'bg-success/10 text-success border-success/20',
  project: 'bg-accent/10 text-accent border-accent/20',
  archive: 'bg-muted text-muted-foreground border-muted',
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

  // Classify items with AI suggestions
  const classifiedItems = useMemo(() => {
    return newItems.map(item => ({
      ...item,
      classification: classifyInboxItem(item.title, item.content || undefined),
    }));
  }, [newItems]);

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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gradient">
              Capture Cognitive
            </h1>
            <p className="text-muted-foreground mt-1">
              {newItems.length} élément{newItems.length > 1 ? 's' : ''} à classifier
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                Capturer
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Capture rapide
                </DialogTitle>
                <DialogDescription>
                  L'IA analysera et suggérera une classification
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Quoi ?</Label>
                  <Input
                    id="title"
                    value={newItem.title}
                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                    placeholder="Ex: Rappeler le client demain"
                    className="glass-hover"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Contexte (optionnel)</Label>
                  <Textarea
                    id="content"
                    value={newItem.content || ''}
                    onChange={(e) => setNewItem({ ...newItem, content: e.target.value })}
                    placeholder="Plus de détails..."
                    className="glass-hover"
                  />
                </div>
                
                {/* Preview AI suggestion */}
                {newItem.title && (
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <Sparkles className="h-3 w-3" />
                      Suggestion IA
                    </div>
                    {(() => {
                      const cls = classifyInboxItem(newItem.title, newItem.content || undefined);
                      const Icon = classificationIcons[cls.suggestion];
                      return (
                        <div className="flex items-center gap-2">
                          <Badge className={classificationColors[cls.suggestion]}>
                            <Icon className="h-3 w-3 mr-1" />
                            {classificationLabels[cls.suggestion]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(cls.confidence * 100)}% • {cls.reason}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleCreateItem} 
                  disabled={createItem.isPending || !newItem.title.trim()}
                  className="gradient-primary"
                >
                  {createItem.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Capturer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="glass-hover hover-lift">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-warning/15">
                <Inbox className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{newItems.length}</p>
                <p className="text-xs text-muted-foreground">À traiter</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-hover hover-lift">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/15">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {classifiedItems.filter(i => i.classification.confidence >= 0.8).length}
                </p>
                <p className="text-xs text-muted-foreground">Haute confiance</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-hover hover-lift">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-success/15">
                <Archive className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{processedItems.length}</p>
                <p className="text-xs text-muted-foreground">Traités</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Items with AI Classification */}
        <Card className="glass-strong">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              À classifier
            </CardTitle>
            <CardDescription>
              L'IA suggère une catégorie pour chaque élément
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {classifiedItems.map((item) => {
              const cls = item.classification;
              const Icon = classificationIcons[cls.suggestion];
              
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-card/80 transition-all group hover-lift"
                >
                  {/* AI Suggestion Badge */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={cn(
                      'p-2.5 rounded-xl border',
                      classificationColors[cls.suggestion]
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {Math.round(cls.confidence * 100)}%
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{item.title}</p>
                    {item.content && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {item.content}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={cn('text-xs', classificationColors[cls.suggestion])}>
                        <Lightbulb className="h-3 w-3 mr-1" />
                        {cls.reason}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col gap-1.5">
                    <Button
                      size="sm"
                      className={cn(
                        'text-xs gap-1.5',
                        cls.suggestion === 'task' && 'gradient-primary text-primary-foreground'
                      )}
                      variant={cls.suggestion === 'task' ? 'default' : 'outline'}
                      onClick={() => convertToTask.mutate(item.id)}
                      disabled={convertToTask.isPending}
                    >
                      <CheckSquare className="h-3 w-3" />
                      Tâche
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1.5"
                      onClick={() => archiveItem.mutate(item.id)}
                    >
                      <Archive className="h-3 w-3" />
                      Archiver
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-destructive"
                      onClick={() => deleteItem.mutate(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {newItems.length === 0 && (
              <div className="text-center py-12">
                <Sparkles className="h-12 w-12 mx-auto text-success/50 mb-4" />
                <h3 className="font-semibold text-lg mb-1 text-success">Inbox vide</h3>
                <p className="text-muted-foreground mb-4">
                  Tout est classifié. Bravo ! ✨
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
          <Card className="glass-subtle bg-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-muted-foreground">
                <Archive className="h-4 w-4" />
                Traités récemment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {processedItems.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-background/50"
                >
                  <CheckSquare className="h-4 w-4 text-success" />
                  <span className="text-sm text-muted-foreground flex-1 truncate">
                    {item.title}
                  </span>
                  <Badge variant="outline" className="text-xs bg-success/10 text-success border-0">
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
