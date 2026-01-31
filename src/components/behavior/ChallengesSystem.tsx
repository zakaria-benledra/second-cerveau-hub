import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Target, Trophy, Flame } from "lucide-react";
import { useChallenges, type ChallengeInput } from "@/hooks/useChallenges";
import { ChallengeCard } from "./ChallengeCard";
import { ChallengeFormModal } from "./ChallengeFormModal";

export function ChallengesSystem() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    activeChallenges,
    completedChallenges,
    isLoading,
    isTodayCompleted,
    createChallenge,
    markTodayComplete,
    abandonChallenge,
    deleteChallenge,
  } = useChallenges();

  const handleSubmit = (data: ChallengeInput) => {
    createChallenge.mutate(data, {
      onSuccess: () => {
        setIsModalOpen(false);
      },
    });
  };

  const handleMarkToday = (challengeId: string) => {
    markTodayComplete.mutate(challengeId);
  };

  const handleAbandon = (challengeId: string) => {
    if (confirm("Abandonner ce défi ?")) {
      abandonChallenge.mutate(challengeId);
    }
  };

  const handleDelete = (challengeId: string) => {
    if (confirm("Supprimer ce défi définitivement ?")) {
      deleteChallenge.mutate(challengeId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Mes Défis
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Relève des challenges personnels
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau Défi
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Flame className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeChallenges.length}</p>
              <p className="text-xs text-muted-foreground">En cours</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <Trophy className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedChallenges.length}</p>
              <p className="text-xs text-muted-foreground">Terminés</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Target className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {activeChallenges.reduce((sum, c) => sum + c.days_completed, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Jours complétés</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active" className="gap-2">
            <Flame className="h-4 w-4" />
            Actifs ({activeChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <Trophy className="h-4 w-4" />
            Terminés ({completedChallenges.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-3 mt-4">
          {isLoading ? (
            <>
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </>
          ) : activeChallenges.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-lg mb-2">
                  Aucun défi en cours
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Lance-toi un challenge personnel !
                </p>
                <Button onClick={() => setIsModalOpen(true)} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer mon premier défi
                </Button>
              </CardContent>
            </Card>
          ) : (
            activeChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                isTodayCompleted={isTodayCompleted(challenge.id)}
                onMarkToday={() => handleMarkToday(challenge.id)}
                onAbandon={() => handleAbandon(challenge.id)}
                onDelete={() => handleDelete(challenge.id)}
                isMarkingToday={markTodayComplete.isPending}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-3 mt-4">
          {completedChallenges.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-lg mb-2">
                  Aucun défi terminé
                </h3>
                <p className="text-muted-foreground text-sm">
                  Complète un défi pour le voir ici !
                </p>
              </CardContent>
            </Card>
          ) : (
            completedChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                isTodayCompleted={false}
                onMarkToday={() => {}}
                onAbandon={() => {}}
                onDelete={() => handleDelete(challenge.id)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Modal */}
      <ChallengeFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleSubmit}
        isSubmitting={createChallenge.isPending}
      />
    </div>
  );
}
