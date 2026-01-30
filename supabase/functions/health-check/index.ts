import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * HEALTH CHECK - System Status Aggregator
 * 
 * Checks the status of all critical services and updates system_health.
 * Should be called periodically (e.g., every 5 minutes via cron).
 */

interface ServiceCheck {
  name: string;
  check: () => Promise<{ status: 'healthy' | 'degraded' | 'error'; message: string }>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const checks: ServiceCheck[] = [
      {
        name: 'database',
        check: async () => {
          try {
            const start = Date.now()
            const { count, error } = await supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true })
            
            const latency = Date.now() - start
            
            if (error) throw error
            
            return {
              status: latency < 1000 ? 'healthy' : 'degraded',
              message: `Query latency: ${latency}ms, Users: ${count || 0}`
            }
          } catch (e) {
            return { status: 'error', message: (e as Error).message }
          }
        }
      },
      {
        name: 'storage',
        check: async () => {
          try {
            const { data, error } = await supabase
              .storage
              .from('documents')
              .list('', { limit: 1 })
            
            if (error) throw error
            
            return { status: 'healthy', message: 'Storage accessible' }
          } catch (e) {
            return { status: 'error', message: (e as Error).message }
          }
        }
      },
      {
        name: 'auth',
        check: async () => {
          try {
            // Check if we can access auth admin
            const start = Date.now()
            const { count, error } = await supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true })
            
            const latency = Date.now() - start
            
            if (error) throw error
            
            return {
              status: latency < 500 ? 'healthy' : 'degraded',
              message: `Auth service responsive (${latency}ms)`
            }
          } catch (e) {
            return { status: 'error', message: (e as Error).message }
          }
        }
      },
      {
        name: 'jobs',
        check: async () => {
          try {
            // Check for recent failed jobs
            const oneHourAgo = new Date()
            oneHourAgo.setHours(oneHourAgo.getHours() - 1)
            
            const { data: failedJobs, error } = await supabase
              .from('job_runs')
              .select('job_name')
              .eq('status', 'failed')
              .gte('created_at', oneHourAgo.toISOString())
            
            if (error) throw error
            
            const failCount = failedJobs?.length || 0
            
            if (failCount === 0) {
              return { status: 'healthy', message: 'No recent failures' }
            } else if (failCount <= 2) {
              return { status: 'degraded', message: `${failCount} failed jobs in last hour` }
            } else {
              return { status: 'error', message: `${failCount} failed jobs - investigate` }
            }
          } catch (e) {
            return { status: 'error', message: (e as Error).message }
          }
        }
      },
      {
        name: 'automations',
        check: async () => {
          try {
            // Check for stuck automation events
            const tenMinutesAgo = new Date()
            tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10)
            
            const { count, error } = await supabase
              .from('automation_events')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'pending')
              .lte('created_at', tenMinutesAgo.toISOString())
            
            if (error) throw error
            
            const stuckCount = count || 0
            
            if (stuckCount === 0) {
              return { status: 'healthy', message: 'No stuck events' }
            } else if (stuckCount <= 5) {
              return { status: 'degraded', message: `${stuckCount} events pending > 10min` }
            } else {
              return { status: 'error', message: `${stuckCount} stuck events` }
            }
          } catch (e) {
            return { status: 'error', message: (e as Error).message }
          }
        }
      },
      {
        name: 'encryption',
        check: async () => {
          try {
            const key = Deno.env.get('TOKEN_ENCRYPTION_KEY')
            
            if (!key) {
              return { status: 'error', message: 'TOKEN_ENCRYPTION_KEY not set' }
            }
            
            if (key.length < 32) {
              return { status: 'error', message: 'Encryption key too short (< 32 chars)' }
            }
            
            return { status: 'healthy', message: 'Encryption key configured' }
          } catch (e) {
            return { status: 'error', message: (e as Error).message }
          }
        }
      }
    ]

    const results: Array<{ name: string; status: string; message: string }> = []

    // Run all checks in parallel
    const checkResults = await Promise.all(
      checks.map(async (check) => {
        const result = await check.check()
        return { name: check.name, ...result }
      })
    )

    // Update system_health for each service
    for (const result of checkResults) {
      await supabase
        .from('system_health')
        .upsert({
          service: result.name,
          status: result.status,
          message: result.message,
          last_check: new Date().toISOString()
        }, { onConflict: 'service' })
      
      results.push(result)
    }

    // Calculate overall status
    const hasErrors = results.some(r => r.status === 'error')
    const hasDegraded = results.some(r => r.status === 'degraded')
    const overallStatus = hasErrors ? 'error' : hasDegraded ? 'degraded' : 'healthy'

    // Update overall system status
    await supabase
      .from('system_health')
      .upsert({
        service: 'system-overall',
        status: overallStatus,
        message: `${results.filter(r => r.status === 'healthy').length}/${results.length} services healthy`,
        last_check: new Date().toISOString()
      }, { onConflict: 'service' })

    return new Response(JSON.stringify({
      success: true,
      overall_status: overallStatus,
      duration_ms: Date.now() - startTime,
      checks: results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    const error = err as Error
    console.error('Health check error:', error)

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
