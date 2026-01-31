import { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';

import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useCalendarEvents, useCreateCalendarEvent, useDeleteCalendarEvent } from '@/hooks/useCalendar';

import { useHabitsWithLogs } from '@/hooks/useHabits';
import { useTasks } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';
import { ScoreRing } from '@/components/today/ScoreRing';
import { cn } from '@/lib/utils';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Clock,
  MapPin,
  Trash2,
  Loader2,
  Zap,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  Brain,
  Battery,
  BatteryLow,
  BatteryMedium,
  Target
} from 'lucide-react';

// Energy levels for overlay
const getEnergyForHour = (hour: number): 'high' | 'medium' | 'low' => {
  if (hour >= 9 && hour <= 11) return 'high';
  if (hour >= 14 && hour <= 15) return 'low';
  if (hour >= 16 && hour <= 18) return 'medium';
  return 'medium';
};

const energyColors = {
  high: 'bg-success/20 border-success/30',
  medium: 'bg-warning/20 border-warning/30',
  low: 'bg-destructive/20 border-destructive/30'
};

const energyIcons = {
  high: Battery,
  medium: BatteryMedium,
  low: BatteryLow
};

export default function CalendarPage() {
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    location: '',
    start_time: '',
    end_time: '',
    all_day: false,
  });

  // Behavioral data for overlay
  const { data: habits = [] } = useHabitsWithLogs();
  const { data: tasks = [] } = useTasks();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { locale: fr });
  const calendarEnd = endOfWeek(monthEnd, { locale: fr });

  const { data: events = [], isLoading } = useCalendarEvents(
    calendarStart.toISOString(),
    calendarEnd.toISOString()
  );
  const createEvent = useCreateCalendarEvent();
  const deleteEvent = useDeleteCalendarEvent();

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Calculate daily scores (mock based on habits)
  const getDailyScore = (day: Date) => {
    // In a real app, this would come from daily_stats
    const baseScore = 50 + Math.floor(Math.random() * 40);
    return isToday(day) ? baseScore : Math.min(100, baseScore + Math.floor(Math.random() * 20));
  };

  // Calculate overload for a day
  const getDayOverload = (day: Date) => {
    const dayEvents = events.filter(event => isSameDay(new Date(event.start_time), day));
    const tasksDue = tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), day));
    
    const totalItems = dayEvents.length + tasksDue.length;
    if (totalItems > 6) return 'high';
    if (totalItems > 3) return 'medium';
    return 'low';
  };

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_time);
      return isSameDay(eventDate, day);
    });
  };

  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.start_time) return;

    createEvent.mutate({
      title: newEvent.title,
      description: newEvent.description || null,
      location: newEvent.location || null,
      start_time: new Date(newEvent.start_time).toISOString(),
      end_time: newEvent.end_time ? new Date(newEvent.end_time).toISOString() : new Date(newEvent.start_time).toISOString(),
      all_day: newEvent.all_day,
    }, {
      onSuccess: () => {
        setNewEvent({ title: '', description: '', location: '', start_time: '', end_time: '', all_day: false });
        setIsDialogOpen(false);
      },
    });
  };

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];
  const selectedDayTasks = selectedDate ? tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), selectedDate)) : [];

  // AI Suggestions based on calendar
  const aiSuggestions = useMemo(() => {
    if (!selectedDate) return [];
    
    const suggestions: { type: 'warning' | 'tip' | 'insight'; message: string }[] = [];
    const dayOverload = getDayOverload(selectedDate);
    const dayEvents = getEventsForDay(selectedDate);
    
    if (dayOverload === 'high') {
      suggestions.push({
        type: 'warning',
        message: 'Journée chargée détectée. Considérez de déléguer ou reporter certaines tâches.'
      });
    }
    
    if (dayEvents.length === 0 && isToday(selectedDate)) {
      suggestions.push({
        type: 'tip',
        message: 'Aucun événement prévu. Parfait pour du Deep Work !'
      });
    }

    const morningEvents = dayEvents.filter(e => {
      const hour = new Date(e.start_time).getHours();
      return hour >= 9 && hour <= 11;
    });

    if (morningEvents.length > 2) {
      suggestions.push({
        type: 'insight',
        message: 'Vos heures de haute énergie sont occupées. Protégez ce temps pour les tâches importantes.'
      });
    }

    return suggestions;
  }, [selectedDate, events, tasks]);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gradient">
              Calendrier Comportemental
            </h1>
            <p className="text-muted-foreground mt-1">
              Overlay d'énergie et discipline
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Overlay Toggle */}
            <Button 
              variant={showOverlay ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowOverlay(!showOverlay)}
              className="gap-2"
            >
              <Brain className="h-4 w-4" />
              {showOverlay ? 'Overlay ON' : 'Overlay OFF'}
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 gradient-primary">
                  <Plus className="w-4 h-4" />
                  Événement
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-strong">
                <DialogHeader>
                  <DialogTitle>Créer un événement</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Titre</Label>
                    <Input
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      placeholder="Réunion d'équipe"
                      className="glass-hover"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Début</Label>
                      <Input
                        type="datetime-local"
                        value={newEvent.start_time}
                        onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                        className="glass-hover"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fin</Label>
                      <Input
                        type="datetime-local"
                        value={newEvent.end_time}
                        onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                        className="glass-hover"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Lieu</Label>
                    <Input
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                      placeholder="Bureau, Zoom, etc."
                      className="glass-hover"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      placeholder="Notes..."
                      className="glass-hover"
                    />
                  </div>
                  <Button onClick={handleCreateEvent} className="w-full gradient-primary" disabled={createEvent.isPending}>
                    {createEvent.isPending ? 'Création...' : 'Créer'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Energy Legend */}
        {showOverlay && (
          <Card className="glass">
            <CardContent className="py-3">
              <div className="flex items-center justify-center gap-6 text-sm">
                <span className="text-muted-foreground">Overlay Énergie :</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <span>Haute énergie</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  <span>Énergie moyenne</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <span>Basse énergie</span>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span>Surcharge</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <Card className="lg:col-span-2 glass-strong">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  {format(currentMonth, 'MMMM yyyy', { locale: fr })}
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
                    Aujourd'hui
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Days header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                  const dayEvents = getEventsForDay(day);
                  const dayScore = getDailyScore(day);
                  const overload = getDayOverload(day);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const dayIsToday = isToday(day);

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "aspect-square p-1 rounded-xl transition-all text-sm relative group",
                        isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/30',
                        dayIsToday && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                        isSelected && !dayIsToday && 'bg-primary/10 ring-2 ring-primary/50',
                        !dayIsToday && !isSelected && 'hover:bg-accent',
                        showOverlay && overload === 'high' && isCurrentMonth && 'bg-destructive/10',
                        showOverlay && overload === 'medium' && isCurrentMonth && 'bg-warning/5'
                      )}
                    >
                      <div className="flex flex-col items-center h-full">
                        <span className={cn(
                          "font-medium",
                          dayIsToday && "text-primary"
                        )}>
                          {format(day, 'd')}
                        </span>
                        
                        {/* Score indicator */}
                        {showOverlay && isCurrentMonth && (
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full mt-0.5",
                            dayScore >= 70 ? 'bg-success' : dayScore >= 40 ? 'bg-warning' : 'bg-destructive/50'
                          )} />
                        )}
                        
                        {/* Events dots */}
                        {dayEvents.length > 0 && (
                          <div className="flex gap-0.5 mt-auto">
                            {dayEvents.slice(0, 3).map((_, i) => (
                              <div key={i} className="w-1 h-1 rounded-full bg-primary" />
                            ))}
                            {dayEvents.length > 3 && (
                              <span className="text-[8px] text-muted-foreground">+{dayEvents.length - 3}</span>
                            )}
                          </div>
                        )}

                        {/* Overload warning */}
                        {showOverlay && overload === 'high' && isCurrentMonth && (
                          <AlertTriangle className="w-3 h-3 text-warning absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selected Day Panel */}
          <div className="space-y-4">
            {/* Day Score */}
            {selectedDate && showOverlay && (
              <Card className="glass-strong">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <ScoreRing 
                      value={getDailyScore(selectedDate)} 
                      size="sm" 
                      label="Discipline"
                    />
                    <div>
                      <p className="font-medium">
                        {format(selectedDate, 'EEEE d MMMM', { locale: fr })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedDayEvents.length} événement{selectedDayEvents.length > 1 ? 's' : ''} • 
                        {selectedDayTasks.length} tâche{selectedDayTasks.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Suggestions */}
            {showOverlay && aiSuggestions.length > 0 && (
              <Card className="glass border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Suggestions IA
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {aiSuggestions.map((suggestion, i) => (
                    <div 
                      key={i}
                      className={cn(
                        "p-3 rounded-lg text-sm",
                        suggestion.type === 'warning' && 'bg-warning/10 text-warning',
                        suggestion.type === 'tip' && 'bg-success/10 text-success',
                        suggestion.type === 'insight' && 'bg-primary/10 text-primary'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {suggestion.type === 'warning' && <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />}
                        {suggestion.type === 'tip' && <Zap className="h-4 w-4 mt-0.5 shrink-0" />}
                        {suggestion.type === 'insight' && <Brain className="h-4 w-4 mt-0.5 shrink-0" />}
                        <span>{suggestion.message}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Events */}
            <Card className="glass-strong">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {selectedDate 
                    ? format(selectedDate, 'EEEE d MMMM', { locale: fr })
                    : "Sélectionnez un jour"
                  }
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Chargement...
                  </div>
                ) : selectedDayEvents.length === 0 && selectedDayTasks.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    Aucun événement ce jour
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDayEvents.map((event) => {
                      const hour = new Date(event.start_time).getHours();
                      const energy = getEnergyForHour(hour);
                      const EnergyIcon = energyIcons[energy];

                      return (
                        <div
                          key={event.id}
                          className={cn(
                            "p-3 rounded-lg border space-y-2",
                            showOverlay ? energyColors[energy] : "bg-accent/50 border-border/50"
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{event.title}</h4>
                              {(event as any).provider === 'google' && (
                                <Badge variant="outline" className="text-xs">Google</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {showOverlay && <EnergyIcon className="h-4 w-4 text-muted-foreground" />}
                              {(event as any).provider !== 'google' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive"
                                  onClick={() => deleteEvent.mutate(event.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                          {!event.all_day && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {format(new Date(event.start_time), 'HH:mm')}
                              {event.end_time && ` - ${format(new Date(event.end_time), 'HH:mm')}`}
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Tasks due */}
                    {selectedDayTasks.length > 0 && (
                      <>
                        <div className="border-t border-border/50 pt-3 mt-3">
                          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            Tâches dues
                          </p>
                          {selectedDayTasks.map(task => (
                            <div key={task.id} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                task.priority === 'high' ? 'bg-destructive' :
                                task.priority === 'medium' ? 'bg-warning' : 'bg-success'
                              )} />
                              <span className="text-sm truncate">{task.title}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
