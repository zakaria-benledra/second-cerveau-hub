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

export type RiskType = 'relapse' | 'burnout' | 'impulsivity' | 'dispersion' | 'disengagement';

export type RiskSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface AIRisk {
  id: string;
  type: RiskType;
  severity: RiskSeverity;
  title: string;
  description: string;
  probability: number;
  timeline: 'imminent' | 'this_week' | 'this_month';
  mitigation: string;
}

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

export interface AIIntervention {
  id: string;
  type: 'warning' | 'restructure' | 'motivation' | 'challenge' | 'praise';
  message: string;
  context: Record<string, unknown>;
  created_at: string;
  user_action: 'pending' | 'accepted' | 'rejected' | 'dismissed';
}
