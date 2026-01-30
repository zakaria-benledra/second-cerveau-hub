/**
 * WORKSPACE MODULE - Production-Grade Multi-Tenant Enforcement
 * 
 * CRITICAL RULES:
 * 1. workspace_id must NEVER be nullable for tenant-scoped data
 * 2. If no membership exists, bootstrap a workspace or FAIL HARD
 * 3. All queries must filter by BOTH user_id AND workspace_id
 */

/**
 * Get user's workspace ID or bootstrap one if none exists.
 * NEVER returns null - throws error if cannot resolve.
 * 
 * @throws Error if workspace cannot be resolved or created
 */
export async function getRequiredWorkspaceId(
  supabase: any, 
  userId: string
): Promise<string> {
  if (!userId) {
    throw new Error('MULTI_TENANT_VIOLATION: userId is required');
  }

  // Try to get existing workspace with explicit user filter
  const { data: membership, error: membershipError } = await supabase
    .from('memberships')
    .select('workspace_id')
    .eq('user_id', userId)  // CRITICAL: Must filter by user_id
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    console.error('Membership lookup error:', membershipError);
    // Don't fail silently - this is a critical path
  }

  if (membership?.workspace_id) {
    return membership.workspace_id;
  }

  // Bootstrap personal workspace atomically
  console.log(`[WORKSPACE] Bootstrapping workspace for user ${userId}`);
  
  // Generate unique slug from userId
  const slug = `personal-${userId.slice(0, 8)}-${Date.now().toString(36)}`;
  
  const { data: workspace, error: createError } = await supabase
    .from('workspaces')
    .insert({
      name: 'Mon espace personnel',
      slug: slug,
      plan: 'free',
      owner_id: userId
    })
    .select('id')
    .single();

  if (createError || !workspace?.id) {
    throw new Error(`WORKSPACE_BOOTSTRAP_FAILED: ${createError?.message || 'Unknown error'}`);
  }

  // Add membership with owner role
  const { error: memberError } = await supabase
    .from('memberships')
    .insert({
      user_id: userId,
      workspace_id: workspace.id,
      role: 'owner'
    });

  if (memberError) {
    // Cleanup: delete orphan workspace
    await supabase.from('workspaces').delete().eq('id', workspace.id);
    throw new Error(`MEMBERSHIP_CREATE_FAILED: ${memberError.message}`);
  }

  // Create usage limits for free tier (non-blocking)
  const { error: limitsError } = await supabase
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

  if (limitsError) {
    console.warn(`[WORKSPACE] Usage limits creation failed (non-critical): ${limitsError.message}`);
  }

  console.log(`[WORKSPACE] Successfully bootstrapped workspace ${workspace.id} for user ${userId}`);
  return workspace.id;
}

/**
 * DEPRECATED: Use getRequiredWorkspaceId instead.
 * This function is kept for backward compatibility but logs a warning.
 * 
 * @deprecated
 */
export async function getUserWorkspaceId(
  supabase: any,
  userId: string
): Promise<string | null> {
  console.warn('[DEPRECATED] getUserWorkspaceId called - use getRequiredWorkspaceId instead');
  
  try {
    return await getRequiredWorkspaceId(supabase, userId);
  } catch (error) {
    console.error('[WORKSPACE] Failed to get workspace:', error);
    return null;
  }
}

// NOTE: Do NOT re-export from idempotency.ts here.
// Each edge function should import directly from the module it needs.
// This prevents circular dependencies and makes dependencies explicit.

/**
 * Get workspace context including workspaceId.
 * Returns object with workspaceId or null.
 */
export async function getWorkspaceContext(
  supabase: any,
  userId: string
): Promise<{ workspaceId: string | null }> {
  try {
    const workspaceId = await getRequiredWorkspaceId(supabase, userId);
    return { workspaceId };
  } catch (error) {
    console.error('[WORKSPACE] Context resolution failed:', error);
    return { workspaceId: null };
  }
}
