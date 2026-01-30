import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTodayJournalEntry, useSaveJournalEntry, useNotes, useCreateNote, useDeleteNote } from '@/hooks/useJournal';
import { BookHeart, Sparkles, Smile, Meh, Frown, Battery, BatteryMedium, BatteryLow, Plus, Trash2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function JournalPage() {
  const { data: todayEntry, isLoading: loadingEntry } = useTodayJournalEntry();
  const { data: notes = [], isLoading: loadingNotes } = useNotes();
  const saveJournal = useSaveJournalEntry();
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();

  const [mood, setMood] = useState(todayEntry?.mood || '');
  const [energy, setEnergy] = useState(todayEntry?.energy_level || '');
  const [gratitude, setGratitude] = useState<string[]>(todayEntry?.gratitude || ['', '', '']);
  const [reflections, setReflections] = useState(todayEntry?.reflections || '');
  const [wins, setWins] = useState<string[]>(todayEntry?.wins || ['']);
  const [challenges, setChallenges] = useState<string[]>(todayEntry?.challenges || ['']);

  const [newNote, setNewNote] = useState({ title: '', content: '' });

  // Update form when data loads
  useState(() => {
    if (todayEntry) {
      setMood(todayEntry.mood || '');
      setEnergy(todayEntry.energy_level || '');
      setGratitude(todayEntry.gratitude || ['', '', '']);
      setReflections(todayEntry.reflections || '');
      setWins(todayEntry.wins || ['']);
      setChallenges(todayEntry.challenges || ['']);
    }
  });

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

  const handleAddNote = () => {
    if (!newNote.content) return;
    createNote.mutate({
      title: newNote.title || null,
      content: newNote.content,
    }, {
      onSuccess: () => setNewNote({ title: '', content: '' })
    });
  };

  const moodOptions = [
    { value: 'great', label: 'Super', icon: Smile, color: 'text-green-500' },
    { value: 'good', label: 'Bien', icon: Smile, color: 'text-blue-500' },
    { value: 'okay', label: 'Moyen', icon: Meh, color: 'text-yellow-500' },
    { value: 'bad', label: 'Difficile', icon: Frown, color: 'text-red-500' },
  ];

  const energyOptions = [
    { value: 'high', label: 'Élevée', icon: Battery, color: 'text-green-500' },
    { value: 'medium', label: 'Moyenne', icon: BatteryMedium, color: 'text-yellow-500' },
    { value: 'low', label: 'Basse', icon: BatteryLow, color: 'text-red-500' },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Journal</h1>
            <p className="text-muted-foreground">{format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}</p>
          </div>
        </div>

        <Tabs defaultValue="today" className="space-y-4">
          <TabsList className="glass">
            <TabsTrigger value="today" className="flex items-center gap-2">
              <BookHeart className="h-4 w-4" />
              Aujourd'hui
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-6">
            {/* Mood & Energy */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Comment vous sentez-vous ?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    {moodOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant={mood === option.value ? 'default' : 'outline'}
                        className="flex-1 flex-col h-auto py-4"
                        onClick={() => setMood(option.value)}
                      >
                        <option.icon className={`h-6 w-6 ${mood === option.value ? '' : option.color}`} />
                        <span className="mt-1 text-xs">{option.label}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Battery className="h-5 w-5" />
                    Niveau d'énergie
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    {energyOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant={energy === option.value ? 'default' : 'outline'}
                        className="flex-1 flex-col h-auto py-4"
                        onClick={() => setEnergy(option.value)}
                      >
                        <option.icon className={`h-6 w-6 ${energy === option.value ? '' : option.color}`} />
                        <span className="mt-1 text-xs">{option.label}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gratitude */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>🙏 Gratitudes</CardTitle>
                <CardDescription>3 choses pour lesquelles vous êtes reconnaissant(e)</CardDescription>
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
                  placeholder="Écrivez librement..."
                  className="min-h-32"
                />
              </CardContent>
            </Card>

            <Button onClick={handleSave} className="w-full" disabled={saveJournal.isPending}>
              {saveJournal.isPending ? 'Sauvegarde...' : 'Sauvegarder le journal'}
            </Button>
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
