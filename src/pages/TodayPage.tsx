import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { GlobalStateCard } from '@/components/today/GlobalStateCard';
import { NextBestActionCard } from '@/components/today/NextBestActionCard';
import { CriticalHabitsCard } from '@/components/today/CriticalHabitsCard';
import { ImpactTasksCard } from '@/components/today/ImpactTasksCard';
import { DriftSignalsCard } from '@/components/today/DriftSignalsCard';
import { AIInsightCard } from '@/components/today/AIInsightCard';
import { QuickStatsFooter } from '@/components/today/QuickStatsFooter';
import { AnimatedContainer } from '@/components/ui/animated-container';
import { useTodayCommand } from '@/hooks/useTodayCommand';
import { useCompleteTask } from '@/hooks/useTasks';
import { useToggleHabitLog } from '@/hooks/useHabits';
import { useAICoach } from '@/hooks/useAICoach';
import { useSound } from '@/hooks/useSound';
import { Loader2, Settings2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SoundSettings } from '@/components/sound/SoundSettings';

export default function TodayPage() {
  const navigate = useNavigate();
  const [showSoundSettings, setShowSoundSettings] = useState(false);
  
  // Use centralized command center hook
  const {
    isLoading,
    nextBestAction,
    disciplineScore,
    momentum,
    energyLevel,
    financialStress,
    cognitiveLoad,
    driftSignals,
    completedHabitsCount,
    completedTasksCount,
    newInboxCount,
    habitsForCard,
    tasksForCard,
    aiInsight,
  } = useTodayCommand();
  
  const completeTask = useCompleteTask();
  const toggleHabit = useToggleHabitLog();
  const { refetchBriefing, briefingLoading } = useAICoach();
  const { play } = useSound();

  const today = new Date();
  const formattedDate = format(today, "EEEE d MMMM", { locale: fr });

  // Handle task completion with sound
  const handleCompleteTask = (id: string) => {
    completeTask.mutate(id, {
      onSuccess: () => {
        play('task_done');
      }
    });
  };

  // Handle habit toggle with sound
  const handleToggleHabit = (id: string) => {
    toggleHabit.mutate(id, {
      onSuccess: () => {
        play('habit_done');
      }
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full gradient-primary animate-pulse opacity-20" />
              <Loader2 className="h-8 w-8 animate-spin text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-sm text-muted-foreground animate-pulse">
              Chargement de votre journée...
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header - Minimal with animation */}
        <AnimatedContainer delay={0} animation="fade-up">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight capitalize text-gradient">
                {formattedDate}
              </h1>
              <p className="text-muted-foreground mt-1">
                Centre de commande
              </p>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowSoundSettings(!showSoundSettings)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings2 className="h-5 w-5" />
            </Button>
          </div>
        </AnimatedContainer>

        {/* Sound Settings Popover */}
        {showSoundSettings && (
          <AnimatedContainer animation="scale-in">
            <Card className="glass-strong">
              <CardContent className="p-4">
                <SoundSettings />
              </CardContent>
            </Card>
          </AnimatedContainer>
        )}

        {/* SECTION 1: Global State Bar - Each KPI clickable */}
        <AnimatedContainer delay={50} animation="fade-up">
          <GlobalStateCard
            disciplineScore={disciplineScore}
            energyLevel={energyLevel}
            financialStress={financialStress}
            cognitiveLoad={cognitiveLoad}
            momentum={momentum}
            onScoreClick={() => navigate('/history?metric=discipline&range=7')}
          />
        </AnimatedContainer>

        {/* SECTION 2: Next Best Action - Dominant Card */}
        {nextBestAction && nextBestAction.status !== 'done' && (
          <AnimatedContainer delay={100} animation="fade-up">
            <NextBestActionCard
              task={{
                id: nextBestAction.id,
                title: nextBestAction.title,
                description: nextBestAction.description || undefined,
                priority: nextBestAction.priority,
                estimateMin: nextBestAction.estimate_min || undefined,
                energyLevel: nextBestAction.energy_level || undefined,
                impactScore: 85,
              }}
              onStart={() => handleCompleteTask(nextBestAction.id)}
              isLoading={completeTask.isPending}
            />
          </AnimatedContainer>
        )}

        {/* SECTION 3: Focus Zone - Habits + Tasks (max 3 each) */}
        <div className="grid gap-6 md:grid-cols-2">
          <AnimatedContainer delay={150} animation="fade-up">
            <CriticalHabitsCard
              habits={habitsForCard}
              onToggle={handleToggleHabit}
              isToggling={toggleHabit.isPending}
            />
          </AnimatedContainer>

          <AnimatedContainer delay={200} animation="fade-up">
            <ImpactTasksCard
              tasks={tasksForCard}
              onComplete={handleCompleteTask}
              isLoading={completeTask.isPending}
            />
          </AnimatedContainer>
        </div>

        {/* SECTION 4: Drift Signals - Compact alerts (max 4) */}
        {driftSignals.length > 0 && (
          <AnimatedContainer delay={250} animation="fade-up">
            <DriftSignalsCard signals={driftSignals} />
          </AnimatedContainer>
        )}

        {/* SECTION 5: AI Insight Footer */}
        {aiInsight && (
          <AnimatedContainer delay={300} animation="fade-up">
            <AIInsightCard
              insight={aiInsight}
              onRefresh={refetchBriefing}
              isRefreshing={briefingLoading}
              source="ai"
            />
          </AnimatedContainer>
        )}

        {/* Quick Stats Footer - Clickable links to history */}
        <AnimatedContainer delay={350} animation="fade">
          <QuickStatsFooter
            completedHabitsCount={completedHabitsCount}
            completedTasksCount={completedTasksCount}
            newInboxCount={newInboxCount}
          />
        </AnimatedContainer>
      </div>
    </AppLayout>
  );
}
