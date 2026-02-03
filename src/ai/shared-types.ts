// Types IA partagés entre frontend et edge functions

export const SAGE_ACTIONS = [
  'nudge',           // Encouragement léger
  'reframe',         // Changement de perspective
  'challenge',       // Pousser plus loin
  'celebrate',       // Célébrer une victoire
  'protect',         // Protéger du surmenage
  'observe',         // Observer sans agir
  'suggest_task',    // Suggérer une tâche
  'suggest_break',   // Suggérer une pause
  'weekly_review',   // Revue hebdo
  'silent',          // Ne rien faire (important!)
] as const;

export type SageAction = typeof SAGE_ACTIONS[number];

export const BEHAVIOR_SIGNALS = [
  'fatigue',         // Baisse d'énergie détectée
  'overload',        // Surcharge de tâches
  'disengagement',   // Désengagement progressif
  'momentum',        // Momentum positif
  'streak_risk',     // Streak en danger
  'pattern_found',   // Pattern découvert
] as const;

export type BehaviorSignal = typeof BEHAVIOR_SIGNALS[number];

export interface SageDecision {
  action: SageAction;
  confidence: number;
  reasoning: string;
  signal?: BehaviorSignal;
}

// Legacy mapping for backward compatibility with policy engine
export const LEGACY_ACTION_MAPPING: Record<string, SageAction> = {
  'create_task': 'suggest_task',
  'reduce_load': 'protect',
  'suggest_reflection': 'reframe',
  'schedule_break': 'suggest_break',
};
