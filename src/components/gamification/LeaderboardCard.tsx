import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Flame, Medal, Crown, Star } from 'lucide-react';
import { useLeaderboard, useMyRank, type LeaderboardEntry } from '@/hooks/useLeaderboard';
import { cn } from '@/lib/utils';

const RANK_ICONS: Record<number, { icon: typeof Crown; color: string }> = {
  1: { icon: Crown, color: 'text-yellow-500' },
  2: { icon: Medal, color: 'text-gray-400' },
  3: { icon: Medal, color: 'text-amber-600' },
};

export function LeaderboardCard() {
  const { data: xpLeaderboard = [], isLoading: loadingXp } = useLeaderboard('xp', 10);
  const { data: streakLeaderboard = [], isLoading: loadingStreak } = useLeaderboard('streak', 10);
  const { data: myRank } = useMyRank();

  const renderEntry = (entry: LeaderboardEntry, type: 'xp' | 'streak') => {
    const rank = type === 'xp' ? entry.rank_xp : entry.rank_streak;
    const RankIcon = RANK_ICONS[rank]?.icon;
    const rankColor = RANK_ICONS[rank]?.color;

    return (
      <div
        key={`${entry.user_id}-${type}`}
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg transition-colors',
          entry.isCurrentUser 
            ? 'bg-primary/10 border border-primary/30' 
            : 'bg-card/50 hover:bg-card/80'
        )}
      >
        {/* Rank */}
        <div className="w-8 flex justify-center">
          {RankIcon ? (
            <RankIcon className={cn('h-5 w-5', rankColor)} />
          ) : (
            <span className="text-sm font-bold text-muted-foreground">
              {rank}
            </span>
          )}
        </div>

        {/* Avatar */}
        <Avatar className="h-8 w-8">
          <AvatarImage src={entry.avatar_url} alt={entry.display_name} />
          <AvatarFallback className="text-xs">
            {entry.display_name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Name & Level */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            'font-medium text-sm truncate',
            entry.isCurrentUser && 'text-primary'
          )}>
            {entry.display_name}
            {entry.isCurrentUser && ' (Toi)'}
          </p>
          <p className="text-xs text-muted-foreground">
            Niveau {entry.current_level}
          </p>
        </div>

        {/* Score */}
        <div className="text-right">
          {type === 'xp' ? (
            <div className="flex items-center gap-1 text-sm font-bold text-primary">
              <Star className="h-3.5 w-3.5" />
              {entry.total_xp.toLocaleString()}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-sm font-bold text-orange-500">
              <Flame className="h-3.5 w-3.5" />
              {entry.current_streak}j
            </div>
          )}
        </div>
      </div>
    );
  };

  const isLoading = loadingXp || loadingStreak;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Classement
          </CardTitle>
          {myRank && (
            <Badge variant="outline" className="text-xs">
              #{myRank.rank_xp} XP • #{myRank.rank_streak} Streak
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="xp" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="xp" className="gap-1">
              <Star className="h-3.5 w-3.5" />
              Total XP
            </TabsTrigger>
            <TabsTrigger value="streak" className="gap-1">
              <Flame className="h-3.5 w-3.5" />
              Streak
            </TabsTrigger>
          </TabsList>

          <TabsContent value="xp" className="mt-4 space-y-2">
            {isLoading ? (
              <p className="text-center text-muted-foreground py-4">Chargement...</p>
            ) : xpLeaderboard.length === 0 ? (
              <div className="text-center py-6">
                <Trophy className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Pas encore de classement
                </p>
              </div>
            ) : (
              xpLeaderboard.map((entry) => renderEntry(entry, 'xp'))
            )}
          </TabsContent>

          <TabsContent value="streak" className="mt-4 space-y-2">
            {isLoading ? (
              <p className="text-center text-muted-foreground py-4">Chargement...</p>
            ) : streakLeaderboard.length === 0 ? (
              <div className="text-center py-6">
                <Flame className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Pas encore de classement
                </p>
              </div>
            ) : (
              streakLeaderboard.map((entry) => renderEntry(entry, 'streak'))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
