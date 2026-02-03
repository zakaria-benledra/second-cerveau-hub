import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTasks } from '@/hooks/useTasks';
import { useHabitsWithLogs } from '@/hooks/useHabits';
import { useTodayScore } from '@/hooks/useScores';
import { useGamificationProfile } from '@/hooks/useGamification';

type SageMood = 'happy' | 'proud' | 'supportive' | 'concerned' | 'excited' | 'calm' | 'neutral' | 'focused';

interface SageMessage {
  greeting?: string;
  message: string;
  tip?: string;
  emoji: string;
  mood: SageMood;
  actionLabel?: string;
  actionPath?: string;
}

// Fetch contextual messages from DB
async function fetchSageMessages(pagePath: string) {
  const { data, error } = await supabase
    .from('sage_contextual_messages' as never)
    .select('*')
    .eq('page_path', pagePath)
    .order('priority', { ascending: false });
  
  if (error) return [];
  return data || [];
}

// Determine user state based on metrics
function determineUserState(metrics: {
  score: number;
  streak: number;
  urgentTasks: number;
  completedHabits: number;
  totalHabits: number;
  hasProgram: boolean;
  programDay: number;
}): string {
  const { score, streak, urgentTasks, completedHabits, totalHabits, hasProgram, programDay } = metrics;
  
  // Program states
  if (hasProgram && programDay === 1) return 'first_program_day';
  if (hasProgram) return 'day_active';
  
  // Performance states
  if (streak >= 7 && score >= 80) return 'winning';
  if (score < 40 || streak === 0) return 'struggling';
  if (urgentTasks > 3) return 'overwhelmed';
  if (completedHabits === totalHabits && totalHabits > 0) return 'all_completed';
  if (streak > 0) return 'building_streak';
  
  // Time-based states
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 18 || hour < 5) return 'evening';
  
  return 'returning';
}

// Get time of day
function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

// Replace variables in message
function interpolateMessage(template: string, vars: Record<string, string | number>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  return result;
}

