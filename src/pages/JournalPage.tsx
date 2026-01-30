import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTodayJournalEntry, useSaveJournalEntry, useNotes, useCreateNote, useDeleteNote, useJournalEntries } from '@/hooks/useJournal';
import { useJournalAI, journalDomains, moodToScore } from '@/hooks/useJournalAI';
import { GlobalTimeFilter, useTimeRangeDates, type TimeRange } from '@/components/filters/GlobalTimeFilter';
import { BookHeart, Sparkles, Smile, Meh, Frown, Battery, BatteryMedium, BatteryLow, Plus, Trash2, FileText, Brain, Lightbulb, Clock, Filter } from 'lucide-react';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function JournalPage() {
  const { data: todayEntry, isLoading: loadingEntry } = useTodayJournalEntry();
  const { data: allEntries = [], isLoading: loadingEntries } = useJournalEntries();
  const { data: notes = [], isLoading: loadingNotes } = useNotes();
  const saveJournal = useSaveJournalEntry();
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const journalAI = useJournalAI();

  const [mood, setMood] = useState(todayEntry?.mood || '');
  const [energy, setEnergy] = useState(todayEntry?.energy_level || '');
  const [domain, setDomain] = useState<string>('');
  const [gratitude, setGratitude] = useState<string[]>(todayEntry?.gratitude || ['', '', '']);
  const [reflections, setReflections] = useState(todayEntry?.reflections || '');
  const [wins, setWins] = useState<string[]>(todayEntry?.wins || ['']);
  const [challenges, setChallenges] = useState<string[]>(todayEntry?.challenges || ['']);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const [newNote, setNewNote] = useState({ title: '', content: '' });
  
  // Timeline filters
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [moodFilter, setMoodFilter] = useState<string>('all');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const { startDate, endDate } = useTimeRangeDates(timeRange);

  // Update form when data loads
  useEffect(() => {
    if (todayEntry) {
      setMood(todayEntry.mood || '');
      setEnergy(todayEntry.energy_level || '');
      setGratitude(todayEntry.gratitude || ['', '', '']);
      setReflections(todayEntry.reflections || '');
      setWins(todayEntry.wins || ['']);
      setChallenges(todayEntry.challenges || ['']);
    }
  }, [todayEntry]);

  const handleSave = () => {
    saveJournal.mutate({
      mood,
      energy_level: energy,
      gratitude: gratitude.filter(g => g.trim()),
      reflections,
      wins: wins.filter(w => w.trim()),
      challenges: challenges.filter(c => c.trim()),
    });
  };

  const handleGetAISuggestions = async () => {
    const suggestions = await journalAI.getSuggestions({
      domain,
      moodScore: moodToScore(mood),
      content: reflections
    });
    setAiSuggestions(suggestions);
  };

  const handleUseSuggestion = (suggestion: string) => {
    setReflections(prev => prev ? `${prev}\n\n${suggestion}` : suggestion);
  };

  const handleAddNote = () => {
    if (!newNote.content) return;
    createNote.mutate({
      title: newNote.title || null,
      content: newNote.content,
    }, {
      onSuccess: () => setNewNote({ title: '', content: '' })
    });
  };

  // Filter entries for timeline
  const filteredEntries = allEntries.filter(entry => {
    const entryDate = entry.date;
    const inDateRange = entryDate >= startDate && entryDate <= endDate;
    const matchesMood = moodFilter === 'all' || entry.mood === moodFilter;
    return inDateRange && matchesMood;
  });

  const moodOptions = [
    { value: 'great', label: 'Super', icon: Smile, color: 'text-success' },
    { value: 'good', label: 'Bien', icon: Smile, color: 'text-info' },
    { value: 'okay', label: 'Moyen', icon: Meh, color: 'text-warning' },
    { value: 'bad', label: 'Difficile', icon: Frown, color: 'text-destructive' },
  ];

  const energyOptions = [
    { value: 'high', label: 'Élevée', icon: Battery, color: 'text-success' },
    { value: 'medium', label: 'Moyenne', icon: BatteryMedium, color: 'text-warning' },
    { value: 'low', label: 'Basse', icon: BatteryLow, color: 'text-destructive' },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Journal Intelligent</h1>
            <p className="text-muted-foreground">{format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}</p>
          </div>
        </div>

        <Tabs defaultValue="today" className="space-y-4">
          <TabsList className="glass">
            <TabsTrigger value="today" className="flex items-center gap-2">
              <BookHeart className="h-4 w-4" />
              Aujourd'hui
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-6">
            {/* Mood, Energy & Domain */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="glass">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-5 w-5" />
                    Humeur
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {moodOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant={mood === option.value ? 'default' : 'outline'}
                        className="flex-col h-auto py-3"
                        onClick={() => setMood(option.value)}
                      >
                        <option.icon className={`h-5 w-5 ${mood === option.value ? '' : option.color}`} />
                        <span className="mt-1 text-xs">{option.label}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Battery className="h-5 w-5" />
                    Énergie
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    {energyOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant={energy === option.value ? 'default' : 'outline'}
                        className="flex-1 flex-col h-auto py-3"
                        onClick={() => setEnergy(option.value)}
                      >
                        <option.icon className={`h-5 w-5 ${energy === option.value ? '' : option.color}`} />
                        <span className="mt-1 text-xs">{option.label}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Brain className="h-5 w-5" />
                    Domaine
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={domain} onValueChange={setDomain}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un domaine" />
                    </SelectTrigger>
                    <SelectContent>
                      {journalDomains.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.icon} {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>

            {/* AI Suggestions */}
            <Card className="glass border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    Assistant IA
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleGetAISuggestions}
                    disabled={journalAI.isGettingSuggestions}
                  >
                    {journalAI.isGettingSuggestions ? 'Réflexion...' : 'Obtenir des suggestions'}
                  </Button>
                </div>
                <CardDescription>
                  Des questions pour guider ta réflexion
                </CardDescription>
              </CardHeader>
              {aiSuggestions.length > 0 && (
                <CardContent className="space-y-2">
                  {aiSuggestions.map((suggestion, idx) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-lg bg-primary/5 border border-primary/10 flex items-start justify-between gap-2"
                    >
                      <p className="text-sm">{suggestion}</p>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleUseSuggestion(suggestion)}
                      >
                        Utiliser
                      </Button>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>

            {/* Gratitude */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>🙏 Gratitudes</CardTitle>
                <CardDescription>3 choses pour lesquelles tu es reconnaissant(e)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {gratitude.map((item, index) => (
                  <Input
                    key={index}
                    value={item}
                    onChange={(e) => {
                      const updated = [...gratitude];
                      updated[index] = e.target.value;
                      setGratitude(updated);
                    }}
                    placeholder={`Gratitude ${index + 1}...`}
                  />
                ))}
              </CardContent>
            </Card>

            {/* Wins & Challenges */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="glass">
                <CardHeader>
                  <CardTitle>🏆 Victoires</CardTitle>
                  <CardDescription>Ce qui s'est bien passé</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {wins.map((item, index) => (
                    <Input
                      key={index}
                      value={item}
                      onChange={(e) => {
                        const updated = [...wins];
                        updated[index] = e.target.value;
                        setWins(updated);
                      }}
                      placeholder="Une victoire..."
                    />
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setWins([...wins, ''])}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle>💪 Défis</CardTitle>
                  <CardDescription>Obstacles rencontrés</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {challenges.map((item, index) => (
                    <Input
                      key={index}
                      value={item}
                      onChange={(e) => {
                        const updated = [...challenges];
                        updated[index] = e.target.value;
                        setChallenges(updated);
                      }}
                      placeholder="Un défi..."
                    />
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setChallenges([...challenges, ''])}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Reflections */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>✍️ Réflexions</CardTitle>
                <CardDescription>Pensées, idées, observations...</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={reflections}
                  onChange={(e) => setReflections(e.target.value)}
                  placeholder="Écris librement..."
                  className="min-h-32"
                />
              </CardContent>
            </Card>

            <Button onClick={handleSave} className="w-full" disabled={saveJournal.isPending}>
              {saveJournal.isPending ? 'Sauvegarde...' : 'Sauvegarder le journal'}
            </Button>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            {/* Filters */}
            <Card className="glass">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filtres:</span>
                  </div>
                  <GlobalTimeFilter value={timeRange} onChange={setTimeRange} className="w-32" />
                  <Select value={moodFilter} onValueChange={setMoodFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Humeur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      {moodOptions.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            {loadingEntries ? (
              <div className="text-center py-8 text-muted-foreground">Chargement...</div>
            ) : filteredEntries.length === 0 ? (
              <Card className="glass border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucune entrée dans cette période</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredEntries.map((entry) => {
                  const moodOption = moodOptions.find(m => m.value === entry.mood);
                  const MoodIcon = moodOption?.icon || Meh;
                  
                  return (
                    <Card key={entry.id} className="glass hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            entry.mood === 'great' ? 'bg-success/20' :
                            entry.mood === 'good' ? 'bg-info/20' :
                            entry.mood === 'okay' ? 'bg-warning/20' :
                            'bg-destructive/20'
                          }`}>
                            <MoodIcon className={`h-5 w-5 ${moodOption?.color || ''}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">
                                {format(parseISO(entry.date), 'EEEE d MMMM', { locale: fr })}
                              </span>
                              {entry.energy_level && (
                                <Badge variant="outline" className="text-xs capitalize">
                                  {entry.energy_level}
                                </Badge>
                              )}
                            </div>
                            {entry.reflections && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {entry.reflections}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {entry.wins?.slice(0, 2).map((w, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">🏆 {w}</Badge>
                              ))}
                              {entry.gratitude?.slice(0, 1).map((g, i) => (
                                <Badge key={i} variant="outline" className="text-xs">🙏 {g}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Nouvelle note</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  placeholder="Titre (optionnel)"
                />
                <Textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  placeholder="Contenu de la note..."
                  className="min-h-24"
                />
                <Button onClick={handleAddNote} disabled={createNote.isPending || !newNote.content}>
                  {createNote.isPending ? 'Ajout...' : 'Ajouter la note'}
                </Button>
              </CardContent>
            </Card>

            {loadingNotes ? (
              <div className="text-center py-8 text-muted-foreground">Chargement...</div>
            ) : notes.length === 0 ? (
              <Card className="glass border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucune note</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {notes.map((note) => (
                  <Card key={note.id} className="glass group">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{note.title || 'Sans titre'}</CardTitle>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100 text-destructive h-8 w-8"
                          onClick={() => deleteNote.mutate(note.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <CardDescription>
                        {format(new Date(note.created_at), 'd MMM yyyy', { locale: fr })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-4">{note.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
