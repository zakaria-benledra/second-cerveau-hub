import { AppLayout } from '@/components/layout/AppLayout';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, Calendar, Trophy, Sparkles, CheckCircle2, 
  ChevronRight, Play
} from 'lucide-react';
import { useActiveProgram, useAvailablePrograms, useJoinProgram, useCompleteMission } from '@/hooks/useActiveProgram';
import { cn } from '@/lib/utils';

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-green-500/20 text-green-600 border-green-500/30',
  intermediate: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
  advanced: 'bg-orange-500/20 text-orange-600 border-orange-500/30',
  extreme: 'bg-red-500/20 text-red-600 border-red-500/30',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
  extreme: 'Extrême',
};

export default function ProgramPage() {
  const { data: activeProgram, isLoading: loadingActive } = useActiveProgram();
  const { data: programs = [], isLoading: loadingPrograms } = useAvailablePrograms();
  const joinProgram = useJoinProgram();
  const completeMission = useCompleteMission();
  
  const handleCompleteMission = () => {
    if (activeProgram?.todayMission) {
      completeMission.mutate({
        userProgramId: activeProgram.id,
        programDayId: activeProgram.todayMission.id,
        xpReward: activeProgram.todayMission.xp_reward,
      });
    }
  };
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <GlobalHeader
          title="Programmes"
          subtitle="Suis un parcours guidé par Sage pour atteindre tes objectifs"
          icon={<Target className="h-6 w-6" />}
        />
        
        <Tabs defaultValue={activeProgram ? 'active' : 'explore'} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="active" disabled={!activeProgram}>
              <Sparkles className="h-4 w-4 mr-2" />
              Programme actif
            </TabsTrigger>
            <TabsTrigger value="explore">
              <Target className="h-4 w-4 mr-2" />
              Explorer
            </TabsTrigger>
          </TabsList>
          
          {/* Programme actif */}
          <TabsContent value="active" className="space-y-6">
            {activeProgram && (
              <>
                {/* En-tête du programme */}
                <Card className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-3xl">
                          {activeProgram.programs.icon}
                        </div>
                        <div className="space-y-1">
                          <h2 className="text-xl font-bold">{activeProgram.programs.name}</h2>
                          <p className="text-sm text-muted-foreground">{activeProgram.programs.description}</p>
                          <div className="flex items-center gap-2 pt-1">
                            <Badge variant="outline" className="text-xs">
                              <Calendar className="h-3 w-3 mr-1" />
                              {activeProgram.programs.duration_days} jours
                            </Badge>
                            <Badge className={cn("text-xs", DIFFICULTY_COLORS[activeProgram.programs.difficulty])}>
                              {DIFFICULTY_LABELS[activeProgram.programs.difficulty]}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-center md:text-right">
                        <div className="text-4xl font-bold text-primary">
                          Jour {activeProgram.current_day}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          sur {activeProgram.programs.duration_days}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-6 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progression</span>
                        <span className="font-medium">{activeProgram.progress}%</span>
                      </div>
                      <Progress value={activeProgram.progress} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
                
                {/* Mission du jour */}
                {activeProgram.todayMission && (
                  <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Mission du jour
                      </CardTitle>
                      <CardDescription>Complète cette mission pour avancer</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">
                          {activeProgram.todayMission.title}
                        </h3>
                        <p className="text-muted-foreground">
                          {activeProgram.todayMission.description}
                        </p>
                        
                        {activeProgram.todayMission.sage_tip && (
                          <div className="p-3 rounded-lg bg-muted/50 mt-4">
                            <p className="text-sm font-medium">💡 Conseil de Sage :</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {activeProgram.todayMission.sage_tip}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between pt-2">
                        <Badge variant="secondary" className="font-medium">
                          <Sparkles className="h-3 w-3 mr-1" />
                          +{activeProgram.todayMission.xp_reward} XP
                        </Badge>
                        <Button 
                          onClick={handleCompleteMission}
                          disabled={completeMission.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Marquer comme fait
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Stats du programme */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-3xl font-bold text-primary">
                        {activeProgram.total_xp_earned || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">XP gagnés</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-3xl font-bold text-success">
                        {activeProgram.current_day - 1}
                      </div>
                      <p className="text-sm text-muted-foreground">Jours complétés</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-3xl font-bold">
                        {activeProgram.programs.duration_days - activeProgram.current_day + 1}
                      </div>
                      <p className="text-sm text-muted-foreground">Jours restants</p>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>
          
          {/* Explorer les programmes */}
          <TabsContent value="explore">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {programs.map((program) => {
                const isActive = activeProgram?.program_id === program.id;
                
                return (
                  <Card key={program.id} className={cn(
                    "transition-all hover:shadow-md",
                    isActive && "border-primary ring-1 ring-primary/20"
                  )}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-2xl">
                          {program.icon}
                        </div>
                        {isActive && (
                          <Badge variant="default" className="text-xs">Actif</Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg mt-3">{program.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {program.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          {program.duration_days} jours
                        </Badge>
                        <Badge className={cn("text-xs", DIFFICULTY_COLORS[program.difficulty])}>
                          {DIFFICULTY_LABELS[program.difficulty]}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          <Trophy className="h-3 w-3 mr-1" />
                          {program.xp_reward} XP
                        </Badge>
                      </div>
                      
                      <Button
                        className="w-full"
                        variant={isActive ? "secondary" : "default"}
                        onClick={() => !isActive && joinProgram.mutate(program.id)}
                        disabled={isActive || joinProgram.isPending}
                      >
                        {isActive ? (
                          <>En cours</>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Commencer
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
