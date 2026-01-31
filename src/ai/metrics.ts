export interface BehavioralMetrics {
  behavioral_coherence: number;
  habit_stability_index: number;
  friction_index: number;
  burnout_risk: number;
  financial_impulsivity: number;
  momentum_index: number;
}

export interface MetricDefinition {
  name: keyof BehavioralMetrics;
  label: string;
  description: string;
  thresholds: { critical: number; warning: number; good: number };
  higher_is_better: boolean;
}

export const METRIC_DEFINITIONS: MetricDefinition[] = [
  {
    name: 'behavioral_coherence',
    label: 'Cohérence Comportementale',
    description: 'Alignement entre intentions et actions',
    thresholds: { critical: 30, warning: 50, good: 70 },
    higher_is_better: true,
  },
  {
    name: 'habit_stability_index',
    label: 'Stabilité des Habitudes',
    description: 'Régularité des habitudes sur 30 jours',
    thresholds: { critical: 40, warning: 60, good: 75 },
    higher_is_better: true,
  },
  {
    name: 'friction_index',
    label: 'Indice de Friction',
    description: 'Résistance au passage à l\'action',
    thresholds: { critical: 70, warning: 50, good: 30 },
    higher_is_better: false,
  },
  {
    name: 'burnout_risk',
    label: 'Risque de Burnout',
    description: 'Indicateur de surcharge',
    thresholds: { critical: 75, warning: 55, good: 35 },
    higher_is_better: false,
  },
  {
    name: 'momentum_index',
    label: 'Momentum',
    description: 'Tendance générale (50 = stable)',
    thresholds: { critical: 35, warning: 45, good: 55 },
    higher_is_better: true,
  },
];

export function evaluateMetricLevel(name: keyof BehavioralMetrics, value: number): 'critical' | 'warning' | 'good' {
  const def = METRIC_DEFINITIONS.find(m => m.name === name);
  if (!def) return 'warning';

  const { thresholds, higher_is_better } = def;

  if (higher_is_better) {
    if (value >= thresholds.good) return 'good';
    if (value >= thresholds.warning) return 'warning';
    return 'critical';
  } else {
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.warning) return 'warning';
    return 'critical';
  }
}
