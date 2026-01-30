import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Activity, Brain } from "lucide-react";
import { WinsTracker } from "@/components/behavior/WinsTracker";
import { useSearchParams } from "react-router-dom";

export default function BehaviorHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "wins";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            Comportement
          </h1>
          <p className="text-muted-foreground mt-1">
            Analyse et célèbre tes comportements
          </p>
        </div>

        <Tabs value={currentTab} onValueChange={handleTabChange}>
          <TabsList className="mb-6">
            <TabsTrigger value="wins" className="gap-2">
              <Trophy className="h-4 w-4" />
              Victoires
            </TabsTrigger>
            <TabsTrigger value="signals" className="gap-2">
              <Activity className="h-4 w-4" />
              Signaux
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wins">
            <WinsTracker />
          </TabsContent>

          <TabsContent value="signals">
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Signaux comportementaux - À venir</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
