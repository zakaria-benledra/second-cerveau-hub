import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { SageCompanion } from '@/components/sage';
import { useCelebration } from '@/hooks/useCelebration';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTodayJournalEntry, useSaveJournalEntry, useNotes, useCreateNote, useDeleteNote, useJournalEntries, useJournalEntryByDate } from '@/hooks/useJournal';
import { useJournalAI, journalDomains, moodToScore } from '@/hooks/useJournalAI';
import { GlobalTimeFilter, useTimeRangeDates, type TimeRange } from '@/components/filters/GlobalTimeFilter';
import { JournalInsightsTab } from '@/components/journal/JournalInsightsTab';
import { JournalEvolutionTab } from '@/components/journal/JournalEvolutionTab';
import { 
  BookHeart, Sparkles, Smile, Meh, Frown, Battery, BatteryMedium, BatteryLow, 
  Plus, Trash2, FileText, Brain, Lightbulb, Clock, Filter, Search, 
  LayoutTemplate, RefreshCw, Activity, Heart, BookOpen,
  CalendarIcon, ChevronLeft, ChevronRight, AlertCircle
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

export default function JournalPage() {
  const { data: todayEntry, isLoading: loadingEntry } = useTodayJournalEntry();
  const { data: allEntries = [], isLoading: loadingEntries } = useJournalEntries();
  const { data: notes = [], isLoading: loadingNotes } = useNotes();
  const saveJournal = useSaveJournalEntry();
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const journalAI = useJournalAI();
  const { celebrate } = useCelebration();

  // Date selection state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  const isToday = selectedDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
  const formattedSelectedDate = selectedDate.toISOString().split('T')[0];
  
  // Fetch entry for selected date (only when not today)
  const { data: entryForDate, isLoading: loadingEntryForDate } = useJournalEntryByDate(
    isToday ? null : formattedSelectedDate
  );
  
  // Current entry is today's or selected date's
  const currentEntry = isToday ? todayEntry : entryForDate;

  const [mood, setMood] = useState('');
  const [energy, setEnergy] = useState('');
  const [domain, setDomain] = useState<string>('');
  const [reflections, setReflections] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [newNote, setNewNote] = useState({ title: '', content: '' });
  
  // Timeline filters
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [moodFilter, setMoodFilter] = useState<string>('all');
  const { startDate, endDate } = useTimeRangeDates(timeRange);

  // Update form when data loads or date changes
  useEffect(() => {
    if (currentEntry) {
      setMood(currentEntry.mood || '');
      setEnergy(currentEntry.energy_level || '');
      setReflections(currentEntry.reflections || '');
    } else {
      // Reset for new entry
      setMood('');
      setEnergy('');
      setReflections('');
    }
    // Clear AI suggestions when date changes
    setAiSuggestions([]);
  }, [currentEntry, formattedSelectedDate]);

  // Dynamic templates based on context
  const dynamicTemplates = useMemo(() => {
    const templates = [];
    
    if (mood === 'bad' || mood === 'okay') {
      templates.push({
        id: 'processing-emotions',
        label: '💭 Traiter mes émotions',
        template: `**Ce que je ressens vraiment :**
[Exprime tes émotions sans filtre]

**D'où vient ce sentiment ?**
[Identifie la source]

**Ce dont j'ai besoin maintenant :**
[Sois honnête avec toi-même]`
      });
    }
    
    if (domain === 'travail') {
      templates.push({
        id: 'work-reflection',
        label: '💼 Réflexion travail',
        template: `**Accomplissement du jour :**
[Même petit, qu'as-tu accompli ?]

**Défi rencontré :**
[Qu'est-ce qui a été difficile ?]

**Prochaine action :**
[Une chose concrète pour demain]`
      });
    }
    
    if (domain === 'relation') {
      templates.push({
        id: 'relationship-reflection',
        label: '❤️ Réflexion relations',
        template: `**Interaction marquante :**
[Avec qui ? Que s'est-il passé ?]

**Ce que j'ai ressenti :**
[Sois précis sur tes émotions]

**Ce que j'aurais pu faire différemment :**
[Ou ce que j'ai bien fait]`
      });
    }
    
    if (!isToday) {
      templates.push({
        id: 'retrospective',
        label: '🔙 Rétrospective',
        template: `**Ce jour-là, je me souviens :**
[Qu'est-ce qui s'est passé ?]

**Avec le recul, je comprends :**
[Qu'est-ce que tu vois maintenant ?]

**Ce que j'en retiens :**
[Leçon ou insight]`
      });
    }
    
    return templates;
  }, [mood, domain, isToday]);

  const handleSave = () => {
    saveJournal.mutate({
      entry: {
        mood,
        energy_level: energy,
        reflections,
      },
      targetDate: isToday ? undefined : formattedSelectedDate,
    }, {
      onSuccess: () => celebrate('journal_entry')
    });
  };

  const handleGetAISuggestions = async () => {
    const suggestions = await journalAI.getSuggestions({
      domain: domain || undefined,
      moodScore: mood ? moodToScore(mood) : undefined,
      mood: mood || undefined,
      energy: energy || undefined,
      content: reflections || undefined,
      date: formattedSelectedDate,
      isBackfill: !isToday,
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

  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    if (newDate <= new Date()) {
      setSelectedDate(newDate);
    }
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

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <GlobalHeader
          variant="page"
          title="Ton journal"
          subtitle="Ton espace personnel"
          icon={<BookOpen className="h-5 w-5 text-white" />}
          showStreak={false}
        />

        {/* Sage Companion */}
        <SageCompanion
          context="journal"
          mood="supportive"
          variant="card"
          className="mb-6"
        />

        <Tabs defaultValue="today" className="space-y-4">
          <TabsList className="glass flex-wrap">
            <TabsTrigger value="today" className="flex items-center gap-2">
              <BookHeart className="h-4 w-4" />
              {isToday ? "Aujourd'hui" : format(selectedDate, 'd MMM', { locale: fr })}
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
            {/* Date Selector */}
            <Card className="glass">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handlePreviousDay}
                      disabled={loadingEntryForDate}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="min-w-[200px] justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {isToday ? "Aujourd'hui" : format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            if (date) {
                              setSelectedDate(date);
                              setIsDatePickerOpen(false);
                            }
                          }}
                          disabled={(date) => date > new Date()}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleNextDay}
                      disabled={loadingEntryForDate || isToday}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {!isToday && (
                    <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
                      Retour à aujourd'hui
                    </Button>
                  )}
                </div>
                
                {!isToday && (
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Tu rédiges une entrée pour le {format(selectedDate, 'd MMMM', { locale: fr })}
                      {currentEntry && " (une entrée existe déjà, elle sera mise à jour)"}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

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
              <CardContent className="space-y-4">
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
                
                {/* Dynamic templates based on context */}
                {dynamicTemplates.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">
                      Suggestions basées sur ton contexte :
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {dynamicTemplates.map((template) => (
                        <Button
                          key={template.id}
                          variant="secondary"
                          size="sm"
                          onClick={() => handleApplyTemplate(template.template)}
                          className="text-xs"
                        >
                          {template.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
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
                  Des questions adaptées à ton {mood && `humeur (${moodOptions.find(m => m.value === mood)?.label})`}
                  {mood && domain && ' et '}
                  {domain && `domaine (${journalDomains.find(d => d.value === domain)?.label})`}
                  {!mood && !domain && 'contexte'}
                </CardDescription>
              </CardHeader>
              
              {/* Context indicators before getting suggestions */}
              {(mood || energy || domain) && aiSuggestions.length === 0 && (
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {mood && (
                      <Badge variant="outline">
                        {moodOptions.find(m => m.value === mood)?.label}
                      </Badge>
                    )}
                    {energy && (
                      <Badge variant="outline">
                        {energy === 'high' ? '⚡' : energy === 'medium' ? '🔋' : '🪫'} Énergie {energyOptions.find(e => e.value === energy)?.label}
                      </Badge>
                    )}
                    {domain && (
                      <Badge variant="outline">
                        {journalDomains.find(d => d.value === domain)?.icon} {journalDomains.find(d => d.value === domain)?.label}
                      </Badge>
                    )}
                    {!isToday && (
                      <Badge variant="secondary">
                        📅 Rétrospective
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Les suggestions seront personnalisées selon ce contexte
                  </p>
                </CardContent>
              )}
              
              {aiSuggestions.length > 0 && (
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>{aiSuggestions.length} suggestions générées</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {aiSuggestions.map((suggestion, idx) => (
                      <div 
                        key={idx}
                        className="p-3 rounded-lg bg-primary/5 border border-primary/10 flex items-start justify-between gap-2 hover:bg-primary/10 transition-colors"
                      >
                        <p className="text-sm line-clamp-3">{suggestion}</p>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="shrink-0"
                          onClick={() => handleUseSuggestion(suggestion)}
                        >
                          Utiliser
                        </Button>
                      </div>
                    ))}
                  </div>
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
              {saveJournal.isPending ? 'Sauvegarde...' : `Sauvegarder ${!isToday ? `(${format(selectedDate, 'd MMM', { locale: fr })})` : 'le journal'}`}
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
                    <Card 
                      key={entry.id} 
                      className="glass hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        setSelectedDate(parseISO(entry.date));
                        const todayTab = document.querySelector('[data-state="inactive"][value="today"]') as HTMLElement;
                        if (todayTab) todayTab.click();
                      }}
                    >
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
