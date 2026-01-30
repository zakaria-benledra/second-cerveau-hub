import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMyJourneyEvents } from '@/hooks/useProductIntelligence';
import { 
  Brain, 
  Target, 
  Wallet, 
  AlertTriangle, 
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Zap,
  Users,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const EVENT_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  signup: { icon: <Users className="h-4 w-4" />, color: 'bg-success', label: 'Inscription' },
  activation: { icon: <Sparkles className="h-4 w-4" />, color: 'bg-primary', label: 'Activation' },
  habit_locked: { icon: <Target className="h-4 w-4" />, color: 'bg-warning', label: 'Habitude verrouillée' },
  finance_imported: { icon: <Wallet className="h-4 w-4" />, color: 'bg-accent', label: 'Finance importée' },
  ai_action_accepted: { icon: <Brain className="h-4 w-4" />, color: 'bg-purple-500', label: 'Action IA acceptée' },
  ai_action_rejected: { icon: <Brain className="h-4 w-4" />, color: 'bg-muted', label: 'Action IA refusée' },
  churn_risk: { icon: <AlertTriangle className="h-4 w-4" />, color: 'bg-destructive', label: 'Risque détecté' },
  task_completed: { icon: <CheckCircle2 className="h-4 w-4" />, color: 'bg-success', label: 'Tâche complétée' },
  focus_session: { icon: <Clock className="h-4 w-4" />, color: 'bg-blue-500', label: 'Session focus' },
  goal_achieved: { icon: <TrendingUp className="h-4 w-4" />, color: 'bg-success', label: 'Objectif atteint' },
};

export function TrajectoryTimeline() {
  const { data: events = [], isLoading } = useMyJourneyEvents(100);

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: Record<string, typeof events> = {};
    
    events.forEach(event => {
      const date = event.created_at.split('T')[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(event);
    });
    
    return Object.entries(groups)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 7);
  }, [events]);

  // Calculate trajectory stats
  const stats = useMemo(() => {
    const aiAccepted = events.filter(e => e.event_type === 'ai_action_accepted').length;
    const aiTotal = events.filter(e => e.event_type.startsWith('ai_action')).length;
    const habitsLocked = events.filter(e => e.event_type === 'habit_locked').length;
    const financeImports = events.filter(e => e.event_type === 'finance_imported').length;
    
    return {
      aiAcceptanceRate: aiTotal > 0 ? Math.round((aiAccepted / aiTotal) * 100) : 0,
      habitsLocked,
      financeImports,
      totalEvents: events.length,
    };
  }, [events]);

  if (isLoading) {
    return (
      <Card className="glass-strong">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-strong h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Trajectoire Utilisateur
        </CardTitle>
        <CardDescription>
          Votre parcours sur les 30 derniers jours
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="text-center p-2 rounded-lg bg-primary/10">
            <p className="text-lg font-bold text-primary">{stats.aiAcceptanceRate}%</p>
            <p className="text-[10px] text-muted-foreground">IA acceptée</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-warning/10">
            <p className="text-lg font-bold text-warning">{stats.habitsLocked}</p>
            <p className="text-[10px] text-muted-foreground">Hab. verrouillées</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-accent/10">
            <p className="text-lg font-bold text-accent">{stats.financeImports}</p>
            <p className="text-[10px] text-muted-foreground">Imports</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative space-y-4">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          
          {groupedEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucun événement récent</p>
              <p className="text-sm">Vos actions seront tracées ici</p>
            </div>
          ) : (
            groupedEvents.map(([date, dayEvents]) => (
              <div key={date} className="relative pl-10">
                {/* Date marker */}
                <div className="absolute left-0 w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center z-10">
                  <span className="text-xs font-bold">
                    {format(parseISO(date), 'd', { locale: fr })}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">
                    {format(parseISO(date), 'EEEE d MMMM', { locale: fr })}
                  </p>
                  
                  {dayEvents.slice(0, 3).map((event, i) => {
                    const config = EVENT_CONFIG[event.event_type] || {
                      icon: <Zap className="h-4 w-4" />,
                      color: 'bg-muted',
                      label: event.event_type,
                    };
                    
                    return (
                      <div 
                        key={event.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className={cn('p-1.5 rounded-full text-white', config.color)}>
                          {config.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{config.label}</p>
                          {event.entity && (
                            <p className="text-xs text-muted-foreground truncate">
                              {event.entity}
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {format(parseISO(event.created_at), 'HH:mm')}
                        </span>
                      </div>
                    );
                  })}
                  
                  {dayEvents.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{dayEvents.length - 3} autres
                    </Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
