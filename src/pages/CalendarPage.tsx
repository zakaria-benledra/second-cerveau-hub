import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useCalendarEvents, useCreateCalendarEvent, useDeleteCalendarEvent } from '@/hooks/useCalendar';
import { useGoogleConnectionStatus, useConnectGoogle, useDisconnectGoogle, useSyncGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useToast } from '@/hooks/use-toast';
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, MapPin, Trash2, RefreshCw, Link2, Unlink, Loader2 } from 'lucide-react';

export default function CalendarPage() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    location: '',
    start_time: '',
    end_time: '',
    all_day: false,
  });

  // Google Calendar integration
  const { data: googleStatus, isLoading: isLoadingGoogle } = useGoogleConnectionStatus();
  const connectGoogle = useConnectGoogle();
  const disconnectGoogle = useDisconnectGoogle();
  const syncGoogle = useSyncGoogleCalendar();

  // Show toast on successful connection
  useEffect(() => {
    if (searchParams.get('connected') === 'google') {
      toast({
        title: 'Google Calendar connecté !',
        description: 'Vos événements seront synchronisés automatiquement.',
      });
      // Clean URL
      window.history.replaceState({}, '', '/calendar');
    }
  }, [searchParams, toast]);

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

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Calendrier
            </h1>
            <p className="text-muted-foreground mt-1">
              Gérez vos événements et rendez-vous
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Google Calendar Integration */}
            {isLoadingGoogle ? (
              <Button variant="outline" disabled>
                <Loader2 className="w-4 h-4 animate-spin" />
              </Button>
            ) : googleStatus?.connected ? (
              <>
                <Badge variant="secondary" className="gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Google connecté
                </Badge>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => syncGoogle.mutate()}
                  disabled={syncGoogle.isPending}
                  title="Synchroniser"
                >
                  <RefreshCw className={`w-4 h-4 ${syncGoogle.isPending ? 'animate-spin' : ''}`} />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => disconnectGoogle.mutate()}
                  disabled={disconnectGoogle.isPending}
                  title="Déconnecter"
                >
                  <Unlink className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => connectGoogle.mutate()}
                disabled={connectGoogle.isPending}
                className="gap-2"
              >
                <Link2 className="w-4 h-4" />
                Connecter Google
              </Button>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nouvel événement
                </Button>
              </DialogTrigger>
              <DialogContent>
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
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Début</Label>
                    <Input
                      type="datetime-local"
                      value={newEvent.start_time}
                      onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fin</Label>
                    <Input
                      type="datetime-local"
                      value={newEvent.end_time}
                      onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Lieu</Label>
                  <Input
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    placeholder="Bureau, Zoom, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Notes..."
                  />
                </div>
                <Button onClick={handleCreateEvent} className="w-full" disabled={createEvent.isPending}>
                  {createEvent.isPending ? 'Création...' : 'Créer'}
                </Button>
              </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <Card className="lg:col-span-2 glass-card">
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
                  const isToday = isSameDay(day, new Date());
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        aspect-square p-1 rounded-lg transition-all text-sm
                        ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/50'}
                        ${isToday ? 'bg-primary text-primary-foreground font-bold' : ''}
                        ${isSelected && !isToday ? 'bg-accent ring-2 ring-primary' : ''}
                        ${!isToday && !isSelected ? 'hover:bg-accent' : ''}
                      `}
                    >
                      <div className="flex flex-col items-center">
                        <span>{format(day, 'd')}</span>
                        {dayEvents.length > 0 && (
                          <div className="flex gap-0.5 mt-1">
                            {dayEvents.slice(0, 3).map((_, i) => (
                              <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary" />
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selected Day Events */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedDate 
                  ? format(selectedDate, 'EEEE d MMMM', { locale: fr })
                  : "Sélectionnez un jour"
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center text-muted-foreground py-8">Chargement...</div>
              ) : selectedDayEvents.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Aucun événement ce jour
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 rounded-lg bg-accent/50 border border-border/50 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{event.title}</h4>
                          {(event as any).provider === 'google' && (
                            <Badge variant="outline" className="text-xs">Google</Badge>
                          )}
                        </div>
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
                      {event.all_day && (
                        <Badge variant="secondary" className="text-xs">
                          Toute la journée
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
