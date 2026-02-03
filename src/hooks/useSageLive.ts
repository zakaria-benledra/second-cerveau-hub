import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTasks } from '@/hooks/useTasks';
import { useHabitsWithLogs } from '@/hooks/useHabits';
import { useTodayScore } from '@/hooks/useScores';
import { useGamificationProfile } from '@/hooks/useGamification';
import { useActiveProgram } from '@/hooks/useActiveProgram';

type SageMood = 'happy' | 'proud' | 'supportive' | 'concerned' | 'excited' | 'calm' | 'neutral' | 'focused';
type SageEnergy = 'high' | 'medium' | 'low';

interface SageState {
  greeting: string;
  message: string;
  tip?: string;
  emoji: string;
  mood: SageMood;
  energy: SageEnergy;
}

interface UserMetrics {
  name: string;
  pendingTasks: number;
  urgentTasks: number;
  overdueTasks: number;
  completedHabits: number;
  totalHabits: number;
  pendingHabits: number;
  score: number;
  streak: number;
  totalXP: number;
  hasProgram: boolean;
  programDay: number;
  programName: string;
}

// =============================================
// MESSAGES CONTEXTUELS PAR PAGE
// =============================================
function getPageMessage(page: string, m: UserMetrics): SageState {
  const hour = new Date().getHours();
  const isMorning = hour >= 5 && hour < 12;
  const isEvening = hour >= 18 || hour < 5;

  switch (page) {
    // ===== DASHBOARD =====
    case '/dashboard':
    case '/':
      if (isMorning) {
        return {
          greeting: `Bonjour ${m.name} ! ☀️`,
          message: `${m.pendingTasks} tâches et ${m.pendingHabits} habitudes t'attendent.`,
          tip: 'Commence par ton MIT (Most Important Task) pendant que ton énergie est au max.',
          emoji: '☀️',
          mood: 'excited',
          energy: 'high',
        };
      }
      if (isEvening) {
        return {
          greeting: `Bonsoir ${m.name} 🌙`,
          message: m.completedHabits === m.totalHabits && m.totalHabits > 0
            ? '100% de tes habitudes faites ! Excellente journée.'
            : `${m.completedHabits}/${m.totalHabits} habitudes complétées.`,
          tip: 'Prends 2 minutes pour écrire dans ton journal.',
          emoji: '🌙',
          mood: 'calm',
          energy: 'low',
        };
      }
      return {
        greeting: `Hey ${m.name} ! 👋`,
        message: `Score : ${m.score}%. ${m.streak > 0 ? `Streak : ${m.streak} jours 🔥` : 'Pas de streak encore.'}`,
        tip: 'Focus sur une chose à la fois.',
        emoji: '👋',
        mood: 'happy',
        energy: 'medium',
      };

    // ===== HABITS =====
    case '/habits':
      if (m.completedHabits === m.totalHabits && m.totalHabits > 0) {
        return {
          greeting: `PARFAIT ${m.name} ! 🎉`,
          message: 'Toutes tes habitudes sont complétées !',
          tip: 'Après 66 jours, une habitude devient automatique. Tu construis ta nouvelle identité.',
          emoji: '🎉',
          mood: 'proud',
          energy: 'high',
        };
      }
      if (m.streak >= 7) {
        return {
          greeting: `Streak de ${m.streak} jours ! 🔥`,
          message: `${m.completedHabits}/${m.totalHabits} habitudes faites. Continue !`,
          tip: 'Clique sur une habitude pour voir le guide scientifique complet.',
          emoji: '🔥',
          mood: 'proud',
          energy: 'high',
        };
      }
      if (m.completedHabits === 0 && m.totalHabits > 0) {
        return {
          greeting: `Hey ${m.name} 💪`,
          message: `${m.totalHabits} habitudes t'attendent. Commence par la plus facile !`,
          tip: 'Règle des 2 minutes : si ça prend moins de 2 min, fais-le maintenant.',
          emoji: '💪',
          mood: 'supportive',
          energy: 'medium',
        };
      }
      if (m.totalHabits === 0) {
        return {
          greeting: `${m.name}, crée ta première habitude ! 🌱`,
          message: 'Les habitudes sont le fondement de ta transformation.',
          tip: 'Commence par UNE seule habitude simple. La clé c\'est la régularité.',
          emoji: '🌱',
          mood: 'excited',
          energy: 'medium',
        };
      }
      return {
        greeting: `Belle progression ${m.name} ! ⭐`,
        message: `${m.completedHabits}/${m.totalHabits} habitudes complétées.`,
        tip: 'Clique sur une habitude pour voir le guide complet avec la science derrière.',
        emoji: '⭐',
        mood: 'happy',
        energy: 'medium',
      };

    // ===== TASKS =====
    case '/tasks':
      if (m.urgentTasks > 3) {
        return {
          greeting: `Respirons ${m.name} 🧘`,
          message: `${m.urgentTasks} tâches urgentes. C'est beaucoup.`,
          tip: 'Méthode des 3 MIT : identifie les 3 VRAIMENT importantes. Le reste peut attendre.',
          emoji: '🧘',
          mood: 'calm',
          energy: 'low',
        };
      }
      if (m.pendingTasks === 0) {
        return {
          greeting: `Inbox Zero ${m.name} ! 🎯`,
          message: 'Aucune tâche en attente. Tu gères !',
          tip: 'C\'est le moment idéal pour planifier demain ou travailler sur un projet important.',
          emoji: '🎯',
          mood: 'proud',
          energy: 'high',
        };
      }
      if (m.overdueTasks > 0) {
        return {
          greeting: `${m.name}, faisons le point 📋`,
          message: `${m.overdueTasks} tâche(s) en retard.`,
          tip: 'Soit tu les fais maintenant, soit tu les reportes. L\'important c\'est de décider.',
          emoji: '📋',
          mood: 'concerned',
          energy: 'medium',
        };
      }
      return {
        greeting: `Let's go ${m.name} ! 🚀`,
        message: `${m.pendingTasks} tâches en attente.`,
        tip: 'Clique sur une tâche pour voir les détails et le guide.',
        emoji: '🚀',
        mood: 'excited',
        energy: 'high',
      };

    // ===== JOURNAL =====
    case '/journal':
      if (isEvening) {
        return {
          greeting: `Moment de réflexion ${m.name} 📝`,
          message: 'L\'écriture est une forme de méditation.',
          tip: 'Écrire 3 gratitudes augmente le bonheur de 25% (Dr Robert Emmons, UC Davis).',
          emoji: '📝',
          mood: 'calm',
          energy: 'low',
        };
      }
      return {
        greeting: `${m.name}, exprime-toi 💭`,
        message: 'Ton journal est un espace sans jugement.',
        tip: 'L\'écriture expressive réduit le stress et améliore la clarté mentale.',
        emoji: '💭',
        mood: 'supportive',
        energy: 'medium',
      };

    // ===== FINANCE =====
    case '/finance':
      return {
        greeting: `Parlons finances ${m.name} 💰`,
        message: 'La clarté financière apporte la sérénité.',
        tip: 'Règle 50/30/20 : 50% besoins, 30% envies, 20% épargne.',
        emoji: '💰',
        mood: 'focused',
        energy: 'medium',
      };

    // ===== PROGRAM =====
    case '/program':
      if (m.hasProgram) {
        return {
          greeting: `Jour ${m.programDay} ${m.name} ! 🎯`,
          message: `Tu progresses dans "${m.programName}".`,
          tip: 'Chaque jour compte. La constance bat l\'intensité.',
          emoji: '🎯',
          mood: 'proud',
          energy: 'high',
        };
      }
      return {
        greeting: `Prêt à te transformer ${m.name} ? 🚀`,
        message: 'Choisis un programme pour commencer ton parcours.',
        tip: 'Un programme structure ta progression avec des habitudes et tâches scientifiquement conçues.',
        emoji: '🚀',
        mood: 'excited',
        energy: 'high',
      };

    // ===== KANBAN =====
    case '/kanban':
      return {
        greeting: `Vue Kanban ${m.name} 📊`,
        message: `${m.pendingTasks} tâches à organiser.`,
        tip: 'Glisse-dépose tes tâches pour les réorganiser. Simple et visuel.',
        emoji: '📊',
        mood: 'focused',
        energy: 'medium',
      };

    // ===== GOALS =====
    case '/goals':
      return {
        greeting: `Tes objectifs ${m.name} 🎯`,
        message: 'Les objectifs donnent une direction à tes actions.',
        tip: 'Objectifs SMART : Spécifiques, Mesurables, Atteignables, Réalistes, Temporels.',
        emoji: '🎯',
        mood: 'focused',
        energy: 'medium',
      };

    // ===== ACHIEVEMENTS =====
    case '/achievements':
      return {
        greeting: `Tes victoires ${m.name} 🏆`,
        message: m.totalXP > 0 ? `${m.totalXP} XP accumulés !` : 'Tes accomplissements apparaîtront ici.',
        tip: 'Célébrer ses succès renforce la motivation intrinsèque.',
        emoji: '🏆',
        mood: 'proud',
        energy: 'high',
      };

    // ===== SETTINGS =====
    case '/settings':
      return {
        greeting: `Configuration ${m.name} ⚙️`,
        message: 'Personnalise ton expérience.',
        tip: 'Plus tu personnalises, plus Sage peut t\'aider efficacement.',
        emoji: '⚙️',
        mood: 'neutral',
        energy: 'low',
      };

    // ===== SCORES =====
    case '/scores':
      return {
        greeting: `Tes scores ${m.name} 📈`,
        message: `Score global : ${m.score}%`,
        tip: 'Le score reflète ta régularité sur les habitudes, tâches et journal.',
        emoji: '📈',
        mood: m.score >= 70 ? 'proud' : m.score >= 40 ? 'supportive' : 'concerned',
        energy: 'medium',
      };

    // ===== DEFAULT =====
    default:
      return {
        greeting: `Hey ${m.name} ! 🧠`,
        message: 'Je suis là pour t\'accompagner.',
        tip: 'N\'hésite pas à explorer les différentes fonctionnalités.',
        emoji: '🧠',
        mood: 'neutral',
        energy: 'medium',
      };
  }
}

