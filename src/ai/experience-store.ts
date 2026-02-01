import { supabase } from '@/integrations/supabase/client';
import { ActionType, PolicyWeights } from './policy-engine';

export interface Experience {
  id: string;
  userId: string;
  contextVector: number[];
  action: ActionType;
  reward: number;
  metricsBefore: Record<string, number>;
  metricsAfter: Record<string, number>;
  timestamp: Date;
}

export class ExperienceStore {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async saveExperience(exp: Omit<Experience, 'id' | 'userId' | 'timestamp'>): Promise<void> {
    await supabase.from('sage_experiences').insert({
      user_id: this.userId,
      context_vector: exp.contextVector,
      action_type: exp.action,
      reward: exp.reward,
      metrics_before: exp.metricsBefore,
      metrics_after: exp.metricsAfter,
    });
  }

  async loadExperiences(limit: number = 1000): Promise<Experience[]> {
    const { data } = await supabase
      .from('sage_experiences')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return (data || []).map(e => ({
      id: e.id,
      userId: e.user_id,
      contextVector: (e.context_vector || []) as number[],
      action: e.action_type as ActionType,
      reward: Number(e.reward),
      metricsBefore: (e.metrics_before as Record<string, number>) || {},
      metricsAfter: (e.metrics_after as Record<string, number>) || {},
      timestamp: new Date(e.created_at),
    }));
  }

  async loadWeights(): Promise<PolicyWeights | null> {
    const { data } = await supabase
      .from('sage_policy_weights')
      .select('*')
      .eq('user_id', this.userId);

    if (!data || data.length === 0) return null;

    const weights: PolicyWeights = {};
    for (const row of data) {
      weights[row.action_type] = (row.weights || []) as number[];
    }
    return weights;
  }

  async saveWeights(weights: PolicyWeights): Promise<void> {
    for (const [action, w] of Object.entries(weights)) {
      await supabase
        .from('sage_policy_weights')
        .upsert({
          user_id: this.userId,
          action_type: action,
          weights: w,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,action_type',
        });
    }
  }

  // Supprimer les anciennes expériences pour limiter la taille
  async pruneOldExperiences(keepLast: number = 500): Promise<number> {
    const { data: experiences } = await supabase
      .from('sage_experiences')
      .select('id, created_at')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false });

    if (!experiences || experiences.length <= keepLast) return 0;

    const toDelete = experiences.slice(keepLast).map(e => e.id);
    
    const { error } = await supabase
      .from('sage_experiences')
      .delete()
      .in('id', toDelete);

    return error ? 0 : toDelete.length;
  }

  // Obtenir les statistiques des expériences
  async getStats(): Promise<{
    totalExperiences: number;
    averageReward: number;
    actionDistribution: Record<string, number>;
    recentTrend: number;
  }> {
    const experiences = await this.loadExperiences(100);

    if (experiences.length === 0) {
      return {
        totalExperiences: 0,
        averageReward: 0,
        actionDistribution: {},
        recentTrend: 0,
      };
    }

    const totalReward = experiences.reduce((sum, e) => sum + e.reward, 0);
    const averageReward = totalReward / experiences.length;

    const actionDistribution: Record<string, number> = {};
    for (const exp of experiences) {
      actionDistribution[exp.action] = (actionDistribution[exp.action] || 0) + 1;
    }

    // Calculer la tendance récente (compare les 20 derniers aux 20 précédents)
    const recent = experiences.slice(0, 20);
    const older = experiences.slice(20, 40);
    
    const recentAvg = recent.length > 0 
      ? recent.reduce((sum, e) => sum + e.reward, 0) / recent.length 
      : 0;
    const olderAvg = older.length > 0 
      ? older.reduce((sum, e) => sum + e.reward, 0) / older.length 
      : recentAvg;

    const recentTrend = olderAvg !== 0 ? (recentAvg - olderAvg) / Math.abs(olderAvg) : 0;

    return {
      totalExperiences: experiences.length,
      averageReward,
      actionDistribution,
      recentTrend,
    };
  }

  // Replay des expériences pour évaluer une nouvelle politique
  evaluatePolicy(experiences: Experience[], weights: PolicyWeights): number {
    let totalReward = 0;
    let count = 0;

    for (const exp of experiences) {
      // Simuler ce que la politique aurait choisi
      let bestAction = '';
      let bestScore = -Infinity;

      for (const [action, w] of Object.entries(weights)) {
        const score = exp.contextVector.reduce((sum, c, i) => sum + c * (w[i] || 0), 0);
        if (score > bestScore) {
          bestScore = score;
          bestAction = action;
        }
      }

      // Si la politique aurait choisi la même action, compter le reward
      if (bestAction === exp.action) {
        totalReward += exp.reward;
        count++;
      }
    }

    return count > 0 ? totalReward / count : 0;
  }

  // Calculer le counterfactual regret (pour analyse)
  calculateRegret(experiences: Experience[], weights: PolicyWeights): number {
    let regret = 0;

    for (const exp of experiences) {
      // Trouver le meilleur score possible
      let bestScore = -Infinity;
      for (const w of Object.values(weights)) {
        const score = exp.contextVector.reduce((sum, c, i) => sum + c * (w[i] || 0), 0);
        bestScore = Math.max(bestScore, score);
      }

      // Score de l'action choisie
      const chosenWeights = weights[exp.action] || [];
      const chosenScore = exp.contextVector.reduce((sum, c, i) => sum + c * (chosenWeights[i] || 0), 0);

      regret += bestScore - chosenScore;
    }

    return experiences.length > 0 ? regret / experiences.length : 0;
  }
}
