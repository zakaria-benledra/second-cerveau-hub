import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Heart, Flame, Check, Loader2, Sparkles, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  useTodayGratitude, 
  useGratitudeHistory, 
  useGratitudeStreak, 
  useSaveGratitude 
} from '@/hooks/useGratitude';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export function GratitudeJournal() {
  const { data: todayEntry, isLoading: loadingToday } = useTodayGratitude();
  const { data: history, isLoading: loadingHistory } = useGratitudeHistory();
  const { data: streak } = useGratitudeStreak();
  const saveGratitude = useSaveGratitude();

  const [items, setItems] = useState<string[]>(['', '', '']);

  useEffect(() => {
    if (todayEntry?.items && todayEntry.items.length > 0) {
      const filled = [...todayEntry.items];
      while (filled.length < 3) filled.push('');
      setItems(filled);
    }
  }, [todayEntry?.id]);

  const handleSave = () => {
    saveGratitude.mutate(items);
  };

  const filledCount = items.filter(i => i.trim()).length;
  const isComplete = filledCount === 3;

  if (loadingToday) {
    return (
      <Card className="glass">
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="glass">
          <CardContent className="py-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-warning/15">
              <Flame className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{streak || 0}</p>
              <p className="text-xs text-muted-foreground">Jours consécutifs</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="py-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent/15">
              <Heart className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{history?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Entrées ce mois</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Card */}
      <Card className="glass-strong border-accent/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-accent/15">
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Gratitudes du jour
                  {isComplete && (
                    <Badge className="bg-success/20 text-success border-0">
                      <Check className="h-3 w-3 mr-1" />
                      Complété
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline">{filledCount}/3</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                item.trim() 
                  ? "bg-accent/20 text-accent" 
                  : "bg-muted text-muted-foreground"
              )}>
                {index + 1}
              </div>
              <Input
                value={item}
                onChange={(e) => {
                  const updated = [...items];
                  updated[index] = e.target.value;
                  setItems(updated);
                }}
                placeholder={`Gratitude ${index + 1}...`}
                className="glass-hover"
              />
            </div>
          ))}

          <Button
            onClick={handleSave}
            disabled={saveGratitude.isPending || filledCount === 0}
            className="w-full gradient-primary"
          >
            {saveGratitude.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Heart className="h-4 w-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* History */}
      <Card className="glass">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-muted">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Historique</CardTitle>
              <CardDescription>Vos gratitudes précédentes</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="py-8 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !history || history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aucune entrée pour le moment. Commencez aujourd'hui !
            </p>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {history
                  .filter(entry => entry.date !== format(new Date(), 'yyyy-MM-dd'))
                  .map((entry, idx) => (
                    <div key={entry.id}>
                      {idx > 0 && <Separator className="mb-4" />}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          {format(parseISO(entry.date), 'EEEE d MMMM', { locale: fr })}
                        </p>
                        <ul className="space-y-1">
                          {entry.items.map((item, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <Heart className="h-3 w-3 text-accent mt-1 flex-shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