export function useSageLive() {
  const location = useLocation();
  const { data: profile } = useUserProfile();
  const { data: tasks = [] } = useTasks();
  const { data: habits = [] } = useHabitsWithLogs();
  const { data: scores } = useTodayScore();
  const { data: gamification } = useGamificationProfile();
  
  const firstName = profile?.first_name || profile?.display_name?.split(' ')[0] || 'toi';
  const pagePath = '/' + location.pathname.split('/')[1]; // Get base path
  
  // Fetch messages for current page
  const { data: dbMessages = [] } = useQuery({
    queryKey: ['sage-messages', pagePath],
    queryFn: () => fetchSageMessages(pagePath),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
  
  // Calculate metrics
  const metrics = useMemo(() => {
    const urgentTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'done').length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const totalTasks = tasks.length;
    const completedHabits = habits.filter((h: any) => h.todayLog?.completed).length;
    const totalHabits = habits.length;
    const score = scores?.global_score || 50;
    const streak = gamification?.current_streak || 0;
    
    return {
      urgentTasks,
      completedTasks,
      totalTasks,
      completedHabits,
      totalHabits,
      score,
      streak,
      hasProgram: false, // Will be set by caller
      programDay: 0,
    };
  }, [tasks, habits, scores, gamification]);
  
  // Generate contextual message
  const sageState = useMemo((): SageMessage => {
    const userState = determineUserState(metrics);
    const timeOfDay = getTimeOfDay();
    
    // Find matching message from DB
    const matchingMessage = dbMessages.find((msg: any) => {
      const stateMatch = msg.user_state === userState;
      const timeMatch = !msg.time_of_day || msg.time_of_day === timeOfDay;
      const scoreMatch = (!msg.min_score || metrics.score >= msg.min_score) && 
                         (!msg.max_score || metrics.score <= msg.max_score);
      const streakMatch = (!msg.min_streak || metrics.streak >= msg.min_streak) &&
                          (!msg.max_streak || metrics.streak <= msg.max_streak);
      
      return stateMatch && timeMatch && scoreMatch && streakMatch;
    });
    
    // Variables for interpolation
    const vars = {
      name: firstName,
      score: metrics.score,
      streak: metrics.streak,
      tasks_count: metrics.totalTasks - metrics.completedTasks,
      habits_count: metrics.totalHabits,
      urgent_count: metrics.urgentTasks,
      completed: metrics.completedHabits,
      total: metrics.totalHabits,
    };
    
    if (matchingMessage) {
      return {
        greeting: matchingMessage.greeting ? interpolateMessage(matchingMessage.greeting, vars) : undefined,
        message: interpolateMessage(matchingMessage.main_message, vars),
        tip: matchingMessage.contextual_tip ? interpolateMessage(matchingMessage.contextual_tip, vars) : undefined,
        emoji: matchingMessage.emoji || '🧠',
        mood: matchingMessage.mood as SageMood || 'neutral',
        actionLabel: matchingMessage.action_suggestion,
        actionPath: undefined,
      };
    }
    
    // Fallback messages based on state
    const fallbackMessages: Record<string, SageMessage> = {
      winning: {
        greeting: `${firstName}, tu es INCROYABLE ! 🔥`,
        message: `Streak de ${metrics.streak} jours ! Score à ${metrics.score}%`,
        tip: 'Continue sur cette lancée !',
        emoji: '🔥',
        mood: 'proud',
        actionLabel: 'Voir mes succès',
        actionPath: '/achievements',
      },
      struggling: {
        greeting: `Hey ${firstName}, je suis là 💙`,
        message: 'Les derniers jours ont été difficiles, mais c\'est OK.',
        tip: 'Choisis UNE seule petite chose à faire. Juste une.',
        emoji: '💙',
        mood: 'supportive',
        actionLabel: 'Une tâche simple',
        actionPath: '/tasks',
      },
      morning: {
        greeting: `Bonjour ${firstName} ! ☀️`,
        message: `${metrics.totalTasks - metrics.completedTasks} tâches et ${metrics.totalHabits} habitudes t'attendent.`,
        tip: 'Commence par le plus important pendant que ton énergie est au max.',
        emoji: '☀️',
        mood: 'excited',
        actionLabel: 'Mes tâches',
        actionPath: '/tasks',
      },
      evening: {
        greeting: `Bonsoir ${firstName} 🌙`,
        message: 'Moment de faire le point sur ta journée.',
        tip: 'Prends 2 minutes pour noter tes réflexions.',
        emoji: '🌙',
        mood: 'calm',
        actionLabel: 'Mon journal',
        actionPath: '/journal',
      },
      all_completed: {
        greeting: `PARFAIT ${firstName} ! 🎉`,
        message: '100% de tes habitudes sont faites !',
        tip: 'Tu ES quelqu\'un de discipliné.',
        emoji: '🎉',
        mood: 'proud',
        actionLabel: 'Voir mes succès',
        actionPath: '/achievements',
      },
      overwhelmed: {
        greeting: `Respirons ensemble ${firstName} 🧘`,
        message: `${metrics.urgentTasks} tâches urgentes. Une à la fois.`,
        tip: 'Identifie les 3 plus importantes. Le reste peut attendre.',
        emoji: '🧘',
        mood: 'calm',
        actionLabel: 'Focus mode',
        actionPath: '/tasks',
      },
      building_streak: {
        greeting: `Jour ${metrics.streak} de ton streak ! ⭐`,
        message: `${metrics.completedHabits}/${metrics.totalHabits} habitudes complétées.`,
        tip: 'Chaque jour renforce tes connexions neuronales.',
        emoji: '⭐',
        mood: 'proud',
        actionLabel: 'Mes habitudes',
        actionPath: '/habits',
      },
      returning: {
        greeting: `Content de te revoir ${firstName} !`,
        message: 'Prêt pour une nouvelle session productive ?',
        emoji: '👋',
        mood: 'happy',
        actionLabel: 'C\'est parti',
        actionPath: '/dashboard',
      },
    };
    
    return fallbackMessages[userState] || fallbackMessages.returning;
  }, [dbMessages, metrics, firstName]);
  
  return sageState;
}
