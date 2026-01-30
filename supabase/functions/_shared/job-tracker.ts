/**
 * Shared Job Tracker - Centralized job_runs management
 * 
 * Provides consistent job tracking across all edge functions.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface JobContext {
  jobRunId: string | null;
  startTime: number;
  supabase: SupabaseClient;
  jobName: string;
}

/**
 * Start a job run and return tracking context
 */
export async function startJobRun(
  supabase: SupabaseClient,
  jobName: string,
  metadata: Record<string, unknown> = {}
): Promise<JobContext> {
  const startTime = Date.now()
  
  const { data: jobRun } = await supabase
    .from('job_runs')
    .insert({
      job_name: jobName,
      status: 'running',
      started_at: new Date().toISOString(),
      metadata,
    })
    .select()
    .single()
  
  return {
    jobRunId: jobRun?.id || null,
    startTime,
    supabase,
    jobName,
  }
}

/**
 * Complete a job run successfully
 */
export async function completeJobRun(
  ctx: JobContext,
  recordsProcessed: number,
  recordsFailed: number,
  additionalMetadata: Record<string, unknown> = {}
): Promise<void> {
  if (!ctx.jobRunId) return
  
  const durationMs = Date.now() - ctx.startTime
  
  await ctx.supabase
    .from('job_runs')
    .update({
      status: recordsFailed === 0 ? 'completed' : 'partial',
      completed_at: new Date().toISOString(),
      duration_ms: durationMs,
      records_processed: recordsProcessed,
      records_failed: recordsFailed,
      metadata: additionalMetadata,
    })
    .eq('id', ctx.jobRunId)
  
  // Update system health
  await ctx.supabase
    .from('system_health')
    .upsert({
      service: ctx.jobName,
      status: recordsFailed === 0 ? 'healthy' : 'degraded',
      message: `Processed ${recordsProcessed}, failed ${recordsFailed} (${durationMs}ms)`,
      last_check: new Date().toISOString(),
    }, { onConflict: 'service' })
}

/**
 * Fail a job run with error details
 */
export async function failJobRun(
  ctx: JobContext,
  error: Error | string
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : error
  const errorStack = error instanceof Error ? error.stack : undefined
  
  if (ctx.jobRunId) {
    await ctx.supabase
      .from('job_runs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - ctx.startTime,
        error_message: errorMessage,
        error_stack: errorStack,
      })
      .eq('id', ctx.jobRunId)
  }
  
  // Update system health with error
  await ctx.supabase
    .from('system_health')
    .upsert({
      service: ctx.jobName,
      status: 'error',
      message: errorMessage.substring(0, 255),
      last_check: new Date().toISOString(),
    }, { onConflict: 'service' })
}
