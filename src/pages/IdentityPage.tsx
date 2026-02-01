import { useState, useRef, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { IdentitySnapshotCard, IdentityComparison, PrimaryActionCard } from '@/components/identity';
import { AICoachCard } from '@/components/today/AICoachCard';
import { CriticalHabitsCard } from '@/components/today/CriticalHabitsCard';
import { ImpactTasksCard } from '@/components/today/ImpactTasksCard';
import { DriftSignalsCard } from '@/components/today/DriftSignalsCard';
import { QuickStatsFooter } from '@/components/today/QuickStatsFooter';
import { AIEngineStatus, BehavioralMetricsBar } from '@/components/ai';
import { AnimatedContainer } from '@/components/ui/animated-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useTodayCommand } from '@/hooks/useTodayCommand';
import { useTodayScore, useScoreHistory } from '@/hooks/useScores';
import { useCurrentIdentity } from '@/hooks/useCurrentIdentity';
import { useCompleteTask } from '@/hooks/useTasks';
import { useToggleHabitLog } from '@/hooks/useHabits';
import { useSound } from '@/hooks/useSound';
import { useActiveInterventions } from '@/hooks/useAIInterventions';
import { 
  Loader2, 
  Brain, 
  ChevronDown,
  TrendingUp,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function IdentityPage() {
  const navigate = useNavigate();
  const [trajectoryOpen, setTrajectoryOpen] = useState(true);
  const [evolutionOpen, setEvolutionOpen] = useState(false);
  
  // Core data hooks
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
  } = useTodayCommand();
  
  const { data: todayScore } = useTodayScore();
  const { data: scoreHistory } = useScoreHistory(7);
  const { data: identity } = useCurrentIdentity();
  const { data: activeInterventions } = useActiveInterventions();
  
  const completeTask = useCompleteTask();
  const toggleHabit = useToggleHabitLog();
  const { play } = useSound();

  // Race condition prevention
  const completingTaskRef = useRef<string | null>(null);
  const togglingHabitRef = useRef<string | null>(null);

  const today = new Date();
  const formattedDate = format(today, "EEEE d MMMM", { locale: fr });

  // Calculate momentum direction
  const momentumDirection = todayScore?.momentum_index 
    ? (todayScore.momentum_index > 0.05 ? 'up' : todayScore.momentum_index < -0.05 ? 'down' : 'stable')
    : momentum;

  // Handlers
  const handleCompleteTask = useCallback((id: string) => {
    if (completingTaskRef.current === id || completeTask.isPending) return;
    completingTaskRef.current = id;
    
    completeTask.mutate(id, {
      onSuccess: () => {
        play('task_done');
        completingTaskRef.current = null;
      },
      onError: () => {
        completingTaskRef.current = null;
      }
    });
  }, [completeTask, play]);

  const handleToggleHabit = useCallback((id: string) => {
    if (togglingHabitRef.current === id || toggleHabit.isPending) return;
    togglingHabitRef.current = id;
    
    toggleHabit.mutate(id, {
      onSuccess: () => {
        play('habit_done');
        togglingHabitRef.current = null;
      },
      onError: () => {
        togglingHabitRef.current = null;
      }
    });
  }, [toggleHabit, play]);

  // PLACEHOLDER - PART 2 WILL CONTINUE HERE
  return (
    <AppLayout>
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </AppLayout>
  );
}
