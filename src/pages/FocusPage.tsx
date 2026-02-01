import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { SageCompanion } from '@/components/sage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  RotateCcw,
  Timer,
  Coffee,
  Zap,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import { useFocusSessions, useStartFocusSession, useStopFocusSession } from '@/hooks/useFocus';
import { useTasks } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const POMODORO_WORK = 25 * 60; // 25 minutes
const POMODORO_BREAK = 5 * 60; // 5 minutes
const POMODORO_LONG_BREAK = 15 * 60; // 15 minutes

type SessionType = 'work' | 'break' | 'long_break';

export default function FocusPage() {
  const { data: sessions } = useFocusSessions();
  const { data: tasks } = useTasks();
  const startSession = useStartFocusSession();
  const stopSession = useStopFocusSession();
  const { toast } = useToast();

  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(POMODORO_WORK);
  const [sessionType, setSessionType] = useState<SessionType>('work');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const totalDuration = sessionType === 'work' 
    ? POMODORO_WORK 
    : sessionType === 'break' 
      ? POMODORO_BREAK 
      : POMODORO_LONG_BREAK;

  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleSessionComplete();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleSessionComplete = async () => {
    setIsRunning(false);
    
    if (currentSessionId) {
      try {
        await stopSession.mutateAsync(currentSessionId);
      } catch (error) {
        console.error('Error stopping session:', error);
      }
      setCurrentSessionId(null);
    }

    if (sessionType === 'work') {
      const newCount = completedPomodoros + 1;
      setCompletedPomodoros(newCount);
      
      toast({ 
        title: '🎉 Pomodoro terminé!',
        description: `${newCount} pomodoro${newCount > 1 ? 's' : ''} complété${newCount > 1 ? 's' : ''} aujourd'hui`,
      });

      // Switch to break
      if (newCount % 4 === 0) {
        setSessionType('long_break');
        setTimeLeft(POMODORO_LONG_BREAK);
      } else {
        setSessionType('break');
        setTimeLeft(POMODORO_BREAK);
      }
    } else {
      toast({ title: '☕ Pause terminée!' });
      setSessionType('work');
      setTimeLeft(POMODORO_WORK);
    }
  };

  const handleStart = async () => {
    setIsRunning(true);
    
    if (sessionType === 'work') {
      try {
        const session = await startSession.mutateAsync({
          taskId: selectedTaskId || undefined,
          type: 'pomodoro',
        });
        setCurrentSessionId(session.id);
      } catch (error) {
        console.error('Error starting session:', error);
      }
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = async () => {
    setIsRunning(false);
    
    if (currentSessionId) {
      try {
        await stopSession.mutateAsync(currentSessionId);
      } catch (error) {
        console.error('Error stopping session:', error);
      }
      setCurrentSessionId(null);
    }

    setTimeLeft(totalDuration);
  };

  const switchToWork = () => {
    handleReset();
    setSessionType('work');
    setTimeLeft(POMODORO_WORK);
  };

  const switchToBreak = () => {
    handleReset();
    setSessionType('break');
    setTimeLeft(POMODORO_BREAK);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const todayMinutes = sessions?.reduce((acc, s) => acc + (s.duration_min || 0), 0) || 0;
  const pendingTasks = tasks?.filter(t => t.status === 'todo' || t.status === 'in_progress').slice(0, 5) || [];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <GlobalHeader
          variant="page"
          title="Mode Focus"
          subtitle="Concentration maximale"
          icon={<Timer className="h-5 w-5 text-white" />}
          showStreak={false}
        />

        {/* Sage Companion */}
        <SageCompanion
          context="focus"
          mood="neutral"
          variant="inline"
          className="mb-6"
        />

        {/* Timer */}
        <Card className="overflow-hidden">
          <div className={cn(
            'p-8 text-center transition-colors duration-500',
            sessionType === 'work' 
              ? 'bg-gradient-to-br from-primary/5 to-primary/10' 
              : 'bg-gradient-to-br from-success/5 to-success/10'
          )}>
            {/* Session Type Tabs */}
            <div className="flex justify-center gap-2 mb-8">
              <Button
                variant={sessionType === 'work' ? 'default' : 'ghost'}
                size="sm"
                onClick={switchToWork}
                className="rounded-full"
              >
                <Zap className="h-4 w-4 mr-2" />
                Focus
              </Button>
              <Button
                variant={sessionType === 'break' || sessionType === 'long_break' ? 'default' : 'ghost'}
                size="sm"
                onClick={switchToBreak}
                className="rounded-full"
              >
                <Coffee className="h-4 w-4 mr-2" />
                Pause
              </Button>
            </div>

            {/* Timer Display */}
            <div className="relative inline-flex items-center justify-center mb-8">
              <svg className="w-64 h-64 transform -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted/30"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 120}
                  strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
                  strokeLinecap="round"
                  className={cn(
                    'transition-all duration-1000',
                    sessionType === 'work' ? 'text-primary' : 'text-success'
                  )}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-6xl font-bold font-mono tracking-tight">
                  {formatTime(timeLeft)}
                </span>
                <span className="text-sm text-muted-foreground mt-2 uppercase tracking-wider">
                  {sessionType === 'work' ? 'Focus' : sessionType === 'break' ? 'Pause' : 'Longue pause'}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4">
              {!isRunning ? (
                <Button size="xl" variant="gradient" onClick={handleStart} className="rounded-full px-12">
                  <Play className="h-5 w-5 mr-2" />
                  Démarrer
                </Button>
              ) : (
                <Button size="xl" variant="secondary" onClick={handlePause} className="rounded-full px-12">
                  <Pause className="h-5 w-5 mr-2" />
                  Pause
                </Button>
              )}
              <Button size="icon-lg" variant="outline" onClick={handleReset} className="rounded-full">
                <RotateCcw className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="hover-lift">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Timer className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedPomodoros}</p>
                  <p className="text-xs text-muted-foreground">Pomodoros</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-lift">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{todayMinutes}</p>
                  <p className="text-xs text-muted-foreground">Minutes focus</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-lift">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <CheckCircle2 className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{sessions?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-lift">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Zap className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{Math.floor(todayMinutes / 60)}h</p>
                  <p className="text-xs text-muted-foreground">Temps total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task Selection */}
        {pendingTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sélectionner une tâche</CardTitle>
              <CardDescription>
                Associez une tâche à votre session de focus
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pendingTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => setSelectedTaskId(selectedTaskId === task.id ? null : task.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all',
                      selectedTaskId === task.id
                        ? 'bg-primary/10 border border-primary/30'
                        : 'bg-muted/50 hover:bg-muted border border-transparent'
                    )}
                  >
                    <div className={cn(
                      'w-3 h-3 rounded-full',
                      task.priority === 'high' ? 'bg-destructive' :
                      task.priority === 'medium' ? 'bg-warning' : 'bg-success'
                    )} />
                    <span className="flex-1 truncate">{task.title}</span>
                    {task.estimate_min && (
                      <Badge variant="muted">{task.estimate_min}min</Badge>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
