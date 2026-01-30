import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  useAutomationRules, 
  useAutomationEvents,
  useCreateAutomationRule,
  useUpdateAutomationRule,
  useDeleteAutomationRule,
} from '@/hooks/useAutomation';
import { AUTOMATION_TEMPLATES } from '@/lib/api/automation';
import { 
  Zap, 
  Plus, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Trash2,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Target,
  ArrowRight,
  Settings,
  Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const triggerIcons: Record<string, typeof Zap> = {
  'habit.missed': Target,
  'budget.threshold_reached': AlertTriangle,
  'day.overloaded': TrendingUp,
  'user.inactive_7d': Clock,
  'goal.completed': Sparkles,
};

const statusColors: Record<string, string> = {
  pending: 'bg-warning/15 text-warning',
  processing: 'bg-info/15 text-info',
  completed: 'bg-success/15 text-success',
  failed: 'bg-destructive/15 text-destructive',
};

const triggerOptions = [
  { value: 'habit.missed', label: 'Habitude manquée' },
  { value: 'task.overdue', label: 'Tâche en retard' },
  { value: 'budget.threshold_reached', label: 'Budget dépassé' },
  { value: 'goal.completed', label: 'Objectif atteint' },
  { value: 'score.dropped', label: 'Score en baisse' },
];

const actionOptions = [
  { value: 'notify', label: 'Envoyer notification' },
  { value: 'create_task', label: 'Créer une tâche' },
  { value: 'ai_suggest', label: 'Suggestion IA' },
  { value: 'update_score', label: 'Mettre à jour score' },
];

export default function AutomationPage() {
  const { data: rules, isLoading: rulesLoading } = useAutomationRules();
  const { data: events, isLoading: eventsLoading } = useAutomationEvents(20);
  const createRule = useCreateAutomationRule();
  const updateRule = useUpdateAutomationRule();
  const deleteRule = useDeleteAutomationRule();

  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    trigger_event: '',
    action_type: '',
    description: '',
  });

  const handleAddTemplate = async (template: typeof AUTOMATION_TEMPLATES[0]) => {
    await createRule.mutateAsync({
      name: template.name,
      description: template.description,
      trigger_event: template.trigger_event,
      action_type: template.action_type,
    });
  };

  const handleCreateRule = async () => {
    if (!newRule.name || !newRule.trigger_event || !newRule.action_type) return;
    
    await createRule.mutateAsync({
      name: newRule.name,
      description: newRule.description,
      trigger_event: newRule.trigger_event,
      action_type: newRule.action_type,
    });
    
    setNewRule({ name: '', trigger_event: '', action_type: '', description: '' });
    setIsBuilderOpen(false);
  };

  const handleToggleRule = async (id: string, isActive: boolean) => {
    await updateRule.mutateAsync({ id, input: { is_active: !isActive } });
  };

  const handleDeleteRule = async (id: string) => {
    await deleteRule.mutateAsync(id);
  };

  if (rulesLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const activeRules = rules?.filter(r => r.is_active) || [];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gradient flex items-center gap-2">
              <Zap className="h-8 w-8 text-primary" />
              Automations
            </h1>
            <p className="text-muted-foreground mt-1">
              Règles IF → THEN pour automatiser votre système
            </p>
          </div>
          
          <div className="flex gap-2">
            <Badge variant="outline" className="px-3 py-1.5 text-sm">
              {activeRules.length} actives
            </Badge>
            
            <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground shadow-lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle règle
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-strong sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Créer une automation
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  {/* Rule Name */}
                  <div className="space-y-2">
                    <Label>Nom de la règle</Label>
                    <Input
                      placeholder="Ex: Alerte habitude manquée"
                      value={newRule.name}
                      onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                      className="glass-hover"
                    />
                  </div>
                  
                  {/* Visual IF → THEN Builder */}
                  <div className="space-y-4">
                    {/* IF Section */}
                    <div className="p-4 rounded-xl border border-border/50 bg-card/50">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className="bg-primary/15 text-primary">IF</Badge>
                        <span className="text-sm text-muted-foreground">Quand cet événement se produit</span>
                      </div>
                      <Select
                        value={newRule.trigger_event}
                        onValueChange={(v) => setNewRule({ ...newRule, trigger_event: v })}
                      >
                        <SelectTrigger className="glass-hover">
                          <SelectValue placeholder="Choisir un déclencheur..." />
                        </SelectTrigger>
                        <SelectContent>
                          {triggerOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Arrow */}
                    <div className="flex justify-center">
                      <ArrowRight className="h-6 w-6 text-muted-foreground" />
                    </div>
                    
                    {/* THEN Section */}
                    <div className="p-4 rounded-xl border border-border/50 bg-card/50">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className="bg-accent/15 text-accent">THEN</Badge>
                        <span className="text-sm text-muted-foreground">Exécuter cette action</span>
                      </div>
                      <Select
                        value={newRule.action_type}
                        onValueChange={(v) => setNewRule({ ...newRule, action_type: v })}
                      >
                        <SelectTrigger className="glass-hover">
                          <SelectValue placeholder="Choisir une action..." />
                        </SelectTrigger>
                        <SelectContent>
                          {actionOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <div className="space-y-2">
                    <Label>Description (optionnel)</Label>
                    <Input
                      placeholder="Décrire ce que fait cette règle..."
                      value={newRule.description}
                      onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                      className="glass-hover"
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsBuilderOpen(false)}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleCreateRule}
                    disabled={!newRule.name || !newRule.trigger_event || !newRule.action_type || createRule.isPending}
                    className="gradient-primary"
                  >
                    {createRule.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Créer la règle
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="rules" className="w-full">
          <TabsList className="glass-strong">
            <TabsTrigger value="rules" className="gap-2">
              <Zap className="h-4 w-4" />
              Règles ({rules?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Clock className="h-4 w-4" />
              Historique
            </TabsTrigger>
          </TabsList>

          {/* Rules Tab */}
          <TabsContent value="rules" className="mt-6 space-y-4">
            {rules?.length === 0 ? (
              <Card className="glass border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Zap className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucune automation</h3>
                  <p className="text-muted-foreground text-sm text-center mb-4">
                    Créez des règles IF/THEN pour automatiser votre système
                  </p>
                  <Button variant="outline" onClick={() => setIsBuilderOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une règle
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {rules?.map((rule) => {
                  const TriggerIcon = triggerIcons[rule.trigger_event] || Zap;
                  return (
                    <Card key={rule.id} className={cn(
                      'glass-hover transition-all',
                      !rule.is_active && 'opacity-60'
                    )}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className={cn(
                              'p-2.5 rounded-xl',
                              rule.is_active ? 'bg-primary/15' : 'bg-muted'
                            )}>
                              <TriggerIcon className={cn(
                                'h-5 w-5',
                                rule.is_active ? 'text-primary' : 'text-muted-foreground'
                              )} />
                            </div>
                            <div>
                              <h3 className="font-medium">{rule.name}</h3>
                              {rule.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {rule.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs bg-primary/10">
                                  IF {rule.trigger_event}
                                </Badge>
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                <Badge variant="outline" className="text-xs bg-accent/10">
                                  THEN {rule.action_type}
                                </Badge>
                              </div>
                              {rule.trigger_count > 0 && (
                                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                  <Play className="h-3 w-3" />
                                  Exécuté {rule.trigger_count} fois
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={rule.is_active}
                              onCheckedChange={() => handleToggleRule(rule.id, rule.is_active)}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteRule(rule.id)}
                              className="text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="mt-6">
            <div className="grid md:grid-cols-2 gap-4">
              {AUTOMATION_TEMPLATES.map((template) => {
                const TriggerIcon = triggerIcons[template.trigger_event] || Zap;
                const isAdded = rules?.some(r => r.trigger_event === template.trigger_event);
                
                return (
                  <Card key={template.id} className="glass-hover hover-lift">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-primary/15">
                            <TriggerIcon className="h-5 w-5 text-primary" />
                          </div>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                        </div>
                        {isAdded && (
                          <Badge variant="outline" className="text-xs bg-success/10 text-success border-0">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Ajouté
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {template.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {template.trigger_event}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant={isAdded ? 'outline' : 'default'}
                          onClick={() => handleAddTemplate(template)}
                          disabled={createRule.isPending}
                          className={cn(!isAdded && 'gradient-primary')}
                        >
                          {createRule.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isAdded ? (
                            'Ajouter à nouveau'
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-1" />
                              Ajouter
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Événements récents</CardTitle>
                <CardDescription>
                  Historique des automations déclenchées
                </CardDescription>
              </CardHeader>
              <CardContent>
                {eventsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : events?.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">Aucun événement</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {events?.map((event) => (
                      <div 
                        key={event.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-border/50 glass-hover"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'p-1.5 rounded-full',
                            statusColors[event.status] || 'bg-muted'
                          )}>
                            {event.status === 'completed' ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : event.status === 'failed' ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <Clock className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{event.event_type}</p>
                            <p className="text-xs text-muted-foreground">
                              {event.entity} • {new Date(event.created_at).toLocaleString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className={cn('text-xs', statusColors[event.status])}>
                          {event.status === 'completed' ? 'Succès' : 
                           event.status === 'failed' ? 'Échec' : 
                           event.status === 'processing' ? 'En cours' : 'En attente'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
