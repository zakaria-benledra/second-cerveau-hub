// ========================================
// POLICY ENGINE — Contextual Bandit
// ========================================

import { SAGE_ACTIONS, type SageAction } from './shared-types';

export const ACTIONS = SAGE_ACTIONS;

export type ActionType = SageAction;

export interface PolicyWeights {
  [action: string]: number[];
}

export interface ActionDecision {
  action: ActionType;
  score: number;
  confidence: number;
  reasoning: string;
}

// ========================================
// REWARD FUNCTION — Ce qui définit le succès
// ========================================

export interface RewardInput {
  accepted: boolean;      // L'utilisateur a accepté l'action
  completed: boolean;     // L'action a été complétée
  metricDelta: number;    // Changement dans les métriques (score global)
  timeToAction: number;   // Secondes avant réaction
  explicit: 'helpful' | 'not_helpful' | null; // Feedback explicite
}

export function computeReward(input: RewardInput): number {
  let reward = 0;

  // Reward pour acceptation
  if (input.accepted) reward += 1.0;
  else reward -= 0.5;

  // Reward pour complétion
  if (input.completed) reward += 2.0;

  // Reward pour amélioration des métriques
  reward += input.metricDelta * 1.5;

  // Reward pour feedback explicite
  if (input.explicit === 'helpful') reward += 1.0;
  if (input.explicit === 'not_helpful') reward -= 1.5;

  // Pénalité si ignoré longtemps
  if (!input.accepted && input.timeToAction > 3600) {
    reward -= 0.5;
  }

  // Clamp entre -5 et +5
  return Math.max(-5, Math.min(5, reward));
}

// ========================================
// POLICY — Epsilon-Greedy Contextual Bandit
// ========================================

export class PolicyEngine {
  private weights: PolicyWeights = {};
  private readonly learningRate: number;
  private readonly epsilon: number;
  private readonly vectorSize: number;

  constructor(config: {
    learningRate?: number;
    epsilon?: number;
    vectorSize?: number;
  } = {}) {
    this.learningRate = config.learningRate ?? 0.05;
    this.epsilon = config.epsilon ?? 0.1;
    this.vectorSize = config.vectorSize ?? 18; // Taille du context vector
    this.initializeWeights();
  }

  private initializeWeights(): void {
    for (const action of ACTIONS) {
      this.weights[action] = Array(this.vectorSize).fill(0).map(() =>
        (Math.random() - 0.5) * 0.1 // Small random initialization
      );
    }
  }

  loadWeights(weights: PolicyWeights): void {
    this.weights = weights;
  }

  getWeights(): PolicyWeights {
    return { ...this.weights };
  }

  // Choisir une action basée sur le contexte
  chooseAction(contextVector: number[]): ActionDecision {
    // Exploration: avec probabilité epsilon, choisir aléatoirement
    if (Math.random() < this.epsilon) {
      const randomAction = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
      return {
        action: randomAction,
        score: 0,
        confidence: 0,
        reasoning: 'exploration',
      };
    }

    // Exploitation: choisir l'action avec le meilleur score
    let bestAction: ActionType = 'silent';
    let bestScore = -Infinity;
    const scores: Record<string, number> = {};

    for (const action of ACTIONS) {
      const w = this.weights[action];
      const score = this.dotProduct(contextVector, w);
      scores[action] = score;

      if (score > bestScore) {
        bestScore = score;
        bestAction = action;
      }
    }

    // Calcul de la confiance (softmax-like)
    const totalExp = Object.values(scores).reduce((sum, s) => sum + Math.exp(s), 0);
    const confidence = Math.exp(bestScore) / totalExp;

    return {
      action: bestAction,
      score: bestScore,
      confidence,
      reasoning: this.generateReasoning(contextVector, bestAction),
    };
  }

  // Obtenir les scores pour toutes les actions
  getAllScores(contextVector: number[]): Record<ActionType, number> {
    const scores = {} as Record<ActionType, number>;
    
    for (const action of ACTIONS) {
      const w = this.weights[action];
      scores[action] = this.dotProduct(contextVector, w);
    }
    
    return scores;
  }

  // Obtenir les N meilleures actions
  getTopActions(contextVector: number[], n: number = 3): ActionDecision[] {
    const scores = this.getAllScores(contextVector);
    const totalExp = Object.values(scores).reduce((sum, s) => sum + Math.exp(s), 0);

    return Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, n)
      .map(([action, score]) => ({
        action: action as ActionType,
        score,
        confidence: Math.exp(score) / totalExp,
        reasoning: this.generateReasoning(contextVector, action as ActionType),
      }));
  }

  // Mise à jour des poids après feedback
  updateWeights(
    contextVector: number[],
    action: ActionType,
    reward: number
  ): void {
    const w = this.weights[action];

    // Gradient descent: w = w + lr * reward * context
    for (let i = 0; i < w.length; i++) {
      w[i] += this.learningRate * reward * contextVector[i];
    }
  }

  // Batch update pour plusieurs expériences
  batchUpdate(
    experiences: Array<{
      contextVector: number[];
      action: ActionType;
      reward: number;
    }>
  ): void {
    for (const exp of experiences) {
      this.updateWeights(exp.contextVector, exp.action, exp.reward);
    }
  }

  private dotProduct(a: number[], b: number[]): number {
    return a.reduce((sum, val, i) => sum + val * (b[i] || 0), 0);
  }

  private generateReasoning(context: number[], action: ActionType): string {
    // Identifier les features les plus influentes
    const w = this.weights[action];
    const contributions = context.map((c, i) => ({
      index: i,
      contribution: c * w[i],
      name: FEATURE_NAMES[i] || `feature_${i}`,
    }));

    const topFactors = contributions
      .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
      .slice(0, 3);

    return topFactors
      .map(f => `${f.name}: ${f.contribution > 0 ? '+' : ''}${f.contribution.toFixed(2)}`)
      .join(', ');
  }

  // Exporter les poids pour persistance
  exportWeights(): string {
    return JSON.stringify(this.weights);
  }

  // Importer les poids depuis une chaîne JSON
  importWeights(json: string): void {
    try {
      const parsed = JSON.parse(json) as PolicyWeights;
      this.weights = parsed;
    } catch {
      console.error('Failed to import policy weights');
    }
  }

  // Obtenir les statistiques du modèle
  getStats(): {
    totalActions: number;
    averageWeight: number;
    weightRange: { min: number; max: number };
  } {
    let allWeights: number[] = [];
    
    for (const action of ACTIONS) {
      allWeights = allWeights.concat(this.weights[action]);
    }
    
    const sum = allWeights.reduce((a, b) => a + b, 0);
    const min = Math.min(...allWeights);
    const max = Math.max(...allWeights);
    
    return {
      totalActions: ACTIONS.length,
      averageWeight: sum / allWeights.length,
      weightRange: { min, max },
    };
  }
}

// Noms des features pour l'explicabilité
const FEATURE_NAMES: Record<number, string> = {
  0: 'habits_rate_7d',
  1: 'habits_variance',
  2: 'task_overdue',
  3: 'task_completion',
  4: 'journal_sentiment',
  5: 'burnout_risk',
  6: 'momentum',
  7: 'financial_health',
  8: 'hour_of_day',
  9: 'day_of_week',
  10: 'is_weekend',
  11: 'days_inactive',
  12: 'pending_tasks',
  13: 'due_today',
  14: 'habits_progress',
  15: 'streak',
  16: 'last_mood',
  17: 'data_quality',
};

// Export des noms de features pour usage externe
export { FEATURE_NAMES };
