import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, Flame, Save, Sparkles, Calendar } from "lucide-react";
import { useGratitude } from "@/hooks/useGratitude";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export function GratitudeJournal() {
  const { entries, todayEntry, streak, isLoading, saveGratitude } = useGratitude();
  
  const [items, setItems] = useState<string[]>(["", "", ""]);
  const [hasChanges, setHasChanges] = useState(false);

  // Load today's entry if exists
  useEffect(() => {
    if (todayEntry) {
      const loadedItems = [...todayEntry.items];
      while (loadedItems.length < 3) loadedItems.push("");
      setItems(loadedItems.slice(0, 3));
      setHasChanges(false);
    }
  }, [todayEntry]);

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
    setHasChanges(true);
  };

  const handleSave = () => {
    saveGratitude.mutate(items, {
      onSuccess: () => setHasChanges(false),
    });
  };

  const filledCount = items.filter((i) => i.trim()).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="h-6 w-6 text-destructive" />
            Journal de Gratitude
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            3 choses pour lesquelles tu es reconnaissant aujourd'hui
          </p>
        </div>

        {streak > 0 && (
          <Badge variant="warning" className="gap-1 text-sm px-3 py-1">
            <Flame className="h-4 w-4" />
            {streak} jour{streak > 1 ? "s" : ""} consécutif{streak > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Today's Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Aujourd'hui
            <span className="text-sm font-normal text-muted-foreground ml-auto">
              {format(new Date(), "EEEE d MMMM", { locale: fr })}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="text-2xl">{["🙏", "✨", "💫"][index]}</span>
              <Input
                value={items[index]}
                onChange={(e) => handleItemChange(index, e.target.value)}
                placeholder={`Gratitude ${index + 1}...`}
                className="flex-1"
              />
            </div>
          ))}

          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">
              {filledCount}/3 gratitudes
            </span>
            <Button
              onClick={handleSave}
              disabled={filledCount === 0 || saveGratitude.isPending || !hasChanges}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {saveGratitude.isPending ? "..." : todayEntry ? "Mettre à jour" : "Enregistrer"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            Historique
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Heart className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>Aucune entrée de gratitude</p>
              <p className="text-sm">Commence aujourd'hui !</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {entries
                  .filter((e) => e.date !== format(new Date(), "yyyy-MM-dd"))
                  .map((entry) => (
                    <div
                      key={entry.id}
                      className="border-l-2 border-primary/30 pl-4 py-2"
                    >
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        {format(parseISO(entry.date), "EEEE d MMMM yyyy", {
                          locale: fr,
                        })}
                      </p>
                      <ul className="space-y-1">
                        {entry.items.map((item, i) => (
                          <li
                            key={i}
                            className="text-sm flex items-start gap-2"
                          >
                            <span className="text-primary">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
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
