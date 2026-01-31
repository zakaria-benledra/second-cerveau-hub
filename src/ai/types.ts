// ============================================
// AI Types - Centralized type definitions
// ============================================

// Intervention types matching database constraint
export type InterventionType = 'motivation' | 'warning' | 'challenge' | 'praise' | 'restructure';

// Extended intervention types for automated engine
export type ExtendedInterventionType = InterventionType | 'reduce_load' | 'force_break' | 'streak_protection' | 'financial_alert' | 'block_action' | 'create_recovery_task';

// User action on intervention
export type UserAction = 'accepted' | 'ignored' | 'rejected' | 'pending';

// Signal types matching database
export type SignalType = 'fatigue' | 'overload' | 'disengagement' | 'momentum' | 'relapse_risk' | 'streak_break' | 'productivity_peak';

// ============================================
// AI Response Types
// ============================================

export interface AIResponse {
  success: boolean;
  timestamp: string;
  request_id: string;
  scores: { global: number; habits: number; tasks: number; finance: number; wellbeing: number };
  insights: AIInsight[];
  risks: AIRisk[];
  actions: AIAction[];
  confidence: { level: 'high' | 'medium' | 'low'; score: number; data_completeness: number };
  assumptions: string[];
}

// ============================================
// Insight Types
// ============================================

export type InsightType = 'observation' | 'pattern' | 'correlation' | 'anomaly';

export interface AIInsight {
  id: string;
  type: InsightType;
  category: 'habits' | 'tasks' | 'finance' | 'wellbeing' | 'general';
  title: string;
  description: string;
  evidence: string[];
  confidence: number;
  actionable: boolean;
}

// ============================================
// Risk Types
// ============================================

export type RiskType = 'relapse' | 'burnout' | 'impulsivity' | 'dispersion' | 'disengagement';

export type RiskSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface AIRisk {
  id: string;
  type: RiskType;
  severity: RiskSeverity;
  title: string;
  description: string;
  probability?: number;
  timeline?: 'imminent' | 'this_week' | 'this_month';
  mitigation?: string;
  recommendation?: string;
  auto_action?: string;
}

// ============================================
// Action Types
// ============================================

export type ActionPriority = 'must' | 'should' | 'could';

export interface AIAction {
  id: string;
  type: 'habit' | 'task' | 'finance' | 'reflection' | 'rest';
  priority: ActionPriority;
  title: string;
  description: string;
  estimated_duration: number;
  impact: { metric: string; expected_change: number };
  deadline?: string;
}

// ============================================
// Intervention Types
// ============================================

export interface AIIntervention {
  id: string;
  type: InterventionType;
  message: string;
  context: Record<string, unknown>;
  created_at: string;
  user_action: UserAction;
}

// ============================================
// Behavioral Context from ai-behavior-engine
// ============================================

export interface BehaviorContext {
  habits_consistency: number;
  tasks_overdue: number;
  streak_status: string;
  last_activity_days: number;
  churn_risk: number;
  recent_completions: number;
}

// ============================================
// Behavior Signal
// ============================================

export interface BehaviorSignal {
  id: string;
  type: SignalType;
  score: number;
  metadata?: Record<string, unknown>;
  created_at: string;
}
