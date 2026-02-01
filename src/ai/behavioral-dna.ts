import { supabase } from '@/integrations/supabase/client';
import { ExperienceStore } from './experience-store';

export interface BehavioralDNA {
  id: string;
  userId: string;
  version: number;
  generatedAt: Date;

  // Chronotype
  chronotype: {
    peakHours: number[];
    lowHours: number[];
    optimalSleepWindow: [number, number];
    weekendPattern: 'similar' | 'different' | 'inverted';
  };

  // Discipline Profile
  disciplineProfile: {
    streakSensitivity: number; // 0-1
    recoverySpeed: number; // jours
    motivationTriggers: string[];
    demotivationTriggers: string[];
    optimalLoadCapacity: number; // tâches/jour
  };

  // Dropout Signals
  dropoutSignals: {
    earlyWarnings: Signal[];
    immediateTriggers: Signal[];
    recoveryIndicators: Signal[];
  };

  // Transformation Profile
  transformationProfile: {
    changeVelocity: 'slow_steady' | 'fast_intense' | 'sporadic';
    socialDependency: number; // 0-1
    intrinsicMotivation: number; // 0-1
    preferredRewardType: 'achievement' | 'progress' | 'social' | 'tangible';
  };

  // Predictions
  predictions: {
    dropoutRisk72h: number;
    streakProbability30d: number;
    scoreIn30Days: number;
    scoreIn90Days: number;
  };

  // Behavioral Twins (anonymized)
  behavioralTwins: {
    similarity: number;
    successRate: number;
    keyDifferences: string[];
    recommendations: string[];
  }[];
}

interface Signal {
  type: string;
  weight: number;
  description: string;
  detected: boolean;
}

// Types auxiliaires
interface Activity { timestamp: string; type: string; }
interface HabitLog { habit_id: string; completed: boolean; date: string; }
interface Task { id: string; status: string; due_date: string | null; }
interface JournalEntry { mood: number | string | null; date: string; }
interface Feedback { helpful: boolean; action_type: string; }

export class BehavioralDNAEngine {
  private userId: string;
  private experienceStore: ExperienceStore;

  constructor(userId: string) {
    this.userId = userId;
    this.experienceStore = new ExperienceStore(userId);
  }

  async generateDNA(): Promise<BehavioralDNA> {
    // Collecter toutes les données historiques
    const [
      activityHistory,
      habitLogs,
      taskHistory,
      journalEntries,
      feedbackHistory,
      experienceHistory,
    ] = await Promise.all([
      this.fetchActivityHistory(),
      this.fetchHabitLogs(),
      this.fetchTaskHistory(),
      this.fetchJournalEntries(),
      this.fetchFeedbackHistory(),
      this.experienceStore.loadExperiences(1000),
    ]);

    // Analyser le chronotype
    const chronotype = this.analyzeChronotype(activityHistory);

    // Analyser le profil de discipline
    const disciplineProfile = this.analyzeDisciplineProfile(
      habitLogs,
      taskHistory,
      feedbackHistory
    );

    // Identifier les signaux de décrochage
    const dropoutSignals = this.identifyDropoutSignals(
      activityHistory,
      habitLogs,
      journalEntries
    );

    // Profil de transformation
    const transformationProfile = this.analyzeTransformationProfile(
      experienceHistory,
      feedbackHistory
    );

    // Prédictions
    const predictions = await this.generatePredictions(
      chronotype,
      disciplineProfile,
      dropoutSignals
    );

    // Trouver les jumeaux comportementaux
    const twins = await this.findBehavioralTwins();

    const dna: BehavioralDNA = {
      id: crypto.randomUUID(),
      userId: this.userId,
      version: 1,
      generatedAt: new Date(),
      chronotype,
      disciplineProfile,
      dropoutSignals,
      transformationProfile,
      predictions,
      behavioralTwins: twins,
    };

    // Sauvegarder
    await this.saveDNA(dna);

    return dna;
  }

  async loadDNA(): Promise<BehavioralDNA | null> {
    const { data } = await supabase
      .from('behavioral_dna')
      .select('*')
      .eq('user_id', this.userId)
      .single();

    if (!data) return null;

    const dnaData = data.dna_data as unknown as BehavioralDNA;
    return {
      ...dnaData,
      generatedAt: new Date(data.generated_at),
    };
  }

