// src/ai/learning-loop.ts
// Orchestration de l'apprentissage comportemental — v35

import { supabase } from '@/integrations/supabase/client';
import { getCanonicalMetrics, metricsToVector, type CanonicalMetrics } from '@/domain/metrics/canonical';
import type { Json } from '@/integrations/supabase/types';

export type FeedbackType = 'accepted' | 'rejected' | 'ignored';

export interface ConsentSnapshot {
  ai_profiling: boolean;
  behavioral_tracking: boolean;
  policy_learning: boolean;
  data_export: boolean;
}

interface RewardContext {
  accepted: boolean;
  rejected: boolean;
  ignored: boolean;
  completed: boolean;
  metricsBefore: Partial<CanonicalMetrics>;
  metricsAfter: Partial<CanonicalMetrics>;
  dataQuality: number;
}

function clamp(x: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, x));
}

function computeReward(ctx: RewardContext): number {
  let reward = 0;
  
  // Feedback immédiat (30%)
  if (ctx.accepted) reward += 1.0;
  if (ctx.completed) reward += 2.0;
  if (ctx.rejected) reward -= 2.0;
  if (ctx.ignored) reward -= 1.0;
  
  // Impact mesuré (70%)
  if (ctx.metricsAfter && ctx.metricsBefore) {
    const dm = (ctx.metricsAfter.momentum_index ?? 0) - (ctx.metricsBefore.momentum_index ?? 0);
    const dor = (ctx.metricsAfter.task_overdue_ratio ?? 0) - (ctx.metricsBefore.task_overdue_ratio ?? 0);
    const dh = (ctx.metricsAfter.habits_rate_7d ?? 0) - (ctx.metricsBefore.habits_rate_7d ?? 0);
    
    reward += clamp(dm, -1, 1) * 1.5;
    reward += clamp(-dor, -1, 1) * 1.8;
    reward += clamp(dh, -1, 1) * 1.2;
  }
  
  const qualityFactor = clamp(ctx.dataQuality, 0.25, 1.0);
  reward *= qualityFactor;
  
  return clamp(reward, -5, 5);
}

/**
 * Vérifie si l'apprentissage est activé pour l'utilisateur
 */
async function getConsentSnapshot(userId: string): Promise<ConsentSnapshot> {
  const { data } = await supabase
    .from('user_consents')
    .select('purpose, granted')
    .eq('user_id', userId);
  
  const consents = data || [];
  
  return {
    ai_profiling: consents.find(c => c.purpose === 'ai_profiling')?.granted ?? false,
    behavioral_tracking: consents.find(c => c.purpose === 'behavioral_tracking')?.granted ?? false,
    policy_learning: consents.find(c => c.purpose === 'policy_learning')?.granted ?? false,
    data_export: consents.find(c => c.purpose === 'data_export')?.granted ?? false,
  };
}

function isLearningEnabled(consent: ConsentSnapshot): boolean {
  return consent.ai_profiling && consent.policy_learning;
}

export class LearningLoop {
  private userId: string;
  
  constructor(userId: string) {
    this.userId = userId;
  }
  
  /**
   * Enregistre le feedback utilisateur et prépare l'expérience pour apprentissage différé
   */
  async recordFeedback(runId: string, feedback: FeedbackType): Promise<boolean> {
    try {
      // 1. Vérifier consentement
      const consent = await getConsentSnapshot(this.userId);
      
      if (!isLearningEnabled(consent)) {
        console.log('[LearningLoop] Learning disabled by consent, skipping');
        return false;
      }
      
      // 2. Récupérer le run original
      const { data: run, error: runError } = await supabase
        .from('sage_runs')
        .select('id, action_type, confidence, reasoning')
        .eq('id', runId)
        .eq('user_id', this.userId)
        .single();
      
      if (runError || !run) {
        console.error('[LearningLoop] Run not found:', runId);
        return false;
      }
      
      // 3. Capturer métriques "before"
      const metricsBefore = await getCanonicalMetrics(this.userId);
      const contextVector = metricsToVector(metricsBefore);
      
      // 4. Sauvegarder le feedback
      await supabase.from('sage_feedback').insert([{
        user_id: this.userId,
        run_id: runId,
        helpful: feedback === 'accepted',
        ignored: feedback === 'ignored',
        action_type: run.action_type,
      }]);
      
      // 5. Créer l'expérience (reward sera calculé par job nightly)
      await supabase.from('sage_experiences').insert([{
        user_id: this.userId,
        context_vector: contextVector,
        action_type: run.action_type,
        metrics_before: JSON.parse(JSON.stringify(metricsBefore)) as Json,
      }]);
      
      console.log('[LearningLoop] Feedback recorded:', { runId, feedback });
      return true;
      
    } catch (error) {
      console.error('[LearningLoop] Error recording feedback:', error);
      return false;
    }
  }
  
