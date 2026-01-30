import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============= VALIDATION =============

function isUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

async function getUserWorkspaceId(supabase: any, userId: string): Promise<string | null> {
  const { data: membership } = await supabase
    .from('memberships')
    .select('workspace_id')
    .eq('user_id', userId)
    .limit(1)
    .single();
  return membership?.workspace_id || null;
}

// ============= TOKEN ENCRYPTION =============

async function getEncryptionKey(): Promise<CryptoKey> {
  const secret = Deno.env.get('TOKEN_ENCRYPTION_KEY') || 'default-key-change-in-production-32b';
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret.padEnd(32, '0').slice(0, 32));
  
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptToken(token: string): Promise<string> {
  const key = await getEncryptionKey();
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

async function decryptToken(encrypted: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (e) {
    // Fallback to unencrypted (for migration)
    return encrypted;
  }
}

// ============= MAIN HANDLER =============

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const jobRunId = crypto.randomUUID()
  const startTime = Date.now()

  try {
    // Log job start
    await supabase.from('job_runs').insert({
      id: jobRunId,
      job_name: 'sync-google-calendar',
      status: 'running',
      started_at: new Date().toISOString()
    })

    const authHeader = req.headers.get('Authorization')
    let targetUserId: string | null = null

    // If called with auth, sync only that user
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      if (user) targetUserId = user.id
    }

    // Get connected Google accounts
    let query = supabase
      .from('connected_accounts')
      .select('*')
      .eq('provider', 'google')

    if (targetUserId) {
      query = query.eq('user_id', targetUserId)
    }

    const { data: accounts, error: accountsError } = await query

    if (accountsError) throw accountsError

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')

    let totalEvents = 0
    let failedAccounts = 0

    for (const account of accounts || []) {
      try {
        // Get workspace_id for multi-tenant inserts
        const workspaceId = await getUserWorkspaceId(supabase, account.user_id)
        
        // ========== DECRYPT TOKEN ==========
        let accessToken = account.access_token
        let refreshToken = account.refresh_token
        
        // Try to use encrypted token if available
        if (account.refresh_token_encrypted) {
          try {
            refreshToken = await decryptToken(account.refresh_token_encrypted)
          } catch (e) {
            console.error('Failed to decrypt token, using plaintext')
          }
        }

        // Check if token needs refresh
        if (new Date(account.expires_at) < new Date()) {
          if (!clientId || !clientSecret) {
            console.error('Google OAuth credentials not configured')
            failedAccounts++
            continue
          }

          const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              refresh_token: refreshToken,
              client_id: clientId,
              client_secret: clientSecret,
              grant_type: 'refresh_token'
            })
          })

          const tokens = await refreshResponse.json()
          if (tokens.access_token) {
            accessToken = tokens.access_token
            
            // ========== ENCRYPT AND STORE NEW TOKEN ==========
            const encryptedRefresh = tokens.refresh_token 
              ? await encryptToken(tokens.refresh_token)
              : account.refresh_token_encrypted

            await supabase
              .from('connected_accounts')
              .update({
                access_token: tokens.access_token,
                refresh_token_encrypted: encryptedRefresh,
                expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString()
              })
              .eq('id', account.id)
          } else {
            console.error('Failed to refresh token:', tokens)
            failedAccounts++
            continue
          }
        }

        // Fetch calendar events
        const timeMin = new Date()
        timeMin.setMonth(timeMin.getMonth() - 1)
        const timeMax = new Date()
        timeMax.setMonth(timeMax.getMonth() + 3)

        const calendarUrl = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events')
        calendarUrl.searchParams.set('timeMin', timeMin.toISOString())
        calendarUrl.searchParams.set('timeMax', timeMax.toISOString())
        calendarUrl.searchParams.set('singleEvents', 'true')
        calendarUrl.searchParams.set('orderBy', 'startTime')
        calendarUrl.searchParams.set('maxResults', '250')

        const eventsResponse = await fetch(calendarUrl.toString(), {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })

        const eventsData = await eventsResponse.json()

        if (eventsData.error) {
          console.error(`Error fetching events for user ${account.user_id}:`, eventsData.error)
          failedAccounts++
          continue
        }

        // Upsert events with MULTI-TENANT + IDEMPOTENCY
        for (const event of eventsData.items || []) {
          if (event.status === 'cancelled') continue

          const startTime = event.start?.dateTime || event.start?.date
          const endTime = event.end?.dateTime || event.end?.date
          const isAllDay = !event.start?.dateTime

          // IDEMPOTENT upsert using (user_id, provider, external_id)
          await supabase
            .from('calendar_events')
            .upsert({
              user_id: account.user_id,
              workspace_id: workspaceId, // MULTI-TENANT
              external_id: event.id,
              provider: 'google',
              calendar_id: 'primary',
              title: event.summary || 'Untitled Event',
              description: event.description,
              location: event.location,
              start_time: startTime,
              end_time: endTime,
              all_day: isAllDay,
              timezone: event.start?.timeZone || 'Europe/Paris',
              updated_at_provider: event.updated,
              source: 'google'
            }, {
              onConflict: 'user_id,provider,external_id',
              ignoreDuplicates: false
            })

          totalEvents++
        }

      } catch (accountError) {
        console.error(`Error syncing account ${account.id}:`, accountError)
        failedAccounts++
      }
    }

    // Log job completion
    await supabase.from('job_runs').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      records_processed: totalEvents,
      records_failed: failedAccounts,
      metadata: { accounts_synced: (accounts?.length || 0) - failedAccounts }
    }).eq('id', jobRunId)

    return new Response(JSON.stringify({
      success: true,
      events_synced: totalEvents,
      accounts_processed: accounts?.length || 0,
      accounts_failed: failedAccounts
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    const error = err as Error
    console.error('Error:', error)

    await supabase.from('job_runs').update({
      status: 'failed',
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      error_message: error.message
    }).eq('id', jobRunId)

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
