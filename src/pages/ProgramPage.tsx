import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  Target, Calendar, Trophy, Sparkles, CheckCircle2, 
  Circle, Lock, ChevronRight, Play, Clock, Flame,
  ListChecks, BookOpen, Brain, ArrowRight, Star
} from 'lucide-react';
import { 
  useActiveProgram, 
  useAvailablePrograms, 
  useCompleteMission,
  useProgramDays,
  type Program
} from '@/hooks/useActiveProgram';
import { useAllTasks } from '@/hooks/useTasks';
import { useHabitsWithLogs } from '@/hooks/useHabits';
import { ProgramStartDialog } from '@/components/program/ProgramStartDialog';
import { cn } from '@/lib/utils';
import { format, addDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const DIFFICULTY_CONFIG = {
  beginner: { label: 'Débutant', color: 'bg-green-500/20 text-green-600 border-green-500/30' },
  intermediate: { label: 'Intermédiaire', color: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30' },
  advanced: { label: 'Avancé', color: 'bg-orange-500/20 text-orange-600 border-orange-500/30' },
  extreme: { label: 'Extrême', color: 'bg-red-500/20 text-red-600 border-red-500/30' },
};

export default function ProgramPage() {
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  
  const { data: activeProgram, isLoading: loadingActive } = useActiveProgram();
  const { data: programs = [], isLoading: loadingPrograms } = useAvailablePrograms();
  const { data: programDays = [] } = useProgramDays(activeProgram?.program_id);
  const { data: tasks = [] } = useAllTasks();
  const { data: habits = [] } = useHabitsWithLogs();
  
  const completeMission = useCompleteMission();

  // Tâches et habitudes créées par le programme actif
  const programTasks = useMemo(() => {
    if (!activeProgram) return [];
    return tasks.filter(t => (t as any).created_from_program === activeProgram.program_id);
  }, [tasks, activeProgram]);

  const programHabits = useMemo(() => {
    if (!activeProgram) return [];
    return habits.filter(h => (h as any).created_from_program === activeProgram.program_id);
  }, [habits, activeProgram]);

  // Calculer la date de chaque jour du programme
  const daysWithDates = useMemo(() => {
    if (!activeProgram || !programDays.length) return [];
    const startDate = parseISO(activeProgram.started_at);
    
    return programDays.map(day => {
      const dayDate = addDays(startDate, day.day_number - 1);
      const isCompleted = day.day_number < activeProgram.current_day;
      const isCurrent = day.day_number === activeProgram.current_day;
      const isLocked = day.day_number > activeProgram.current_day;
      
      return {
        ...day,
        date: dayDate,
        isCompleted,
        isCurrent,
        isLocked,
      };
    });
  }, [programDays, activeProgram]);

  // Stats du programme
  const stats = useMemo(() => {
    const completedDays = activeProgram?.current_day ? activeProgram.current_day - 1 : 0;
    const totalDays = activeProgram?.programs?.duration_days || 1;
    const tasksCompleted = programTasks.filter(t => t.status === 'done').length;
    const habitsToday = programHabits.filter(h => (h as any).todayLog?.completed).length;
    
    return {
      completedDays,
      totalDays,
      daysRemaining: totalDays - completedDays,
      tasksCompleted,
      totalTasks: programTasks.length,
      habitsToday,
      totalHabits: programHabits.length,
    };
  }, [activeProgram, programTasks, programHabits]);

  if (loadingActive || loadingPrograms) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <GlobalHeader
          title="Programme"
          subtitle={activeProgram ? activeProgram.programs.name : "Choisis ton parcours de transformation"}
          icon={<Target className="h-6 w-6" />}
        />

        {activeProgram ? (
          // === PROGRAMME ACTIF ===
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full max-w-lg grid-cols-4">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="missions">Missions</TabsTrigger>
              <TabsTrigger value="created">Créés</TabsTrigger>
              <TabsTrigger value="change">Changer</TabsTrigger>
            </TabsList>

            {/* === ONGLET VUE D'ENSEMBLE === */}
            <TabsContent value="overview" className="space-y-6">
              {/* En-tête du programme */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-3xl border-2 border-border">
                        <span>{activeProgram.programs.icon}</span>
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-xl font-bold">{activeProgram.programs.name}</h2>
                        <p className="text-sm text-muted-foreground max-w-md">{activeProgram.programs.description}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {activeProgram.programs.duration_days} jours
                          </Badge>
                          <Badge className={cn("text-xs", DIFFICULTY_CONFIG[activeProgram.programs.difficulty as keyof typeof DIFFICULTY_CONFIG]?.color)}>
                            {DIFFICULTY_CONFIG[activeProgram.programs.difficulty as keyof typeof DIFFICULTY_CONFIG]?.label}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            <Trophy className="h-3 w-3 mr-1" />
                            {activeProgram.programs.xp_reward} XP
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {/* Jour actuel */}
                    <div className="text-center md:text-right p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="text-4xl font-bold text-primary">
                        Jour {activeProgram.current_day}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        sur {activeProgram.programs.duration_days}
                      </p>
                    </div>
                  </div>
                  
                  {/* Barre de progression */}
                  <div className="mt-6 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progression globale</span>
                      <span className="font-medium">{activeProgram.progress}%</span>
                    </div>
                    <Progress value={activeProgram.progress} className="h-3" />
                  </div>
                </CardContent>
              </Card>

              {/* Mission du jour */}
              {activeProgram.todayMission && (
                <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Mission du jour</CardTitle>
                        <CardDescription>Jour {activeProgram.current_day}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">
                        {activeProgram.todayMission.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {activeProgram.todayMission.description}
                      </p>
                    </div>
                    
                    {activeProgram.todayMission.sage_tip && (
                      <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                        <Brain className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Conseil de Sage</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {activeProgram.todayMission.sage_tip}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2">
                      <Badge variant="secondary" className="font-medium">
                        <Sparkles className="h-3 w-3 mr-1" />
                        +{activeProgram.todayMission.xp_reward} XP
                      </Badge>
                      <Button 
                        onClick={() => completeMission.mutate({
                          userProgramId: activeProgram.id,
                          programDayId: activeProgram.todayMission!.id,
                          xpReward: activeProgram.todayMission!.xp_reward,
                        })}
                        disabled={completeMission.isPending}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Mission accomplie !
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Stats rapides */}
              <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-primary">{stats.completedDays}</p>
                    <p className="text-sm text-muted-foreground">Jours complétés</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold">{stats.daysRemaining}</p>
                    <p className="text-sm text-muted-foreground">Jours restants</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-green-600">{stats.tasksCompleted}</p>
                    <p className="text-sm text-muted-foreground">Tâches faites</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-amber-500">{activeProgram.total_xp_earned || 0}</p>
                    <p className="text-sm text-muted-foreground">XP gagnés</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* === ONGLET MISSIONS === */}
            <TabsContent value="missions">
              <Card>
                <CardHeader>
                  <CardTitle>Toutes les missions</CardTitle>
                  <CardDescription>
                    {daysWithDates.filter(d => d.isCompleted).length} sur {daysWithDates.length} missions complétées
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {daysWithDates.map((day) => (
                    <div
                      key={day.id}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-lg border transition-all",
                        day.isCurrent && "border-primary bg-primary/5",
                        day.isCompleted && "bg-muted/30 opacity-80",
                        day.isLocked && "opacity-50"
                      )}
                    >
                      {/* Indicateur de statut */}
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 border-2",
                        day.isCompleted && "bg-green-500/20 border-green-500 text-green-600",
                        day.isCurrent && "bg-primary/20 border-primary text-primary",
                        day.isLocked && "bg-muted border-border text-muted-foreground"
                      )}>
                        {day.isCompleted ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : day.isLocked ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <span className="font-bold">{day.day_number}</span>
                        )}
                      </div>
                      
                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium truncate">{day.title}</h4>
                          {day.isCurrent && (
                            <Badge variant="default" className="text-xs">Aujourd'hui</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {day.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(day.date, 'EEEE d MMMM', { locale: fr })}
                        </p>
                      </div>
                      
                      {/* XP */}
                      <Badge variant="secondary" className="flex-shrink-0">
                        +{day.xp_reward} XP
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* === ONGLET ÉLÉMENTS CRÉÉS === */}
            <TabsContent value="created" className="space-y-6">
              {/* Habitudes du programme */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="h-5 w-5 text-orange-500" />
                      <CardTitle>Habitudes créées</CardTitle>
                    </div>
                    <Badge variant="outline">{programHabits.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {programHabits.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Aucune habitude créée par ce programme
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {programHabits.map(habit => (
                        <div key={habit.id} className="flex items-center gap-3 p-3 rounded-lg border">
                          {(habit as any).todayLog?.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                          <span className="flex-1">{habit.name}</span>
                          {((habit as any).streak as any)?.current > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <Flame className="h-3 w-3 mr-1" />
                              {((habit as any).streak as any)?.current}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <Button variant="outline" className="w-full mt-4" asChild>
                    <Link to="/habits">
                      Voir toutes mes habitudes
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Tâches du programme */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ListChecks className="h-5 w-5 text-blue-500" />
                      <CardTitle>Tâches créées</CardTitle>
                    </div>
                    <Badge variant="outline">
                      {stats.tasksCompleted}/{stats.totalTasks}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {programTasks.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Aucune tâche créée par ce programme
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {programTasks.map(task => (
                        <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border">
                          {task.status === 'done' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                          <span className="flex-1">{task.title}</span>
                          {task.due_date && (
                            <Badge variant="outline" className="text-xs">
                              {format(parseISO(task.due_date), 'd MMM', { locale: fr })}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <Button variant="outline" className="w-full mt-4" asChild>
                    <Link to="/tasks">
                      Voir toutes mes tâches
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* === ONGLET CHANGER DE PROGRAMME === */}
            <TabsContent value="change" className="space-y-6">
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Star className="h-6 w-6 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Programme en cours</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Tu es au jour {activeProgram.current_day} sur {activeProgram.programs.duration_days}.
                        Changer de programme archivera ta progression actuelle.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Separator />
              
              <div className="grid gap-4 md:grid-cols-2">
                {programs.map(program => {
                  const isActive = activeProgram.program_id === program.id;
                  
                  return (
                    <Card 
                      key={program.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        isActive && "border-primary ring-1 ring-primary/20 cursor-default"
                      )}
                      onClick={() => !isActive && setSelectedProgram(program)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <span className="text-2xl">{program.icon}</span>
                          {isActive && <Badge variant="default">Actif</Badge>}
                        </div>
                        <CardTitle className="text-lg">{program.name}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {program.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {program.duration_days}j
                          </Badge>
                          <Badge className={cn("text-xs", DIFFICULTY_CONFIG[program.difficulty as keyof typeof DIFFICULTY_CONFIG]?.color)}>
                            {DIFFICULTY_CONFIG[program.difficulty as keyof typeof DIFFICULTY_CONFIG]?.label}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          // === PAS DE PROGRAMME ACTIF ===
          <div className="space-y-8">
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center">
                <Target className="h-16 w-16 mx-auto text-primary/50 mb-4" />
                <h2 className="text-2xl font-bold">Commence ta transformation</h2>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                  Choisis un programme adapté à tes objectifs. Sage t'accompagnera 
                  chaque jour avec des missions personnalisées.
                </p>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {programs.map(program => (
                <Card 
                  key={program.id}
                  className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
                  onClick={() => setSelectedProgram(program)}
                >
                  <CardHeader>
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-2xl border-2 border-border mb-2">
                      {program.icon}
                    </div>
                    <CardTitle>{program.name}</CardTitle>
                    <CardDescription>{program.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 flex-wrap mb-4">
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        {program.duration_days} jours
                      </Badge>
                      <Badge className={cn("text-xs", DIFFICULTY_CONFIG[program.difficulty as keyof typeof DIFFICULTY_CONFIG]?.color)}>
                        {DIFFICULTY_CONFIG[program.difficulty as keyof typeof DIFFICULTY_CONFIG]?.label}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        <Trophy className="h-3 w-3 mr-1" />
                        {program.xp_reward} XP
                      </Badge>
                    </div>
                    <Button className="w-full">
                      <Play className="h-4 w-4 mr-2" />
                      Commencer
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dialog de démarrage */}
      {selectedProgram && (
        <ProgramStartDialog
          program={selectedProgram}
          open={!!selectedProgram}
          onOpenChange={(open) => !open && setSelectedProgram(null)}
        />
      )}
    </AppLayout>
  );
}
