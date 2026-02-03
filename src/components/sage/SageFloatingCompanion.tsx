import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, X, Sparkles, Target, MessageCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useActiveProgram } from '@/hooks/useActiveProgram';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTasks } from '@/hooks/useTasks';
import { useHabitsWithLogs } from '@/hooks/useHabits';
import { useTodayScore } from '@/hooks/useScores';

type SageState = 'minimized' | 'expanded';

interface PageMessage {
  message: string;
  emoji: string;
  mood: 'happy' | 'proud' | 'supportive' | 'alert' | 'neutral';
}

const moodColors = {
  happy: 'from-success/20 to-success/5 border-success/30',
  proud: 'from-warning/20 to-warning/5 border-warning/30',
  supportive: 'from-info/20 to-info/5 border-info/30',
  alert: 'from-destructive/20 to-destructive/5 border-destructive/30',
  neutral: 'from-primary/20 to-primary/5 border-primary/30',
};

export function SageFloatingCompanion() {
  const [state, setState] = useState<SageState>('expanded');
  const [showPulse, setShowPulse] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const { data: profile } = useUserProfile();
  const firstName = profile?.display_name?.split(' ')[0] || 'toi';
  
  const { data: program } = useActiveProgram();
  const { data: tasks } = useTasks();
  const { data: habits } = useHabitsWithLogs();
  const { data: scores } = useTodayScore();
  
  // Calculer les métriques
  const metrics = useMemo(() => {
    const urgentTasks = tasks?.filter(t => t.priority === 'high' && t.status !== 'done')?.length || 0;
    const completedTasks = tasks?.filter(t => t.status === 'done')?.length || 0;
    const totalTasks = tasks?.length || 0;
    const completedHabits = habits?.filter(h => h.todayLog?.completed)?.length || 0;
    const totalHabits = habits?.length || 0;
    const score = scores?.global_score || 50;
    
    return { urgentTasks, completedTasks, totalTasks, completedHabits, totalHabits, score };
  }, [tasks, habits, scores]);
  
  // Générer le message contextuel
  const pageMessage = useMemo((): PageMessage => {
    const path = location.pathname;
    const { urgentTasks, completedTasks, totalTasks, completedHabits, totalHabits, score } = metrics;
    
    // Messages par page
    if (path.includes('/identity')) {
      if (score >= 80) return { message: `Excellent ${firstName} ! Score de ${score}% 🔥`, emoji: '🏆', mood: 'proud' };
      if (score >= 60) return { message: `Bien joué ! Continue comme ça`, emoji: '💪', mood: 'happy' };
      return { message: `Concentre-toi sur tes points faibles`, emoji: '🎯', mood: 'supportive' };
    }
    
    if (path.includes('/tasks')) {
      if (urgentTasks > 2) return { message: `${urgentTasks} tâches urgentes !`, emoji: '⚠️', mood: 'alert' };
      if (completedTasks === totalTasks && totalTasks > 0) return { message: `Toutes tes tâches sont faites !`, emoji: '🎉', mood: 'proud' };
      if (urgentTasks > 0) return { message: `${urgentTasks} tâche urgente à traiter`, emoji: '📌', mood: 'neutral' };
      return { message: `${totalTasks - completedTasks} tâches restantes`, emoji: '📋', mood: 'neutral' };
    }
    
    if (path.includes('/habits')) {
      if (completedHabits === totalHabits && totalHabits > 0) return { message: `100% ! Journée parfaite ✨`, emoji: '🎉', mood: 'proud' };
      if (completedHabits > totalHabits / 2) return { message: `${completedHabits}/${totalHabits} - Tu y es presque !`, emoji: '🔥', mood: 'happy' };
      return { message: `${completedHabits}/${totalHabits} habitudes`, emoji: '💫', mood: 'neutral' };
    }
    
    if (path.includes('/journal')) {
      return { message: `Ton espace de réflexion`, emoji: '📝', mood: 'supportive' };
    }
    
    if (path.includes('/finance')) {
      if (score >= 70) return { message: `Tes finances vont bien !`, emoji: '💚', mood: 'happy' };
      return { message: `Surveille ton budget`, emoji: '💰', mood: 'neutral' };
    }
    
    if (path.includes('/achievements')) {
      return { message: `Tes succès et récompenses`, emoji: '🏆', mood: 'proud' };
    }
    
    if (path.includes('/program')) {
      return { message: `Ton programme personnalisé`, emoji: '🎯', mood: 'supportive' };
    }
    
    // Message par défaut basé sur l'heure
    const hour = new Date().getHours();
    if (hour < 12) return { message: `Bonjour ${firstName} !`, emoji: '☀️', mood: 'happy' };
    if (hour < 18) return { message: `Continue comme ça !`, emoji: '💪', mood: 'supportive' };
    return { message: `Belle soirée ${firstName}`, emoji: '🌙', mood: 'neutral' };
  }, [location.pathname, metrics, firstName]);
  
  // Pulse si intervention nécessaire
  useEffect(() => {
    if (metrics.urgentTasks > 2 || (program?.todayMission && program.current_day > 1)) {
      setShowPulse(true);
    }
  }, [metrics.urgentTasks, program]);
  
  // Pages où ne pas afficher Sage
  const hiddenPaths = ['/auth', '/', '/pricing'];
  if (hiddenPaths.some(p => location.pathname === p) || location.pathname.startsWith('/auth')) {
    return null;
  }
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6"
      >
        {state === 'minimized' ? (
          <motion.button
            onClick={() => { setState('expanded'); setShowPulse(false); }}
            className={cn(
              "relative h-14 w-14 rounded-full shadow-xl flex items-center justify-center",
              "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground",
              "hover:shadow-2xl transition-all duration-300"
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Brain className="h-6 w-6" />
            {showPulse && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-warning" />
              </span>
            )}
            <span className="absolute -bottom-1 text-lg">{pageMessage.emoji}</span>
          </motion.button>
        ) : (
          <Card className={cn(
            "w-80 border shadow-2xl overflow-hidden",
            `bg-gradient-to-br ${moodColors[pageMessage.mood]}`
          )}>
            <CardContent className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Sage</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Ton compagnon IA
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setState('minimized')}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Message contextuel */}
              <div className={cn(
                "p-3 rounded-lg",
                `bg-gradient-to-r ${moodColors[pageMessage.mood]}`
              )}>
                <p className="text-sm font-medium flex items-center gap-2">
                  <span className="text-lg">{pageMessage.emoji}</span>
                  {pageMessage.message}
                </p>
              </div>
              
              {/* Programme actif */}
              {program ? (
                <div className="space-y-2 p-3 rounded-lg bg-background/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{program.programs.icon}</span>
                      <span className="text-sm font-medium truncate max-w-[140px]">{program.programs.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Jour {program.current_day}/{program.programs.duration_days}
                    </Badge>
                  </div>
                  <Progress value={program.progress} className="h-1.5" />
                  
                  {program.todayMission && (
                    <div className="flex items-start gap-2 pt-1">
                      <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{program.todayMission.title}</p>
                        {program.todayMission.sage_tip && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            💡 {program.todayMission.sage_tip}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-background/50 text-center">
                  <p className="text-xs text-muted-foreground mb-2">
                    Aucun programme actif
                  </p>
                  <Button size="sm" variant="outline" onClick={() => navigate('/program')}>
                    Choisir un programme
                  </Button>
                </div>
              )}
              
              {/* Actions rapides */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  className="flex-1 text-xs"
                  onClick={() => navigate('/dashboard')}
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Parler à Sage
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => navigate(program ? '/program' : '/achievements')}
                >
                  {program ? 'Mon programme' : 'Mes succès'}
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
