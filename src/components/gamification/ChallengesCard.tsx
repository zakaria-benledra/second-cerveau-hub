import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Clock, Trophy, Plus } from 'lucide-react';
import { useActiveChallenges, useAvailableChallenges, useJoinChallenge } from '@/hooks/useGamificationChallenges';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-success/20 text-success border-success/30',
  medium: 'bg-warning/20 text-warning border-warning/30',
  hard: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
  extreme: 'bg-destructive/20 text-destructive border-destructive/30',
};

const TYPE_LABELS: Record<string, string> = {
  daily: '📅 Quotidien',
  weekly: '📆 Hebdo',
  monthly: '🗓️ Mensuel',
  special: '✨ Spécial',
  seasonal: '🎄 Saisonnier',
};

export function ChallengesCard() {
  const { data: activeChallenges = [], isLoading: loadingActive } = useActiveChallenges();
  const { data: availableChallenges = [], isLoading: loadingAvailable } = useAvailableChallenges();
  const joinChallenge = useJoinChallenge();

  const activeIds = new Set(activeChallenges.map(c => c.challenge_id));
  const availableToJoin = availableChallenges.filter(c => !activeIds.has(c.id));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Défis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">
              Actifs ({activeChallenges.length})
            </TabsTrigger>
            <TabsTrigger value="available">
              Disponibles ({availableToJoin.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4 space-y-3">
            {loadingActive ? (
              <p className="text-muted-foreground text-center py-4">Chargement...</p>
            ) : activeChallenges.length === 0 ? (
              <div className="text-center py-6">
                <Trophy className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                <p className="font-medium">Aucun défi actif</p>
                <p className="text-sm text-muted-foreground">Rejoins un défi pour commencer !</p>
              </div>
            ) : (
              activeChallenges.map((uc) => (
                <div
                  key={uc.id}
                  className="p-3 rounded-lg border border-border/50 bg-card/50 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{uc.challenge?.icon}</span>
                      <div>
                        <p className="font-medium text-sm">{uc.challenge?.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {uc.challenge?.description}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn('text-xs', DIFFICULTY_COLORS[uc.challenge?.difficulty || 'medium'])}
                    >
                      {uc.challenge?.difficulty}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{uc.current_progress} / {uc.target_value}</span>
                      <span className="text-primary">+{uc.challenge?.xp_reward} XP</span>
                    </div>
                    <Progress 
                      value={(uc.current_progress / uc.target_value) * 100} 
                      className="h-2" 
                    />
                  </div>

                  {uc.expires_at && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Expire {formatDistanceToNow(new Date(uc.expires_at), { addSuffix: true, locale: fr })}
                    </div>
                  )}
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="available" className="mt-4 space-y-3">
            {loadingAvailable ? (
              <p className="text-muted-foreground text-center py-4">Chargement...</p>
            ) : availableToJoin.length === 0 ? (
              <div className="text-center py-6">
                <Trophy className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                <p className="font-medium">Tu as rejoint tous les défis !</p>
              </div>
            ) : (
              availableToJoin.slice(0, 6).map((challenge) => (
                <div
                  key={challenge.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/50"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xl">{challenge.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{challenge.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {TYPE_LABELS[challenge.challenge_type]}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn('text-xs', DIFFICULTY_COLORS[challenge.difficulty])}
                        >
                          {challenge.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => joinChallenge.mutate(challenge.id)}
                    disabled={joinChallenge.isPending}
                    className="shrink-0"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    +{challenge.xp_reward} XP
                  </Button>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
