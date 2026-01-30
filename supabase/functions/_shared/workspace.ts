/**
 * Workspace Helper - Production-Grade Multi-Tenant Functions
 * 
 * CRITICAL: workspace_id must NEVER be nullable.
 * If no membership exists, this module bootstraps one or fails hard.
 */

/**
 * Get user's workspace ID or bootstrap one if none exists.
 * NEVER returns null - fails with error if cannot resolve.
 */
export async function getRequiredWorkspaceId(
  supabase: any, 
  userId: string
): Promise<string> {
  // Try to get existing workspace
  const { data: membership, error: membershipError } = await supabase
    .from('memberships')
    .select('workspace_id')
    .eq('user_id', userId)
    .limit(1)
    .single();

  if (membership?.workspace_id) {
    return membership.workspace_id;
  }

  // Bootstrap personal workspace
  console.log(`Bootstrapping workspace for user ${userId}`);
  
  const { data: workspace, error: createError } = await supabase
    .from('workspaces')
    .insert({
      name: 'Mon espace personnel',
      plan: 'free',
      owner_id: userId
    })
    .select()
    .single();

  if (createError || !workspace) {
    throw new Error(`Failed to bootstrap workspace: ${createError?.message || 'Unknown error'}`);
  }

  // Add membership
  const { error: memberError } = await supabase
    .from('memberships')
    .insert({
      user_id: userId,
      workspace_id: workspace.id,
      role: 'owner'
    });

  if (memberError) {
    throw new Error(`Failed to create membership: ${memberError.message}`);
  }

  // Create usage limits for free tier
  await supabase
    .from('usage_limits')
    .insert({
      workspace_id: workspace.id,
      ai_requests_limit: 50,
      ai_requests_used: 0,
      automations_limit: 5,
      automations_used: 0,
      team_members_limit: 1,
      team_members_used: 1,
      storage_limit_mb: 100,
      storage_used_mb: 0
    });

  return workspace.id;
}

/**
 * Generate idempotency key using payload hash.
 * Uses SHA-256 hash of payload + entity + workspace + user.
 */
export async function generateIdempotencyKey(
  entity: string,
  entityId: string,
  operation: string,
  userId: string,
  workspaceId: string,
  payload: Record<string, unknown> = {}
): Promise<string> {
  const data = JSON.stringify({
    entity,
    entityId,
    operation,
    userId,
    workspaceId,
    payload
  });
  
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${entity}_${operation}_${hashHex.slice(0, 32)}`;
}

/**
 * Check if an event has already been processed (idempotency check).
 */
export async function isEventProcessed(
  supabase: any,
  tableName: string,
  eventId: string
): Promise<boolean> {
  const { data } = await supabase
    .from(tableName)
    .select('id')
    .eq('event_id', eventId)
    .limit(1)
    .single();
  
  return !!data;
}