  /**
   * Traite l'apprentissage différé (appelé par job nightly)
   */
  async processDelayedLearning(experienceId: string): Promise<boolean> {
    try {
      // 1. Vérifier consentement ACTUEL
      const consent = await getConsentSnapshot(this.userId);
      
      if (!isLearningEnabled(consent)) {
        console.log('[LearningLoop] Consent withdrawn, skipping learning');
        return false;
      }
      
      // 2. Récupérer l'expérience
      const { data: exp, error } = await supabase
        .from('sage_experiences')
        .select('*')
        .eq('id', experienceId)
        .eq('user_id', this.userId)
        .single();
      
      if (error || !exp) {
        console.error('[LearningLoop] Experience not found:', experienceId);
        return false;
      }
      
      if (exp.reward !== null) {
        console.log('[LearningLoop] Experience already processed');
        return true;
      }
      
      // 3. Capturer métriques "after"
      const metricsAfter = await getCanonicalMetrics(this.userId);
      
      // 4. Récupérer le feedback associé
      const { data: feedbackData } = await supabase
        .from('sage_feedback')
        .select('helpful, ignored')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      // 5. Calculer reward
      const rewardCtx: RewardContext = {
        accepted: feedbackData?.helpful === true,
        rejected: feedbackData?.helpful === false && !feedbackData?.ignored,
        ignored: feedbackData?.ignored === true,
        completed: feedbackData?.helpful === true,
        metricsBefore: (exp.metrics_before as Partial<CanonicalMetrics>) || {},
        metricsAfter: metricsAfter,
        dataQuality: metricsAfter.data_quality,
      };
      
      const reward = computeReward(rewardCtx);
      
      // 6. Mettre à jour l'expérience
      await supabase.from('sage_experiences')
        .update({
          metrics_after: JSON.parse(JSON.stringify(metricsAfter)) as Json,
          reward: reward,
        })
        .eq('id', experienceId)
        .eq('user_id', this.userId);
      
      // 7. Mettre à jour les poids (si apprentissage actif)
      const contextVector = (exp.context_vector as number[]) || [];
      await this.updatePolicyWeights(
        contextVector,
        exp.action_type,
        reward,
        consent
      );
      
      console.log('[LearningLoop] Learning processed:', { experienceId, reward });
      return true;
      
    } catch (error) {
      console.error('[LearningLoop] Error processing learning:', error);
      return false;
    }
  }
  
  private async updatePolicyWeights(
    contextVector: number[],
    actionType: string,
    reward: number,
    consent: ConsentSnapshot
  ): Promise<void> {
    if (!isLearningEnabled(consent)) return;
    
    const learningRate = 0.05;
    
    // Charger les poids actuels
    const { data: weightsData } = await supabase
      .from('sage_policy_weights')
      .select('action_type, weights')
      .eq('user_id', this.userId)
      .eq('action_type', actionType)
      .maybeSingle();
    
    let weights: number[] = (weightsData?.weights as number[]) || [];
    
    // Initialiser si nécessaire
    if (weights.length === 0) {
      weights = new Array(contextVector.length).fill(0).map(() => (Math.random() - 0.5) * 0.1);
    }
    
    // Mise à jour gradient descent
    for (let i = 0; i < weights.length && i < contextVector.length; i++) {
      weights[i] += learningRate * reward * contextVector[i];
    }
    
    // Sauvegarder
    await supabase.from('sage_policy_weights').upsert({
      user_id: this.userId,
      action_type: actionType,
      weights: weights,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,action_type',
    });
  }
  
  /**
   * Récupère les stats d'apprentissage pour l'utilisateur
   */
  async getLearningStats(): Promise<{
    totalExperiences: number;
    processedExperiences: number;
    averageReward: number;
    learningEnabled: boolean;
  }> {
    const consent = await getConsentSnapshot(this.userId);
    
    const { data: experiences } = await supabase
      .from('sage_experiences')
      .select('reward')
      .eq('user_id', this.userId);
    
    const total = experiences?.length || 0;
    const processed = experiences?.filter(e => e.reward !== null) || [];
    const avgReward = processed.length > 0
      ? processed.reduce((sum, e) => sum + (e.reward || 0), 0) / processed.length
      : 0;
    
    return {
      totalExperiences: total,
      processedExperiences: processed.length,
      averageReward: avgReward,
      learningEnabled: isLearningEnabled(consent),
    };
  }
}

// Hook factory pour utilisation dans les composants
export function createLearningLoop(userId: string): LearningLoop {
  return new LearningLoop(userId);
}

// Export des helpers pour tests
export { computeReward, getConsentSnapshot, isLearningEnabled };
