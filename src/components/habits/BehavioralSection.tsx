import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Heart, Trophy, Zap, Plus, Check, ChevronDown, ChevronUp, 
  Flame, Loader2, Sparkles 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSaveBehavioralEntry, useTodayBehavioralEntry, useBehavioralStreak } from '@/hooks/useBehavioralEntries';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface BehavioralSectionProps {
  className?: string;
}

export function BehavioralSection({ className }: BehavioralSectionProps) {
  const { data: todayEntry, isLoading } = useTodayBehavioralEntry();
  const { data: streakData } = useBehavioralStreak();
  const saveBehavioral = useSaveBehavioralEntry();

  const [isExpanded, setIsExpanded] = useState(true);
  const [gratitude, setGratitude] = useState<string[]>(['', '', '']);
  const [wins, setWins] = useState<string[]>(['']);
  const [challenges, setChallenges] = useState<string[]>(['']);

  // Update form when data loads (useEffect to avoid render-loop)
  useEffect(() => {
    if (!todayEntry) return;
    setGratitude((todayEntry.gratitude && todayEntry.gratitude.length > 0) ? todayEntry.gratitude : ['', '', '']);
    setWins((todayEntry.wins && todayEntry.wins.length > 0) ? todayEntry.wins : ['']);
    setChallenges((todayEntry.challenges && todayEntry.challenges.length > 0) ? todayEntry.challenges : ['']);
  }, [todayEntry?.id]);

  const handleSave = () => {
    saveBehavioral.mutate({
      gratitude: gratitude.filter(g => g.trim()),
      wins: wins.filter(w => w.trim()),
      challenges: challenges.filter(c => c.trim()),
    });
  };

  const filledGratitude = gratitude.filter(g => g.trim()).length;
  const filledWins = wins.filter(w => w.trim()).length;
  const filledChallenges = challenges.filter(c => c.trim()).length;
  const totalFilled = filledGratitude + filledWins + filledChallenges;
  const isComplete = filledGratitude >= 3 && filledWins >= 1 && filledChallenges >= 1;

  if (isLoading) {
    return (
      <Card className={cn("glass", className)}>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("glass-strong border-accent/20", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent/15">
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Check-in Comportemental
                {isComplete && (
                  <Badge className="bg-success/20 text-success border-0">
                    <Check className="h-3 w-3 mr-1" />
                    Complété
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {format(new Date(), 'EEEE d MMMM', { locale: fr })}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {streakData && streakData.current > 0 && (
              <Badge className="bg-warning/15 text-warning border-0">
                <Flame className="h-3 w-3 mr-1" />
                {streakData.current}j
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Gratitude */}
          <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-destructive" />
            <span className="font-medium text-sm">🙏 Gratitudes</span>
            <Badge variant="outline" className="text-xs ml-auto">
              {filledGratitude}/3
              </Badge>
            </div>
            <div className="space-y-2">
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
                  className="glass-hover"
                />
              ))}
            </div>
          </div>

          {/* Wins */}
          <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-warning" />
            <span className="font-medium text-sm">🏆 Victoires</span>
            <Badge variant="outline" className="text-xs ml-auto">
              {filledWins}
              </Badge>
            </div>
            <div className="space-y-2">
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
                  className="glass-hover"
                />
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWins([...wins, ''])}
                className="w-full text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Ajouter
              </Button>
            </div>
          </div>

          {/* Challenges */}
          <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent" />
            <span className="font-medium text-sm">💪 Défis</span>
            <Badge variant="outline" className="text-xs ml-auto">
              {filledChallenges}
              </Badge>
            </div>
            <div className="space-y-2">
              {challenges.map((item, index) => (
                <Input
                  key={index}
                  value={item}
                  onChange={(e) => {
                    const updated = [...challenges];
                    updated[index] = e.target.value;
                    setChallenges(updated);
                  }}
                  placeholder="Un défi rencontré..."
                  className="glass-hover"
                />
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChallenges([...challenges, ''])}
                className="w-full text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Ajouter
              </Button>
            </div>
          </div>

          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            disabled={saveBehavioral.isPending || totalFilled === 0}
            className="w-full gradient-primary"
          >
            {saveBehavioral.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Sauvegarder
              </>
            )}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
