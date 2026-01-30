import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'start'

    // Get Google OAuth credentials from secrets
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
    const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI') || `${Deno.env.get('SUPABASE_URL')}/functions/v1/connect-google?action=callback`

    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({ 
        error: 'Google OAuth not configured',
        message: 'Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET secrets'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'start') {
      // Generate OAuth URL
      const scopes = [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events.readonly'
      ]
      
      const state = btoa(JSON.stringify({ userId: user.id, timestamp: Date.now() }))
      
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      authUrl.searchParams.set('client_id', clientId)
      authUrl.searchParams.set('redirect_uri', redirectUri)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('scope', scopes.join(' '))
      authUrl.searchParams.set('access_type', 'offline')
      authUrl.searchParams.set('prompt', 'consent')
      authUrl.searchParams.set('state', state)

      return new Response(JSON.stringify({ 
        authUrl: authUrl.toString(),
        message: 'Redirect user to this URL to connect Google Calendar'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'callback') {
      const code = url.searchParams.get('code')
      const state = url.searchParams.get('state')
      
      if (!code) {
        return new Response(JSON.stringify({ error: 'No authorization code provided' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      })

      const tokens = await tokenResponse.json()

      if (tokens.error) {
        return new Response(JSON.stringify({ error: tokens.error_description || tokens.error }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Get user info from Google
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${tokens.access_token}` }
      })
      const googleUser = await userInfoResponse.json()

      // Store connected account
      const { data, error } = await supabase
        .from('connected_accounts')
        .upsert({
          user_id: user.id,
          provider: 'google',
          provider_account_id: googleUser.id,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          scopes: tokens.scope?.split(' ') || [],
          metadata: { email: googleUser.email, name: googleUser.name }
        }, {
          onConflict: 'user_id,provider,provider_account_id'
        })
        .select()
        .single()

      if (error) throw error

      // Log to audit
      await supabase.from('audit_log').insert({
        user_id: user.id,
        action: 'CONNECT',
        entity: 'connected_accounts',
        entity_id: data.id,
        new_value: { provider: 'google', email: googleUser.email }
      })

      // Redirect back to app
      const appUrl = Deno.env.get('APP_URL') || 'http://localhost:8080'
      return new Response(null, {
        status: 302,
        headers: { 
          ...corsHeaders,
          'Location': `${appUrl}/calendar?connected=google`
        }
      })
    }

    if (action === 'disconnect') {
      const { error } = await supabase
        .from('connected_accounts')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', 'google')

      if (error) throw error

      return new Response(JSON.stringify({ success: true, message: 'Google account disconnected' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'status') {
      const { data } = await supabase
        .from('connected_accounts')
        .select('id, provider, metadata, expires_at, created_at')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .single()

      return new Response(JSON.stringify({ 
        connected: !!data,
        account: data ? {
          email: data.metadata?.email,
          connectedAt: data.created_at,
          expiresAt: data.expires_at
        } : null
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    const error = err as Error
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
