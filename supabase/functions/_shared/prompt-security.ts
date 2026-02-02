/**
 * Module de sécurité anti prompt-injection
 * Protège contre les attaques visant à manipuler le LLM
 */

// Patterns dangereux détectés dans les attaques connues
const DANGEROUS_PATTERNS: RegExp[] = [
  /ignore\s+(previous|all|above|prior)/i,
  /forget\s+(everything|all|previous|instructions)/i,
  /disregard\s+(previous|all|above)/i,
  /new\s+instructions?:/i,
  /system\s*:\s*/i,
  /\[INST\]/i,
  /\[\/INST\]/i,
  /<\/?system>/i,
  /<\/?assistant>/i,
  /you\s+are\s+(now|a|an)\s/i,
  /pretend\s+(to\s+be|you're)/i,
  /act\s+as\s+(if|a|an)/i,
  /roleplay\s+as/i,
  /bypass\s+(security|restrictions|filters)/i,
  /admin\s*mode/i,
  /developer\s*mode/i,
  /debug\s*mode/i,
  /jailbreak/i,
  /DAN\s*(mode)?/i,
  /do\s+anything\s+now/i,
  /ignore\s+safety/i,
  /override\s+(safety|restrictions)/i,
];

// Skills autorisés (whitelist stricte)
export const ALLOWED_SKILLS = [
  'daily_insight',
  'weekly_review',
  'habit_nudge',
  'task_suggestion',
  'motivation_boost',
  'goal_check',
  'reflection_prompt',
  'celebration',
  'warning',
  'protection',
  'focus_mode',
  'stress_check',
] as const;

export type AllowedSkill = typeof ALLOWED_SKILLS[number];

export interface SanitizeResult {
  isValid: boolean;
  sanitizedValue: string;
  blockedReason?: string;
  riskScore: number; // 0-100
}

/**
 * Sanitize et valide un input contre le prompt injection
 */
export function sanitizeInput(input: unknown, maxLength = 500): SanitizeResult {
  // Type check
  if (typeof input !== 'string') {
    return {
      isValid: false,
      sanitizedValue: '',
      blockedReason: 'INPUT_NOT_STRING',
      riskScore: 100,
    };
  }

  // Longueur max
  if (input.length > maxLength) {
    return {
      isValid: false,
      sanitizedValue: input.slice(0, maxLength),
      blockedReason: 'INPUT_TOO_LONG',
      riskScore: 50,
    };
  }

  // Détecter patterns dangereux
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(input)) {
      return {
        isValid: false,
        sanitizedValue: '',
        blockedReason: `DANGEROUS_PATTERN:${pattern.source.slice(0, 30)}`,
        riskScore: 100,
      };
    }
  }

  // Calculer score de risque basé sur heuristiques
  let riskScore = 0;
  if (input.includes('```')) riskScore += 20;
  if (input.includes('\\n') || input.includes('\n')) riskScore += 10;
  if (/[<>{}[\]]/.test(input)) riskScore += 15;
  if (input.length > 200) riskScore += 10;

  // Sanitize: retirer caractères dangereux
  const sanitized = input
    .replace(/[<>]/g, '')           // Remove HTML-like
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control chars
    .replace(/```[\s\S]*```/g, '')   // Remove code blocks
    .trim();

  return {
    isValid: true,
    sanitizedValue: sanitized,
    riskScore: Math.min(riskScore, 99),
  };
}

/**
 * Valide que le skill est dans la whitelist
 */
export function validateSkill(skill: unknown): skill is AllowedSkill {
  if (typeof skill !== 'string') return false;
  return ALLOWED_SKILLS.includes(skill as AllowedSkill);
}

/**
 * Log les tentatives d'injection pour audit sécurité
 */
export function logSecurityEvent(
  eventType: 'INJECTION_ATTEMPT' | 'INVALID_SKILL' | 'SUSPICIOUS_INPUT',
  userId: string,
  details: Record<string, unknown>
): void {
  const event = {
    timestamp: new Date().toISOString(),
    level: 'SECURITY',
    event: eventType,
    userId,
    ...details,
  };
  console.error(JSON.stringify(event));
}
