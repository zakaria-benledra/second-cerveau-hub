/**
 * SHARED VALIDATION SCHEMAS (Zod-like validation for Deno)
 * 
 * Production-grade validation for all edge functions
 */

// ============= TYPE DEFINITIONS =============

export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

// ============= ENUMS =============

export const TASK_STATUS = ['todo', 'in_progress', 'done', 'cancelled', 'blocked'] as const;
export type TaskStatus = typeof TASK_STATUS[number];

export const KANBAN_STATUS = ['backlog', 'todo', 'doing', 'done'] as const;
export type KanbanStatus = typeof KANBAN_STATUS[number];

export const TASK_PRIORITY = ['urgent', 'high', 'medium', 'low'] as const;
export type TaskPriority = typeof TASK_PRIORITY[number];

export const EVENT_TYPE = ['created', 'updated', 'status_changed', 'completed', 'reverted', 'deleted', 'archived'] as const;
export type EventType = typeof EVENT_TYPE[number];

export const ENTITY_TYPE = ['tasks', 'habits', 'goals', 'projects', 'finance_transactions', 'calendar_events'] as const;
export type EntityType = typeof ENTITY_TYPE[number];

export const SOURCE_TYPE = ['ui', 'api', 'automation', 'ai', 'integration', 'csv_import', 'google'] as const;
export type SourceType = typeof SOURCE_TYPE[number];

// ============= VALIDATORS =============

export function isUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

export function isString(value: unknown, minLength = 0, maxLength = 10000): value is string {
  return typeof value === 'string' && value.length >= minLength && value.length <= maxLength;
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  return dateRegex.test(value);
}

export function isEnum<T extends readonly string[]>(value: unknown, allowed: T): value is T[number] {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

// ============= SCHEMA VALIDATORS =============

export interface KanbanMoveInput {
  taskId: string;
  newStatus: KanbanStatus;
  newSortOrder?: number;
  previousTaskId?: string;
}

export function validateKanbanMove(input: unknown): ValidationResult<KanbanMoveInput> {
  if (!input || typeof input !== 'object') {
    return { success: false, error: 'Input must be an object' };
  }

  const data = input as Record<string, unknown>;

  if (!isUUID(data.taskId)) {
    return { success: false, error: 'taskId must be a valid UUID' };
  }

  if (!isEnum(data.newStatus, KANBAN_STATUS)) {
    return { success: false, error: `newStatus must be one of: ${KANBAN_STATUS.join(', ')}` };
  }

  if (data.newSortOrder !== undefined && !isNumber(data.newSortOrder)) {
    return { success: false, error: 'newSortOrder must be a number' };
  }

  if (data.previousTaskId !== undefined && !isUUID(data.previousTaskId)) {
    return { success: false, error: 'previousTaskId must be a valid UUID' };
  }

  return {
    success: true,
    data: {
      taskId: data.taskId,
      newStatus: data.newStatus as KanbanStatus,
      newSortOrder: data.newSortOrder as number | undefined,
      previousTaskId: data.previousTaskId as string | undefined,
    }
  };
}

export interface HabitLogInput {
  habitId: string;
  date?: string;
}

export function validateHabitLog(input: unknown): ValidationResult<HabitLogInput> {
  if (!input || typeof input !== 'object') {
    return { success: false, error: 'Input must be an object' };
  }

  const data = input as Record<string, unknown>;

  if (!isUUID(data.habitId)) {
    return { success: false, error: 'habitId must be a valid UUID' };
  }

  if (data.date !== undefined && !isDate(data.date)) {
    return { success: false, error: 'date must be in YYYY-MM-DD format' };
  }

  return {
    success: true,
    data: {
      habitId: data.habitId,
      date: data.date as string | undefined,
    }
  };
}

export interface CreateHabitInput {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  target_frequency?: string;
}

export function validateCreateHabit(input: unknown): ValidationResult<CreateHabitInput> {
  if (!input || typeof input !== 'object') {
    return { success: false, error: 'Input must be an object' };
  }

  const data = input as Record<string, unknown>;

  if (!isString(data.name, 1, 255)) {
    return { success: false, error: 'name must be a string between 1-255 characters' };
  }

  return {
    success: true,
    data: {
      name: data.name,
      description: isString(data.description) ? data.description : undefined,
      icon: isString(data.icon, 0, 10) ? data.icon : undefined,
      color: isString(data.color, 0, 50) ? data.color : undefined,
      target_frequency: isString(data.target_frequency) ? data.target_frequency : 'daily',
    }
  };
}

export interface TransactionInput {
  amount: number;
  type: 'income' | 'expense';
  description?: string;
  date?: string;
  category_id?: string;
}

export function validateTransaction(input: unknown): ValidationResult<TransactionInput> {
  if (!input || typeof input !== 'object') {
    return { success: false, error: 'Input must be an object' };
  }

  const data = input as Record<string, unknown>;

  if (!isNumber(data.amount)) {
    return { success: false, error: 'amount must be a number' };
  }

  if (!isEnum(data.type, ['income', 'expense'] as const)) {
    return { success: false, error: 'type must be income or expense' };
  }

  if (data.category_id !== undefined && !isUUID(data.category_id)) {
    return { success: false, error: 'category_id must be a valid UUID' };
  }

  return {
    success: true,
    data: {
      amount: data.amount,
      type: data.type as 'income' | 'expense',
      description: isString(data.description) ? data.description : undefined,
      date: isDate(data.date) ? data.date : undefined,
      category_id: isUUID(data.category_id) ? data.category_id : undefined,
    }
  };
}

// ============= IDEMPOTENCY HELPERS =============

/**
 * Generate deterministic event_id for idempotency
 * Format: {entity}_{entity_id}_{event_type}_{timestamp_bucket}
 * 
 * timestamp_bucket = floor(timestamp / 1000) - ensures 1-second dedup window
 */
export function generateEventId(
  entity: string,
  entityId: string,
  eventType: string,
  timestampMs?: number
): string {
  const ts = timestampMs || Date.now();
  const bucket = Math.floor(ts / 1000); // 1-second bucket
  return `${entity}_${entityId}_${eventType}_${bucket}`;
}

/**
 * Generate hash-based event_id for more complex dedup scenarios
 */
export async function generateHashEventId(
  payload: Record<string, unknown>
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 32);
}

// ============= WORKSPACE HELPERS =============

/**
 * Get user's workspace_id from memberships
 */
export async function getUserWorkspaceId(supabase: any, userId: string): Promise<string | null> {
  const { data: membership } = await supabase
    .from('memberships')
    .select('workspace_id')
    .eq('user_id', userId)
    .limit(1)
    .single();
  
  return membership?.workspace_id || null;
}

// ============= ENCRYPTION HELPERS =============

/**
 * Encrypt sensitive data using AES-256-GCM
 */
export async function encryptToken(token: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  // Combine IV + encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  // Return as base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt sensitive data
 */
export async function decryptToken(encrypted: string, key: CryptoKey): Promise<string> {
  const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  return new TextDecoder().decode(decrypted);
}