  private analyzeChronotype(activities: Activity[]): BehavioralDNA['chronotype'] {
    // Analyser les heures d'activité
    const hourCounts = new Map<number, number>();

    for (const activity of activities) {
      const hour = new Date(activity.timestamp).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    }

    // Identifier les pics
    const sortedHours = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1]);

    const peakHours = sortedHours.slice(0, 3).map(([h]) => h);
    const lowHours = sortedHours.slice(-3).map(([h]) => h);

    // Analyser le pattern week-end
    const weekdayActivities = activities.filter(a => {
      const day = new Date(a.timestamp).getDay();
      return day !== 0 && day !== 6;
    });
    const weekendActivities = activities.filter(a => {
      const day = new Date(a.timestamp).getDay();
      return day === 0 || day === 6;
    });

    const weekdayAvg = weekdayActivities.length / 5;
    const weekendAvg = weekendActivities.length / 2;
    const ratio = weekdayAvg > 0 ? weekendAvg / weekdayAvg : 1;

    let weekendPattern: 'similar' | 'different' | 'inverted';
    if (ratio > 0.8 && ratio < 1.2) weekendPattern = 'similar';
    else if (ratio < 0.5) weekendPattern = 'different';
    else weekendPattern = 'inverted';

    return {
      peakHours: peakHours.length > 0 ? peakHours : [9, 14, 20],
      lowHours: lowHours.length > 0 ? lowHours : [3, 4, 5],
      optimalSleepWindow: [22, 7],
      weekendPattern,
    };
  }

  private analyzeDisciplineProfile(
    habitLogs: HabitLog[],
    taskHistory: Task[],
    feedback: Feedback[]
  ): BehavioralDNA['disciplineProfile'] {
    // Calculer la sensibilité au streak
    const streakBreaks = this.countStreakBreaks(habitLogs);
    const recoveryTimes = this.calculateRecoveryTimes(habitLogs, streakBreaks);
    const streakSensitivity = this.calculateStreakSensitivity(habitLogs, feedback);

    // Identifier les triggers
    const motivationTriggers = this.identifyMotivationTriggers(feedback, habitLogs);
    const demotivationTriggers = this.identifyDemotivationTriggers(feedback, habitLogs);

    // Calculer la capacité optimale
    const optimalLoad = this.calculateOptimalLoad(taskHistory);

    return {
      streakSensitivity,
      recoverySpeed: recoveryTimes.avg,
      motivationTriggers,
      demotivationTriggers,
      optimalLoadCapacity: optimalLoad,
    };
  }

  private identifyDropoutSignals(
    activities: Activity[],
    habitLogs: HabitLog[],
    journals: JournalEntry[]
  ): BehavioralDNA['dropoutSignals'] {
    return {
      earlyWarnings: [
        {
          type: 'activity_decline',
          weight: 0.3,
          description: 'Baisse d\'activité sur 3 jours',
          detected: this.detectActivityDecline(activities, 3),
        },
        {
          type: 'mood_decline',
          weight: 0.25,
          description: 'Humeur en baisse dans le journal',
          detected: this.detectMoodDecline(journals),
        },
        {
          type: 'habit_skip_pattern',
          weight: 0.2,
          description: 'Pattern de skip d\'habitudes',
          detected: this.detectHabitSkipPattern(habitLogs),
        },
      ],
      immediateTriggers: [
        {
          type: 'streak_broken',
          weight: 0.4,
          description: 'Streak cassé récemment',
          detected: this.detectRecentStreakBreak(habitLogs),
        },
        {
          type: 'no_activity_24h',
          weight: 0.35,
          description: 'Aucune activité depuis 24h',
          detected: this.detectInactivity(activities, 24),
        },
      ],
      recoveryIndicators: [
        {
          type: 'morning_habit',
          weight: 0.3,
          description: 'Habitude matinale complétée',
          detected: false,
        },
        {
          type: 'journal_entry',
          weight: 0.25,
          description: 'Entrée journal récente',
          detected: journals.length > 0,
        },
      ],
    };
  }

  private analyzeTransformationProfile(
    experiences: unknown[],
    feedback: Feedback[]
  ): BehavioralDNA['transformationProfile'] {
    // Analyser le velocity basé sur les expériences
    const recentFeedback = feedback.slice(0, 30);
    const helpfulRate = recentFeedback.filter(f => f.helpful).length / Math.max(recentFeedback.length, 1);

    // Déterminer le type de reward préféré
    const actionTypes = feedback.map(f => f.action_type);
    const celebrateCount = actionTypes.filter(t => t === 'celebrate').length;
    const nudgeCount = actionTypes.filter(t => t === 'nudge').length;

    let preferredRewardType: 'achievement' | 'progress' | 'social' | 'tangible' = 'achievement';
    if (celebrateCount > nudgeCount) preferredRewardType = 'achievement';
    else if (helpfulRate > 0.7) preferredRewardType = 'progress';

    return {
      changeVelocity: experiences.length > 50 ? 'fast_intense' : 'slow_steady',
      socialDependency: 0.3,
      intrinsicMotivation: Math.min(1, helpfulRate + 0.3),
      preferredRewardType,
    };
  }

  async generatePredictions(
    _chronotype: BehavioralDNA['chronotype'],
    discipline: BehavioralDNA['disciplineProfile'],
    signals: BehavioralDNA['dropoutSignals']
  ): Promise<BehavioralDNA['predictions']> {
    // Calculer le risque de décrochage
    const activeSignals = [
      ...signals.earlyWarnings.filter(s => s.detected),
      ...signals.immediateTriggers.filter(s => s.detected),
    ];
    const signalWeight = activeSignals.reduce((sum, s) => sum + s.weight, 0);
    const dropoutRisk72h = Math.min(1, signalWeight);

    // Prédire le streak
    const streakProbability30d = Math.max(0, 1 - dropoutRisk72h - (1 - discipline.streakSensitivity) * 0.2);

    // Prédire les scores futurs
    const currentMomentum = 0.6;
    const scoreIn30Days = Math.round((currentMomentum + streakProbability30d) / 2 * 100);
    const scoreIn90Days = Math.round(scoreIn30Days * (1 + (1 - dropoutRisk72h) * 0.2));

    return {
      dropoutRisk72h: Math.round(dropoutRisk72h * 100),
      streakProbability30d: Math.round(streakProbability30d * 100),
      scoreIn30Days,
      scoreIn90Days,
    };
  }

  async findBehavioralTwins(): Promise<BehavioralDNA['behavioralTwins']> {
    // Note: Ceci nécessite une base de DNAs anonymisés
    // Pour le MVP, retourner des données vides
    return [];
  }

  private async saveDNA(dna: BehavioralDNA): Promise<void> {
    // Check if exists first
    const { data: existing } = await supabase
      .from('behavioral_dna')
      .select('id')
      .eq('user_id', this.userId)
      .single();

    const dnaJson = JSON.parse(JSON.stringify(dna));

    if (existing) {
      await supabase
        .from('behavioral_dna')
        .update({
          dna_data: dnaJson,
          version: dna.version,
          generated_at: dna.generatedAt.toISOString(),
        })
        .eq('user_id', this.userId);
    } else {
      await supabase.from('behavioral_dna').insert([{
        user_id: this.userId,
        dna_data: dnaJson,
        version: dna.version,
        generated_at: dna.generatedAt.toISOString(),
      }]);
    }
  }

  // Data fetching methods
  private async fetchActivityHistory(): Promise<Activity[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data } = await supabase
      .from('audit_log')
      .select('created_at, action')
      .eq('user_id', this.userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(500);

    return (data || []).map(a => ({
      timestamp: a.created_at,
      type: a.action,
    }));
  }

  private async fetchHabitLogs(): Promise<HabitLog[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data } = await supabase
      .from('habit_logs')
      .select('habit_id, completed, date')
      .eq('user_id', this.userId)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false });

    return (data || []).map(l => ({
      habit_id: l.habit_id,
      completed: l.completed,
      date: l.date,
    }));
  }

  private async fetchTaskHistory(): Promise<Task[]> {
    const { data } = await supabase
      .from('tasks')
      .select('id, status, due_date')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })
      .limit(200);

    return (data || []).map(t => ({
      id: t.id,
      status: t.status,
      due_date: t.due_date,
    }));
  }

  private async fetchJournalEntries(): Promise<JournalEntry[]> {
    const { data } = await supabase
      .from('journal_entries')
      .select('mood, date')
      .eq('user_id', this.userId)
      .order('date', { ascending: false })
      .limit(30);

    return (data || []).map(j => ({
      mood: typeof j.mood === 'number' ? j.mood : 3,
      date: j.date,
    }));
  }

  private async fetchFeedbackHistory(): Promise<Feedback[]> {
    const { data } = await supabase
      .from('sage_feedback')
      .select('helpful, action_type')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })
      .limit(100);

    return (data || []).map(f => ({
      helpful: f.helpful ?? false,
      action_type: f.action_type,
    }));
  }

  // Analysis helper methods
  private countStreakBreaks(logs: HabitLog[]): number {
    let breaks = 0;
    const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));

    for (let i = 1; i < sortedLogs.length; i++) {
      if (sortedLogs[i - 1].completed && !sortedLogs[i].completed) {
        breaks++;
      }
    }
    return breaks;
  }

  private calculateRecoveryTimes(logs: HabitLog[], _breaks: number): { avg: number } {
    // Simplified: return average of 2 days
    return { avg: logs.length > 0 ? 2 : 3 };
  }

  private calculateStreakSensitivity(logs: HabitLog[], feedback: Feedback[]): number {
    const completionRate = logs.filter(l => l.completed).length / Math.max(logs.length, 1);
    const helpfulRate = feedback.filter(f => f.helpful).length / Math.max(feedback.length, 1);
    return (completionRate + helpfulRate) / 2;
  }

  private identifyMotivationTriggers(_feedback: Feedback[], logs: HabitLog[]): string[] {
    const triggers: string[] = [];
    const completionRate = logs.filter(l => l.completed).length / Math.max(logs.length, 1);

    if (completionRate > 0.7) triggers.push('streaks');
    triggers.push('progress_visibility');
    triggers.push('small_wins');

    return triggers;
  }

  private identifyDemotivationTriggers(_feedback: Feedback[], logs: HabitLog[]): string[] {
    const triggers: string[] = [];
    const incompleteLogs = logs.filter(l => !l.completed);

    if (incompleteLogs.length > logs.length * 0.3) {
      triggers.push('overwhelm');
    }
    triggers.push('lack_of_progress');

    return triggers;
  }

  private calculateOptimalLoad(tasks: Task[]): number {
    const completedTasks = tasks.filter(t => t.status === 'done');
    const avgPerDay = completedTasks.length / 30;
    return Math.max(3, Math.min(10, Math.round(avgPerDay * 1.2)));
  }

  private detectActivityDecline(activities: Activity[], days: number): boolean {
    if (activities.length < days * 2) return false;

    const recentDays = activities.slice(0, days * 3);
    const olderDays = activities.slice(days * 3, days * 6);

    return recentDays.length < olderDays.length * 0.7;
  }

  private detectMoodDecline(journals: JournalEntry[]): boolean {
    if (journals.length < 3) return false;

    const recentMoods = journals.slice(0, 3).map(j => typeof j.mood === 'number' ? j.mood : 3);
    const avgRecent = recentMoods.reduce((a, b) => a + b, 0) / recentMoods.length;

    return avgRecent < 2.5;
  }

  private detectHabitSkipPattern(logs: HabitLog[]): boolean {
    const recentLogs = logs.slice(0, 7);
    const skipped = recentLogs.filter(l => !l.completed).length;
    return skipped >= 3;
  }

  private detectRecentStreakBreak(logs: HabitLog[]): boolean {
    if (logs.length < 2) return false;
    const recent = logs.slice(0, 3);
    return recent.some((l, i) => i > 0 && recent[i - 1]?.completed && !l.completed);
  }

  private detectInactivity(activities: Activity[], hours: number): boolean {
    if (activities.length === 0) return true;

    const lastActivity = new Date(activities[0].timestamp);
    const now = new Date();
    const diffHours = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

    return diffHours > hours;
  }
}