// =============================================
// HOOK PRINCIPAL
// =============================================
export function useSageLive() {
  const location = useLocation();
  const { data: profile } = useUserProfile();
  const { data: tasks = [] } = useTasks();
  const { data: habits = [] } = useHabitsWithLogs();
  const { data: scores } = useTodayScore();
  const { data: gamification } = useGamificationProfile();
  const { data: program } = useActiveProgram();
  
  const firstName = profile?.first_name || profile?.display_name?.split(' ')[0] || 'toi';
  
  // Extraire le chemin de base (ex: /habits/123 -> /habits)
  const basePath = '/' + (location.pathname.split('/')[1] || 'dashboard');
  
  // Calculer les métriques
  const metrics = useMemo((): UserMetrics => {
    const activeHabits = habits.filter((h: any) => h.is_active);
    const pendingTasks = tasks.filter(t => t.status !== 'done').length;
    const urgentTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'done').length;
    const overdueTasks = tasks.filter(t => {
      if (!t.due_date || t.status === 'done') return false;
      const dueDate = new Date(t.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return dueDate < today;
    }).length;
    const completedHabits = activeHabits.filter((h: any) => h.todayLog?.completed).length;
    const totalHabits = activeHabits.length;
    const pendingHabits = totalHabits - completedHabits;
    const score = scores?.global_score || 0;
    const streak = gamification?.current_streak || 0;
    const totalXP = gamification?.total_xp || 0;
    
    // Info programme
    const prog = program as any;
    const hasProgram = !!(prog?.id || prog?.program_id);
    const programDay = prog?.current_day || 0;
    const programName = prog?.programs?.name || prog?.title || '';
    
    return {
      name: firstName,
      pendingTasks,
      urgentTasks,
      overdueTasks,
      completedHabits,
      totalHabits,
      pendingHabits,
      score,
      streak,
      totalXP,
      hasProgram,
      programDay,
      programName,
    };
  }, [tasks, habits, scores, gamification, program, firstName]);
  
  // Obtenir le message contextuel pour la page
  const sageState = useMemo(() => {
    return getPageMessage(basePath, metrics);
  }, [basePath, metrics]);
  
  return sageState;
}
