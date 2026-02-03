import { AppLayout } from '@/components/layout/AppLayout';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { XPProgressBar } from '@/components/gamification/XPProgressBar';
import { BadgesGrid } from '@/components/gamification/BadgesGrid';
import { ChallengesCard } from '@/components/gamification/ChallengesCard';
import { LeaderboardCard } from '@/components/gamification/LeaderboardCard';
import { RewardsShopCard } from '@/components/gamification/RewardsShopCard';
import { useGamification } from '@/hooks/useGamification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Flame, Target, ListTodo } from 'lucide-react';

export default function AchievementsPage() {
  const { profile, badges } = useGamification();

  const stats = [
    { icon: Flame, label: 'Streak actuel', value: profile?.current_streak || 0, suffix: 'jours' },
    { icon: Trophy, label: 'Plus long streak', value: profile?.longest_streak || 0, suffix: 'jours' },
    { icon: Target, label: 'Habitudes', value: profile?.lifetime_habits_completed || 0, suffix: 'total' },
    { icon: ListTodo, label: 'Tâches', value: profile?.lifetime_tasks_completed || 0, suffix: 'total' },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <GlobalHeader
          title="Succès"
          subtitle="Tes badges et récompenses"
          icon={<Trophy className="h-6 w-6 text-primary" />}
        />

        {/* XP et Niveau */}
        <Card>
          <CardContent className="pt-6">
            <XPProgressBar variant="full" />
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-4 text-center">
                <stat.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.suffix}</p>
                <p className="text-sm font-medium mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Défis & Classement */}
        <div className="grid md:grid-cols-2 gap-6">
          <ChallengesCard />
          <LeaderboardCard />
        </div>

        {/* Boutique de récompenses */}
        <RewardsShopCard />

        {/* Badges par catégorie */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="streak">🔥 Streak</TabsTrigger>
            <TabsTrigger value="habits">💫 Habitudes</TabsTrigger>
            <TabsTrigger value="tasks">📝 Tâches</TabsTrigger>
            <TabsTrigger value="level">⭐ Niveau</TabsTrigger>
            <TabsTrigger value="special">✨ Spéciaux</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>Tous les badges</CardTitle>
              </CardHeader>
              <CardContent>
                <BadgesGrid showLocked />
              </CardContent>
            </Card>
          </TabsContent>

          {['streak', 'habits', 'tasks', 'level', 'special'].map((cat) => (
            <TabsContent key={cat} value={cat}>
              <Card>
                <CardHeader>
                  <CardTitle className="capitalize">Badges {cat}</CardTitle>
                </CardHeader>
                <CardContent>
                  <BadgesGrid category={cat} showLocked />
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AppLayout>
  );
}
