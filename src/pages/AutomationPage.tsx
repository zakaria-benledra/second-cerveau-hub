import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Play,
  Pause,
  Trash2,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Bell,
  Target,
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
  pending: 'bg-warning/10 text-warning',
  processing: 'bg-info/10 text-info',
  completed: 'bg-success/10 text-success',
  failed: 'bg-destructive/10 text-destructive',
};

export default function AutomationPage() {
  const { data: rules, isLoading: rulesLoading } = useAutomationRules();
  const { data: events, isLoading: eventsLoading } = useAutomationEvents(20);
  const createRule = useCreateAutomationRule();
  const updateRule = useUpdateAutomationRule();
  const deleteRule = useDeleteAutomationRule();

  const handleAddTemplate = async (template: typeof AUTOMATION_TEMPLATES[0]) => {
    await createRule.mutateAsync({
      name: template.name,
      description: template.description,
      trigger_event: template.trigger_event,
      action_type: template.action_type,
    });
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
  const inactiveRules = rules?.filter(r => !r.is_active) || [];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Zap className="h-8 w-8 text-primary" />
              Automations
            </h1>
            <p className="text-muted-foreground mt-1">
              Règles IF/THEN pour automatiser vos actions
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="px-3 py-1">
              {activeRules.length} actives
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="rules" className="w-full">
          <TabsList>
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
          <TabsContent value="rules" className="mt-6 space-y-6">
            {rules?.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Zap className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucune automation</h3>
                  <p className="text-muted-foreground text-sm text-center mb-4">
                    Ajoutez des règles pour automatiser vos workflows
                  </p>
                  <Button variant="outline" onClick={() => {}}>
                    <Plus className="h-4 w-4 mr-2" />
                    Voir les templates
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {rules?.map((rule) => {
                  const TriggerIcon = triggerIcons[rule.trigger_event] || Zap;
                  return (
                    <Card key={rule.id} className={cn(
                      'transition-all duration-200',
                      !rule.is_active && 'opacity-60'
                    )}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className={cn(
                              'p-2 rounded-lg',
                              rule.is_active ? 'bg-primary/10' : 'bg-muted'
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
                                <Badge variant="outline" className="text-xs">
                                  {rule.trigger_event}
                                </Badge>
                                <span className="text-muted-foreground">→</span>
                                <Badge variant="secondary" className="text-xs">
                                  {rule.action_type}
                                </Badge>
                              </div>
                              {rule.trigger_count > 0 && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Déclenché {rule.trigger_count} fois
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
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
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
                  <Card key={template.id} className="hover-lift">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <TriggerIcon className="h-5 w-5 text-primary" />
                          </div>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                        </div>
                        {isAdded && (
                          <Badge variant="secondary" className="text-xs">
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
            <Card>
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
                        className="flex items-center justify-between p-3 rounded-lg border"
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
                        <Badge variant="outline" className="text-xs">
                          {event.status}
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
