import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTodayJournalEntry, useSaveJournalEntry, useJournalEntries } from '@/hooks/useJournal';
import { useCelebration } from '@/hooks/useCelebration';
import { 
  BookHeart, Smile, Meh, Frown, Battery, BatteryMedium, BatteryLow,
  Save, Calendar, Sparkles, Loader2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const moodOptions = [
  { value: 'great', label: 'Super', icon: Smile, color: 'text-success bg-success/10 border-success/30' },
  { value: 'good', label: 'Bien', icon: Smile, color: 'text-info bg-info/10 border-info/30' },
  { value: 'okay', label: 'Moyen', icon: Meh, color: 'text-warning bg-warning/10 border-warning/30' },
  { value: 'bad', label: 'Difficile', icon: Frown, color: 'text-destructive bg-destructive/10 border-destructive/30' },
];

const energyOptions = [
  { value: 'high', label: 'Haute', icon: Battery, color: 'text-success' },
  { value: 'medium', label: 'Moyenne', icon: BatteryMedium, color: 'text-warning' },
  { value: 'low', label: 'Basse', icon: BatteryLow, color: 'text-destructive' },
];

export default function JournalPageSimplified() {
  const { data: todayEntry, isLoading } = useTodayJournalEntry();
  const { data: allEntries = [] } = useJournalEntries();
  const saveJournal = useSaveJournalEntry();
  const { celebrate } = useCelebration();

  const [mood, setMood] = useState('');
  const [energy, setEnergy] = useState('');
  const [content, setContent] = useState('');
  const [gratitudes, setGratitudes] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Sync with loaded data
  useEffect(() => {
    if (todayEntry) {
      setMood(todayEntry.mood || '');
      setEnergy(todayEntry.energy_level || '');
      setContent(todayEntry.reflections || '');
      setGratitudes(todayEntry.gratitude?.join('\n') || '');
    }
  }, [todayEntry]);

  const handleSave = async () => {
    const gratitudesList = gratitudes.split('\n').filter(g => g.trim());
    
    await saveJournal.mutateAsync({
      entry: {
        mood,
        energy_level: energy,
        reflections: content,
        gratitude: gratitudesList,
      }
    });
    
    setHasChanges(false);
    celebrate('habit_complete', 'Journal sauvegardé');
  };

  const recentEntries = allEntries.slice(0, 7);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <GlobalHeader
          title="Mon Journal"
          subtitle="Réflexions et gratitudes"
          icon={<BookHeart className="h-6 w-6 text-primary" />}
        />

        <div className="grid md:grid-cols-[1fr,300px] gap-6">
          {/* Colonne principale */}
          <div className="space-y-4">
            {/* Humeur & Énergie */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Comment te sens-tu ?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Humeur */}
                <div>
                  <p className="text-sm font-medium mb-2">Humeur</p>
                  <div className="flex flex-wrap gap-2">
                    {moodOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <Button
                          key={option.value}
                          variant={mood === option.value ? 'default' : 'outline'}
                          size="sm"
                          className={cn(mood === option.value && option.color)}
                          onClick={() => { setMood(option.value); setHasChanges(true); }}
                        >
                          <Icon className="h-4 w-4 mr-1" />
                          {option.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Énergie */}
                <div>
                  <p className="text-sm font-medium mb-2">Énergie</p>
                  <div className="flex flex-wrap gap-2">
                    {energyOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <Button
                          key={option.value}
                          variant={energy === option.value ? 'default' : 'outline'}
                          size="sm"
                          className={cn(energy === option.value && option.color)}
                          onClick={() => { setEnergy(option.value); setHasChanges(true); }}
                        >
                          <Icon className="h-4 w-4 mr-1" />
                          {option.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gratitudes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-warning" />
                  Gratitudes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="De quoi es-tu reconnaissant(e) aujourd'hui ?"
                  value={gratitudes}
                  onChange={(e) => { setGratitudes(e.target.value); setHasChanges(true); }}
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Une gratitude par ligne
                </p>
              </CardContent>
            </Card>

            {/* Réflexions libres */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Réflexions du jour</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Comment s'est passée ta journée ? Qu'as-tu appris ?"
                  value={content}
                  onChange={(e) => { setContent(e.target.value); setHasChanges(true); }}
                  rows={6}
                  className="resize-none"
                />
              </CardContent>
            </Card>

            {/* Bouton sauvegarder */}
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleSave}
              disabled={saveJournal.isPending || !hasChanges}
            >
              {saveJournal.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </>
              )}
            </Button>
          </div>

          {/* Colonne historique */}
          <div>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Historique
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {recentEntries.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Pas encore d'entrées
                      </p>
                    ) : (
                      recentEntries.map((entry) => {
                        const moodOption = moodOptions.find(m => m.value === entry.mood);
                        const MoodIcon = moodOption?.icon || Meh;
                        return (
                          <div 
                            key={entry.id}
                            className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground">
                                {format(parseISO(entry.date), 'd MMM', { locale: fr })}
                              </span>
                              <MoodIcon className={cn("h-4 w-4", moodOption?.color.split(' ')[0])} />
                            </div>
                            {entry.reflections && (
                              <p className="text-sm line-clamp-2">
                                {entry.reflections}
                              </p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
