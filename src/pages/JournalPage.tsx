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
import { JournalInsightsTab } from '@/components/journal/JournalInsightsTab';
import { JournalEvolutionTab } from '@/components/journal/JournalEvolutionTab';
import { 
  BookHeart, Sparkles, Smile, Meh, Frown, Battery, BatteryMedium, BatteryLow, 
  Plus, Trash2, FileText, Brain, Lightbulb, Clock, Filter, Search, 
  LayoutTemplate, RefreshCw, MessageSquare, Activity, Heart
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Reflection structure templates
const REFLECTION_TEMPLATES = [
  {
    id: 'situation-emotion-learning',
    label: 'Situation → Émotion → Apprentissage',
    template: `**Situation:**
[Décrivez ce qui s'est passé]

**Émotion ressentie:**
[Comment vous êtes-vous senti(e)?]

**Apprentissage:**
[Qu'avez-vous appris de cette expérience?]`
  },
  {
    id: 'what-went-well',
    label: 'Ce qui a bien fonctionné',
    template: `**Ce qui a bien fonctionné aujourd'hui:**
- 

**Pourquoi cela a fonctionné:**


**Comment reproduire ce succès:**
`
  },
  {
    id: 'obstacle-strategy',
    label: 'Obstacle → Stratégie',
    template: `**Obstacle rencontré:**
[Décrivez le défi]

**Impact sur moi:**
[Comment cela m'a affecté]

**Stratégie pour la prochaine fois:**
[Ce que je ferai différemment]`
  }
];

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
  const [reflections, setReflections] = useState(todayEntry?.reflections || '');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

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
      setReflections(todayEntry.reflections || '');
    }
  }, [todayEntry]);

  const handleSave = () => {
    saveJournal.mutate({
      mood,
      energy_level: energy,
      reflections,
      // Note: gratitude, wins, challenges removed - now in Habits behavioral section
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

  const handleApplyTemplate = (template: string) => {
    setReflections(prev => prev ? `${prev}\n\n${template}` : template);
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
    const matchesSearch = !searchQuery || 
      (entry.reflections?.toLowerCase().includes(searchQuery.toLowerCase()));
    return inDateRange && matchesMood && matchesSearch;
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
          <Badge variant="outline" className="text-xs">
            <MessageSquare className="h-3 w-3 mr-1" />
            Réflexions uniquement
          </Badge>
        </div>

        <Tabs defaultValue="today" className="space-y-4">
          <TabsList className="glass flex-wrap">
            <TabsTrigger value="today" className="flex items-center gap-2">
              <BookHeart className="h-4 w-4" />
              Aujourd'hui
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Insights IA
            </TabsTrigger>
            <TabsTrigger value="evolution" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Évolution
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

          {/* Insights Tab */}
          <TabsContent value="insights">
            <JournalInsightsTab />
          </TabsContent>

          {/* Evolution Tab */}
          <TabsContent value="evolution">
            <JournalEvolutionTab />
          </TabsContent>

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

            {/* Structure Templates */}
            <Card className="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <LayoutTemplate className="h-5 w-5 text-accent" />
                    Structurer mes pensées
                  </CardTitle>
                </div>
                <CardDescription>
                  Utilisez un modèle pour organiser votre réflexion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {REFLECTION_TEMPLATES.map((template) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyTemplate(template.template)}
                      className="text-xs"
                    >
                      {template.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

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
                    {journalAI.isGettingSuggestions ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Réflexion...
                      </>
                    ) : (
                      'Obtenir des suggestions'
                    )}
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

            {/* Reflections - Main writing area */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>✍️ Réflexions</CardTitle>
                <CardDescription>
                  Pensées, idées, observations... Le cœur de votre journal.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={reflections}
                  onChange={(e) => setReflections(e.target.value)}
                  placeholder="Écrivez librement vos pensées du jour..."
                  className="min-h-48 text-base leading-relaxed"
                />
              </CardContent>
            </Card>

            <Button onClick={handleSave} className="w-full" disabled={saveJournal.isPending}>
              {saveJournal.isPending ? 'Sauvegarde...' : 'Sauvegarder le journal'}
            </Button>

            {/* Info about behavioral section */}
            <Card className="glass-hover border-dashed">
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground text-center">
                  💡 <strong>Gratitudes, Victoires et Défis</strong> sont maintenant dans la section 
                  <a href="/habits" className="text-primary hover:underline ml-1">Habitudes → Comportement</a>
                </p>
              </CardContent>
            </Card>
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
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
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
                          <div className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center',
                            entry.mood === 'great' ? 'bg-success/20' :
                            entry.mood === 'good' ? 'bg-info/20' :
                            entry.mood === 'okay' ? 'bg-warning/20' :
                            'bg-destructive/20'
                          )}>
                            <MoodIcon className={`h-5 w-5 ${moodOption?.color || ''}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">
                                {format(parseISO(entry.date), 'EEEE d MMMM', { locale: fr })}
                              </span>
                              {entry.energy_level && (
                                <Badge variant="outline" className="text-xs">
                                  {entry.energy_level === 'high' ? '⚡ Haute' :
                                   entry.energy_level === 'medium' ? '🔋 Moyenne' : '🪫 Basse'}
                                </Badge>
                              )}
                            </div>
                            {entry.reflections && (
                              <p className="text-sm text-muted-foreground line-clamp-3 mt-2">
                                {entry.reflections}
                              </p>
                            )}
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
            {/* Quick Note */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Note rapide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Titre (optionnel)"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                />
                <Textarea
                  placeholder="Contenu de la note..."
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  className="min-h-20"
                />
                <Button 
                  onClick={handleAddNote} 
                  disabled={!newNote.content.trim() || createNote.isPending}
                  className="w-full"
                >
                  {createNote.isPending ? 'Ajout...' : 'Ajouter la note'}
                </Button>
              </CardContent>
            </Card>

            {/* Notes List */}
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
              <div className="grid gap-4 md:grid-cols-2">
                {notes.map((note) => (
                  <Card key={note.id} className="glass-hover">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {note.title && (
                            <h4 className="font-medium mb-1 truncate">{note.title}</h4>
                          )}
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {note.content}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(parseISO(note.created_at), 'd MMM yyyy', { locale: fr })}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteNote.mutate(note.id)}
                          disabled={deleteNote.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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
