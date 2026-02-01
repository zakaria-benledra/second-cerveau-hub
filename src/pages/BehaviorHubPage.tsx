import { AppLayout } from "@/components/layout/AppLayout";
import { GlobalHeader } from "@/components/layout/GlobalHeader";
import { SageCompanion } from "@/components/sage";
import { usePageSage } from "@/hooks/usePageSage";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, Heart, Flame, Activity, Zap, CheckCircle2 } from "lucide-react";
import { WinsTracker } from "@/components/behavior/WinsTracker";
import { ChallengesSystem } from "@/components/behavior/ChallengesSystem";
import { GratitudeJournal } from "@/components/behavior/GratitudeJournal";
import { HabitsTab } from "@/components/behavior/HabitsTab";
import { useSearchParams } from "react-router-dom";
import { useBehaviorHubStats } from "@/hooks/useBehaviorHubStats";

export default function BehaviorHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "habits";
  const { data: stats } = useBehaviorHubStats();

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <AppLayout>
      <div className="container max-w-5xl mx-auto py-6 px-4 space-y-6">
        {/* Header */}
        <GlobalHeader
          variant="page"
          title="Ton Hub"
          subtitle="Habitudes, victoires et gratitude"
          icon={<Zap className="h-5 w-5 text-white" />}
          showStreak={true}
        />

        {/* Sage Companion */}
        <SageCompanion
          context="habits"
          mood="neutral"
          variant="inline"
          className="mb-4"
        />

        {/* Global Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="glass-hover">
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/15">
                <Trophy className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums">{stats?.totalWins || 0}</p>
                <p className="text-[10px] text-muted-foreground">Victoires</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-hover">
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/15">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums">{stats?.activeChallenges || 0}</p>
                <p className="text-[10px] text-muted-foreground">Défis actifs</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-hover">
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/15">
                <Flame className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums">{stats?.gratitudeStreak || 0}j</p>
                <p className="text-[10px] text-muted-foreground">Streak gratitude</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="glass-strong w-full justify-start overflow-x-auto">
            <TabsTrigger value="habits" className="gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">Habitudes</span>
            </TabsTrigger>
            <TabsTrigger value="wins" className="gap-1.5">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Victoires</span>
            </TabsTrigger>
            <TabsTrigger value="gratitude" className="gap-1.5">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Gratitude</span>
            </TabsTrigger>
            <TabsTrigger value="challenges" className="gap-1.5">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Défis</span>
            </TabsTrigger>
            <TabsTrigger value="signals" className="gap-1.5">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Signaux</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="habits" className="mt-0">
            <HabitsTab />
          </TabsContent>

          <TabsContent value="wins" className="mt-0">
            <WinsTracker />
          </TabsContent>

          <TabsContent value="gratitude" className="mt-0">
            <GratitudeJournal />
          </TabsContent>

          <TabsContent value="challenges" className="mt-0">
            <ChallengesSystem />
          </TabsContent>

          <TabsContent value="signals" className="mt-0">
            <Card className="glass">
              <CardContent className="py-12 text-center">
                <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">Signaux comportementaux — À venir</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Détection automatique des patterns et dérives
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
