import { UserContext } from './context-builder';
import { SageMemory } from './memory-manager';

export interface SafetyCheck {
  allowed: boolean;
  reason?: string;
  constraints?: string[];
}

export interface SafetyConfig {
  maxActionsPerDay: number;
  quietHoursStart: number;
  quietHoursEnd: number;
  minDataQuality: number;
  forbiddenCategories: string[];
  maxConsecutiveNudges: number;
}

const DEFAULT_CONFIG: SafetyConfig = {
  maxActionsPerDay: 5,
  quietHoursStart: 22,
  quietHoursEnd: 7,
  minDataQuality: 0.3,
  forbiddenCategories: ['health_diagnosis', 'financial_advice', 'legal_advice'],
  maxConsecutiveNudges: 3,
};

export class SafetyEngine {
  private config: SafetyConfig;
  private actionsToday: number = 0;
  private consecutiveNudges: number = 0;

  constructor(config: Partial<SafetyConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async checkSafety(
    context: UserContext,
    memory: SageMemory,
    proposedAction: string
  ): Promise<SafetyCheck> {
    const checks: SafetyCheck[] = [];

    // Check 1: Heures de silence
    checks.push(this.checkQuietHours(context.temporal.hour_of_day));

    // Check 2: Limite d'actions journalières
    checks.push(await this.checkDailyLimit());

    // Check 3: Qualité des données suffisante
    checks.push(this.checkDataQuality(context.data_quality));

    // Check 4: Catégories interdites
    checks.push(this.checkForbiddenCategories(proposedAction));

    // Check 5: Anti-harcèlement (pas trop de nudges consécutifs)
    checks.push(this.checkConsecutiveNudges(proposedAction));

    // Check 6: Contraintes utilisateur
    checks.push(this.checkUserConstraints(memory.profile.constraints, proposedAction));

    // Agrégation
    const failed = checks.filter(c => !c.allowed);

    if (failed.length > 0) {
      return {
        allowed: false,
        reason: failed.map(f => f.reason).join('; '),
        constraints: failed.flatMap(f => f.constraints || []),
      };
    }

    return { allowed: true };
  }

  private checkQuietHours(hour: number): SafetyCheck {
    const { quietHoursStart, quietHoursEnd } = this.config;

    const isQuietTime = hour >= quietHoursStart || hour < quietHoursEnd;

    if (isQuietTime) {
      return {
        allowed: false,
        reason: `Heures de silence (${quietHoursStart}h-${quietHoursEnd}h)`,
        constraints: ['quiet_hours'],
      };
    }

    return { allowed: true };
  }

  private async checkDailyLimit(): Promise<SafetyCheck> {
    if (this.actionsToday >= this.config.maxActionsPerDay) {
      return {
        allowed: false,
        reason: `Limite journalière atteinte (${this.config.maxActionsPerDay} actions)`,
        constraints: ['daily_limit'],
      };
    }
    return { allowed: true };
  }

  private checkDataQuality(quality: number): SafetyCheck {
    if (quality < this.config.minDataQuality) {
      return {
        allowed: false,
        reason: `Données insuffisantes (${Math.round(quality * 100)}% < ${Math.round(this.config.minDataQuality * 100)}%)`,
        constraints: ['data_quality'],
      };
    }
    return { allowed: true };
  }

  private checkForbiddenCategories(action: string): SafetyCheck {
    const forbidden = this.config.forbiddenCategories.some(cat =>
      action.toLowerCase().includes(cat)
    );

    if (forbidden) {
      return {
        allowed: false,
        reason: 'Catégorie interdite (santé/finance/juridique)',
        constraints: ['forbidden_category'],
      };
    }
    return { allowed: true };
  }

  private checkConsecutiveNudges(action: string): SafetyCheck {
    if (action === 'nudge') {
      this.consecutiveNudges++;
      if (this.consecutiveNudges > this.config.maxConsecutiveNudges) {
        return {
          allowed: false,
          reason: 'Trop de nudges consécutifs',
          constraints: ['anti_harassment'],
        };
      }
    } else {
      this.consecutiveNudges = 0;
    }
    return { allowed: true };
  }

  private checkUserConstraints(
    constraints: Record<string, unknown>,
    action: string
  ): SafetyCheck {
    // Vérifier les contraintes personnalisées de l'utilisateur
    const disabledActions = constraints.disabled_actions as string[] | undefined;
    if (disabledActions?.includes(action)) {
      return {
        allowed: false,
        reason: `Action désactivée par l'utilisateur`,
        constraints: ['user_preference'],
      };
    }
    return { allowed: true };
  }

  // Vérifie si l'heure actuelle est dans les heures de silence
  isQuietTime(): boolean {
    const hour = new Date().getHours();
    const { quietHoursStart, quietHoursEnd } = this.config;
    return hour >= quietHoursStart || hour < quietHoursEnd;
  }

  // Retourne le nombre d'actions restantes aujourd'hui
  getRemainingActions(): number {
    return Math.max(0, this.config.maxActionsPerDay - this.actionsToday);
  }

  // Incrémente le compteur d'actions
  incrementActionCount(): void {
    this.actionsToday++;
  }

  // Reset journalier
  resetDaily(): void {
    this.actionsToday = 0;
    this.consecutiveNudges = 0;
  }

  // Met à jour la configuration
  updateConfig(updates: Partial<SafetyConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  // Retourne la configuration actuelle
  getConfig(): SafetyConfig {
    return { ...this.config };
  }
}
