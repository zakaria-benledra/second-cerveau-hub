/**
 * IDEMPOTENCY MODULE - Production-Grade
 * 
 * Centralized hash-based idempotency for all edge functions.
 * Uses SHA-256 hash of (entity + entity_id + operation + user_id + workspace_id + canonical_payload)
 * 
 * CRITICAL: Never use time-bucket based IDs - they cause data loss on legitimate rapid actions.
 */

/**
 * Stable JSON stringify that sorts keys alphabetically.
 * Ensures identical payloads produce identical hashes regardless of key order.
 */
export function stableStringify(obj: unknown): string {
  if (obj === null || obj === undefined) {
    return 'null';
  }
  
  if (typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  
  if (Array.isArray(obj)) {
    return '[' + obj.map(stableStringify).join(',') + ']';
  }
  
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = keys.map(key => {
    const value = (obj as Record<string, unknown>)[key];
    return JSON.stringify(key) + ':' + stableStringify(value);
  });
  
  return '{' + pairs.join(',') + '}';
}

/**
 * Generate a deterministic event_id using SHA-256 hash.
 * 
 * @param entity - The entity type (e.g., 'tasks', 'habits')
 * @param entityId - The entity's UUID
 * @param operation - The operation type (e.g., 'status_changed', 'completed')
 * @param userId - The user's UUID
 * @param workspaceId - The workspace UUID (required, never null)
 * @param payload - Additional payload data (will be canonicalized)
 * @returns A deterministic event_id string
 */
export async function generateIdempotencyKey(
  entity: string,
  entityId: string,
  operation: string,
  userId: string,
  workspaceId: string,
  payload: Record<string, unknown> = {}
): Promise<string> {
  // Validate required parameters
  if (!entity || !entityId || !operation || !userId || !workspaceId) {
    throw new Error('All parameters are required for idempotency key generation');
  }
  
  // Create canonical representation
  const canonicalData = stableStringify({
    entity,
    entityId,
    operation,
    userId,
    workspaceId,
    payload
  });
  
  // Generate SHA-256 hash
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(canonicalData);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Return prefixed hash for debugging
  return `${entity}_${operation}_${hashHex.slice(0, 32)}`;
}

/**
 * Check if an event with this ID already exists (idempotency check).
 * 
 * @param supabase - Supabase client instance
 * @param tableName - Table to check for duplicates
 * @param eventId - The event_id to check
 * @returns true if event exists (duplicate), false otherwise
 */
export async function isEventProcessed(
  supabase: any,
  tableName: string,
  eventId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from(tableName)
    .select('id')
    .eq('event_id', eventId)
    .maybeSingle();
  
  if (error) {
    console.error(`Idempotency check failed for ${tableName}:`, error);
    // On error, allow processing (fail-open for idempotency)
    return false;
  }
  
  return !!data;
}

/**
 * Generate a simple hash for deduplication (synchronous version).
 * Uses a simpler algorithm for non-critical paths.
 */
export function generateSimpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Create a unique external_id for finance transactions.
 * Based on document + line + date + amount for reliable deduplication.
 */
export function generateTransactionExternalId(
  documentId: string,
  lineNumber: number,
  date: string,
  amount: number,
  description: string
): string {
  const normalizedDesc = description.toLowerCase().trim().slice(0, 50);
  const data = `${documentId}_${lineNumber}_${date}_${amount}_${normalizedDesc}`;
  return generateSimpleHash(data);
}
