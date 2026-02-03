import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CheckCircle2, Circle, Target, Sparkles, BookOpen, 
  ChevronRight, TrendingUp, Flame, Brain, Calendar
} from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useActiveProgram, useCompleteMission } from '@/hooks/useActiveProgram';
import { useTasks, useCompleteTask } from '@/hooks/useTasks';
import { useHabitsWithLogs, useToggleHabitLog } from '@/hooks/useHabits';
import { useJournalEntries } from '@/hooks/useJournal';
import { useTodayScore } from '@/hooks/useScores';
import { useGamificationProfile } from '@/hooks/useGamification';
import { BehavioralDNACard } from '@/components/dashboard/BehavioralDNACard';
import { cn } from '@/lib/utils';
import { format, isToday, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function DashboardPage() {
  const { data: profile, isLoading: loadingProfile } = useUserProfile();
  const { data: program, isLoading: loadingProgram } = useActiveProgram();
  const { data: tasks = [], isLoading: loadingTasks } = useTasks();
  const { data: habits = [], isLoading: loadingHabits } = useHabitsWithLogs();
  const { data: journalEntries = [] } = useJournalEntries();
  const { data: scores } = useTodayScore();
  const { data: gamification } = useGamificationProfile();
  
  const completeTask = useCompleteTask();
  const toggleHabit = useToggleHabitLog();
  const completeMission = useCompleteMission();

  const firstName = profile?.first_name || profile?.display_name?.split(' ')[0] || 'toi';

  // Tâches du jour
  const todayTasks = useMemo(() => {
    return tasks.filter(t => 
      t.status !== 'done' && 
      t.due_date && 
      isToday(parseISO(t.due_date))
    ).slice(0, 5);
  }, [tasks]);

  // Habitudes non complétées
  const pendingHabits = useMemo(() => {
    return habits.filter(h => !h.todayLog?.completed).slice(0, 5);
  }, [habits]);

  // Dernière entrée journal
  const lastJournalEntry = journalEntries[0];

  // Score global
  const globalScore = scores?.global_score || 50;

  // Message de bienvenue basé sur l'heure
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return `Bonjour ${firstName} !`;
    if (hour < 18) return `Bon après-midi ${firstName} !`;
    return `Bonsoir ${firstName} !`;
  }, [firstName]);

  const isLoading = loadingProfile || loadingProgram || loadingTasks || loadingHabits;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <div className="grid md:grid-cols-3 gap-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header avec score */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{greeting}</h1>
            <p className="text-muted-foreground capitalize">
              {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
            </p>
          </div>
          
          <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="text-4xl font-bold text-primary">
                  {globalScore}
                </div>
                <TrendingUp className="absolute -top-1 -right-4 h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium">Score global</p>
                <Progress value={globalScore} className="h-1.5 w-24 mt-1" />
              </div>
              {gamification && (
                <div className="hidden sm:block border-l pl-4 ml-2">
                  <p className="text-sm font-medium">Niveau {gamification.current_level}</p>
                  <p className="text-xs text-muted-foreground">{gamification.total_xp} XP</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Programme actif + Mission */}
        {program ? (
          <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="flex items-center gap-4 flex-1">
                  <div className="text-4xl">{program.programs?.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-primary font-medium uppercase tracking-wider">Programme en cours</p>
                    <h3 className="text-lg font-semibold truncate">{program.programs?.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">Jour {program.current_day}/{program.programs?.duration_days}</Badge>
                      <Progress value={program.progress || 0} className="h-1.5 w-20" />
                      <span className="text-xs text-muted-foreground">{program.progress || 0}%</span>
                    </div>
                  </div>
                </div>
                
                {program.todayMission && (
                  <div className="flex-1 lg:border-l lg:pl-6">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                      <Target className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-primary font-medium">Mission du jour</p>
                        <p className="font-medium truncate">{program.todayMission.title}</p>
                        {program.todayMission.sage_tip && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            💡 {program.todayMission.sage_tip}
                          </p>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => completeMission.mutate({
                          userProgramId: program.id,
                          programDayId: program.todayMission!.id,
                          xpReward: program.todayMission!.xp_reward,
                        })}
                        disabled={completeMission.isPending}
                      >
                        Fait !
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="p-8 text-center border-dashed">
            <div className="space-y-4">
              <Brain className="h-12 w-12 text-muted-foreground/50 mx-auto" />
              <h3 className="font-semibold">Aucun programme actif</h3>
              <p className="text-sm text-muted-foreground">
                Choisis un programme pour structurer ta transformation
              </p>
              <Button asChild>
                <Link to="/program">Choisir un programme</Link>
              </Button>
            </div>
          </Card>
        )}

        {/* Grille : Tâches + Habitudes + Journal */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Tâches du jour */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Tâches du jour
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/tasks">Voir tout <ChevronRight className="h-3 w-3 ml-1" /></Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {todayTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucune tâche pour aujourd'hui 🎉
                </p>
              ) : (
                todayTasks.map(task => (
                  <div 
                    key={task.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => completeTask.mutate(task.id)}
                  >
                    <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm truncate flex-1">{task.title}</span>
                    {(task as any).created_from_program && (
                      <Target className="h-3 w-3 text-primary flex-shrink-0" />
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Habitudes */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  Habitudes
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/habits">Voir tout <ChevronRight className="h-3 w-3 ml-1" /></Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingHabits.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Toutes tes habitudes sont faites ! ✨
                </p>
              ) : (
                pendingHabits.map(habit => (
                  <div 
                    key={habit.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => toggleHabit.mutate(habit.id)}
                  >
                    <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm truncate flex-1">{habit.name}</span>
                    {(habit.streak as any)?.current > 0 && (
                      <Badge variant="secondary" className="text-[10px] gap-0.5">
                        <Flame className="h-2.5 w-2.5" />
                        {(habit.streak as any)?.current}
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Journal */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-info" />
                  Journal
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/journal">Écrire <ChevronRight className="h-3 w-3 ml-1" /></Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {lastJournalEntry ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {lastJournalEntry.mood === 'good' ? '😊' : lastJournalEntry.mood === 'bad' ? '😔' : '😐'}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {format(parseISO(lastJournalEntry.date || lastJournalEntry.created_at), 'd MMM', { locale: fr })}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {lastJournalEntry.reflections || 'Entrée du jour'}
                  </p>
                </div>
              ) : (
                <div className="text-center py-4 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Pas encore d'entrée aujourd'hui
                  </p>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/journal">Écrire maintenant</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Behavioral DNA Card */}
        <div className="grid md:grid-cols-2 gap-4">
          <BehavioralDNACard />
          
          {/* Gamification rapide */}
          {gamification && (
            <Card className="bg-gradient-to-r from-warning/5 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                      <Flame className="h-6 w-6 text-warning" />
                    </div>
                    <div>
                      <p className="font-semibold">Streak : {gamification.current_streak} jours</p>
                      <p className="text-sm text-muted-foreground">
                        Record : {gamification.longest_streak} jours
                      </p>
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/achievements">
                      Voir mes succès
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
