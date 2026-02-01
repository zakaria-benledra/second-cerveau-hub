import { supabase } from '@/integrations/supabase/client';

export interface SageMemory {
  profile: UserProfile;
  facts: MemoryFact[];
  patterns: MemoryPattern[];
  recentFeedback: Feedback[];
}

export interface UserProfile {
  userId: string;
  northStarIdentity: string;
  values: string[];
  constraints: Record<string, unknown>;
  communicationStyle: 'direct' | 'gentle' | 'motivational' | 'analytical';
  timezone: string;
}

export interface MemoryFact {
  id: string;
  fact: string;
  category: 'preference' | 'constraint' | 'strength' | 'weakness';
  confidence: number;
  lastSeen: Date;
}

export interface MemoryPattern {
  id: string;
  pattern: string;
  evidence: string[];
  confidence: number;
  actionable: boolean;
}

export interface Feedback {
  runId: string;
  helpful: boolean;
  ignored: boolean;
  actionType: string;
  timestamp: Date;
}

export class MemoryManager {
  private userId: string;
  private cache: SageMemory | null = null;

  constructor(userId: string) {
    this.userId = userId;
  }

  async load(): Promise<SageMemory> {
    if (this.cache) return this.cache;

    const [profile, facts, patterns, feedback] = await Promise.all([
      this.loadProfile(),
      this.loadFacts(),
      this.loadPatterns(),
      this.loadRecentFeedback(),
    ]);

    this.cache = { profile, facts, patterns, recentFeedback: feedback };
    return this.cache;
  }

  private async loadProfile(): Promise<UserProfile> {
    const { data } = await supabase
      .from('sage_user_profile')
      .select('*')
      .eq('user_id', this.userId)
      .single();

    if (!data) {
      // Créer un profil par défaut
      return this.createDefaultProfile();
    }

    return {
      userId: data.user_id,
      northStarIdentity: data.north_star_identity,
      values: data.values || [],
      constraints: (data.constraints as Record<string, unknown>) || {},
      communicationStyle: (data.communication_style as UserProfile['communicationStyle']) || 'direct',
      timezone: data.timezone || 'Europe/Paris',
    };
  }

  private async loadFacts(): Promise<MemoryFact[]> {
    const { data } = await supabase
      .from('sage_memory_facts')
      .select('*')
      .eq('user_id', this.userId)
      .order('confidence', { ascending: false })
      .limit(20);

    return (data || []).map(f => ({
      id: f.id,
      fact: f.fact,
      category: f.category as MemoryFact['category'],
      confidence: Number(f.confidence),
      lastSeen: new Date(f.last_seen),
    }));
  }

  private async loadPatterns(): Promise<MemoryPattern[]> {
    const { data } = await supabase
      .from('sage_memory_patterns')
      .select('*')
      .eq('user_id', this.userId)
      .gte('confidence', 0.6)
      .order('confidence', { ascending: false })
      .limit(10);

    return (data || []).map(p => ({
      id: p.id,
      pattern: p.pattern,
      evidence: p.evidence || [],
      confidence: Number(p.confidence),
      actionable: p.actionable ?? true,
    }));
  }

