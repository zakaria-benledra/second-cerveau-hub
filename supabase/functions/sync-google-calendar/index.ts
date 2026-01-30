import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

    // If called with auth, sync only that user. Otherwise sync all users (cron)
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
        // Check if token needs refresh
        let accessToken = account.access_token
        if (new Date(account.expires_at) < new Date()) {
          // Refresh token
          const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              refresh_token: account.refresh_token,
              client_id: clientId!,
              client_secret: clientSecret!,
              grant_type: 'refresh_token'
            })
          })

          const tokens = await refreshResponse.json()
          if (tokens.access_token) {
            accessToken = tokens.access_token
            // Update stored token
            await supabase
              .from('connected_accounts')
              .update({
                access_token: tokens.access_token,
                expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString()
              })
              .eq('id', account.id)
          }
        }

        // Fetch calendar events
        const timeMin = new Date()
        timeMin.setMonth(timeMin.getMonth() - 1) // Last month
        const timeMax = new Date()
        timeMax.setMonth(timeMax.getMonth() + 3) // Next 3 months

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

        // Upsert events
        for (const event of eventsData.items || []) {
          if (event.status === 'cancelled') continue

          const startTime = event.start?.dateTime || event.start?.date
          const endTime = event.end?.dateTime || event.end?.date
          const isAllDay = !event.start?.dateTime

          await supabase
            .from('calendar_events')
            .upsert({
              user_id: account.user_id,
              workspace_id: account.workspace_id,
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