  private async loadRecentFeedback(): Promise<Feedback[]> {
    const { data } = await supabase
      .from('sage_feedback')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })
      .limit(50);

    return (data || []).map(f => ({
      runId: f.run_id,
      helpful: f.helpful ?? false,
      ignored: f.ignored ?? false,
      actionType: f.action_type,
      timestamp: new Date(f.created_at),
    }));
  }

  async addFact(fact: Omit<MemoryFact, 'id'>): Promise<void> {
    await supabase.from('sage_memory_facts').insert({
      user_id: this.userId,
      fact: fact.fact,
      category: fact.category,
      confidence: fact.confidence,
      last_seen: new Date().toISOString(),
    });
    this.cache = null;
  }

  async addPattern(pattern: Omit<MemoryPattern, 'id'>): Promise<void> {
    await supabase.from('sage_memory_patterns').insert({
      user_id: this.userId,
      pattern: pattern.pattern,
      evidence: pattern.evidence,
      confidence: pattern.confidence,
      actionable: pattern.actionable,
    });
    this.cache = null;
  }

  async recordFeedback(feedback: Omit<Feedback, 'timestamp'>): Promise<void> {
    await supabase.from('sage_feedback').insert({
      user_id: this.userId,
      run_id: feedback.runId,
      helpful: feedback.helpful,
      ignored: feedback.ignored,
      action_type: feedback.actionType,
    });
    this.cache = null;
  }

  async updateProfile(updates: Partial<Omit<UserProfile, 'userId'>>): Promise<void> {
    const dbUpdates: Record<string, unknown> = {};
    
    if (updates.northStarIdentity !== undefined) {
      dbUpdates.north_star_identity = updates.northStarIdentity;
    }
    if (updates.values !== undefined) {
      dbUpdates.values = updates.values;
    }
    if (updates.constraints !== undefined) {
      dbUpdates.constraints = updates.constraints;
    }
    if (updates.communicationStyle !== undefined) {
      dbUpdates.communication_style = updates.communicationStyle;
    }
    if (updates.timezone !== undefined) {
      dbUpdates.timezone = updates.timezone;
    }

    await supabase
      .from('sage_user_profile')
      .update(dbUpdates)
      .eq('user_id', this.userId);
    
    this.cache = null;
  }

  private async createDefaultProfile(): Promise<UserProfile> {
    const defaultProfile = {
      user_id: this.userId,
      north_star_identity: 'Une personne disciplinée et épanouie',
      values: ['discipline', 'équilibre', 'progression'],
      constraints: { max_daily_tasks: 10, quiet_hours: [22, 7] },
      communication_style: 'direct' as const,
      timezone: 'Europe/Paris',
    };

    await supabase.from('sage_user_profile').insert(defaultProfile);

    return {
      userId: this.userId,
      northStarIdentity: defaultProfile.north_star_identity,
      values: defaultProfile.values,
      constraints: defaultProfile.constraints,
      communicationStyle: 'direct',
      timezone: 'Europe/Paris',
    };
  }

  // Invalide le cache pour forcer un rechargement
  invalidateCache(): void {
    this.cache = null;
  }

  // Génère un résumé textuel pour le prompt LLM
  toPromptContext(): string {
    if (!this.cache) return '';

    const { profile, facts, patterns } = this.cache;

    let context = `## PROFIL UTILISATEUR
Identité visée : ${profile.northStarIdentity}
Valeurs : ${profile.values.join(', ')}
Style de communication préféré : ${profile.communicationStyle}
`;

    if (facts.length > 0) {
      context += `\n## FAITS CONNUS
${facts.map(f => `- ${f.fact} (confiance: ${Math.round(f.confidence * 100)}%)`).join('\n')}
`;
    }

    if (patterns.length > 0) {
      context += `\n## PATTERNS DÉTECTÉS
${patterns.map(p => `- ${p.pattern} (confiance: ${Math.round(p.confidence * 100)}%)`).join('\n')}
`;
    }

    return context;
  }

  // Calcul du taux de succès des interventions récentes
  getInterventionSuccessRate(): number {
    if (!this.cache || this.cache.recentFeedback.length === 0) return 0.5;

    const helpful = this.cache.recentFeedback.filter(f => f.helpful).length;
    return helpful / this.cache.recentFeedback.length;
  }

  // Identifie les types d'actions les plus efficaces
  getMostEffectiveActionTypes(): string[] {
    if (!this.cache || this.cache.recentFeedback.length === 0) return [];

    const actionStats = new Map<string, { helpful: number; total: number }>();

    for (const feedback of this.cache.recentFeedback) {
      const stats = actionStats.get(feedback.actionType) || { helpful: 0, total: 0 };
      stats.total++;
      if (feedback.helpful) stats.helpful++;
      actionStats.set(feedback.actionType, stats);
    }

    return Array.from(actionStats.entries())
      .filter(([, stats]) => stats.total >= 3 && stats.helpful / stats.total >= 0.6)
      .sort((a, b) => (b[1].helpful / b[1].total) - (a[1].helpful / a[1].total))
      .map(([actionType]) => actionType);
  }
}
