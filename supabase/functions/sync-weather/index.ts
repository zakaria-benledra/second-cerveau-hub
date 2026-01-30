import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getWorkspaceContext } from '../_shared/workspace.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WeatherData {
  weather: string
  temp: number
  humidity: number
  location: string
}

// Simple weather simulation based on date (for demo without API key)
function getSimulatedWeather(date: Date): WeatherData {
  const month = date.getMonth()
  const day = date.getDate()
  const seed = month * 31 + day

  const conditions = ['clear', 'cloudy', 'rain', 'partly_cloudy']
  const weather = conditions[seed % conditions.length]

  // Seasonal temperature simulation
  let baseTemp = 15
  if (month >= 5 && month <= 8) baseTemp = 25
  else if (month >= 11 || month <= 2) baseTemp = 5

  const tempVariation = (seed % 10) - 5
  const temp = baseTemp + tempVariation

  return {
    weather,
    temp,
    humidity: 40 + (seed % 50),
    location: 'Local',
  }
}

// Calculate mood impact based on weather
function calculateMoodIndex(weather: string, temp: number): number {
  let index = 50 // Baseline

  // Weather impact
  switch (weather) {
    case 'clear':
      index += 20
      break
    case 'partly_cloudy':
      index += 10
      break
    case 'cloudy':
      index -= 5
      break
    case 'rain':
      index -= 15
      break
    case 'snow':
      index += 5 // Can be positive for some
      break
  }

  // Temperature impact (comfort zone 18-24°C)
  if (temp >= 18 && temp <= 24) {
    index += 10
  } else if (temp < 10 || temp > 30) {
    index -= 10
  }

  return Math.max(0, Math.min(100, index))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // Auth
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

    const workspaceContext = await getWorkspaceContext(supabase, user.id)
    if (!workspaceContext.workspaceId) {
      return new Response(JSON.stringify({ error: 'No workspace found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json().catch(() => ({}))
    const today = new Date()
    const dateStr = body.date || today.toISOString().split('T')[0]

    // Check if we already have weather for today
    const { data: existing } = await supabase
      .from('weather_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', dateStr)
      .maybeSingle()

    if (existing) {
      return new Response(JSON.stringify({
        success: true,
        cached: true,
        data: existing
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get weather (simulated for now, can integrate real API)
    const weatherData = getSimulatedWeather(today)
    const moodIndex = calculateMoodIndex(weatherData.weather, weatherData.temp)

    // Calculate productivity correlation based on historical data
    const { data: historicalHabits } = await supabase
      .from('habit_logs')
      .select('completed, date')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(30)

    const avgCompletion = historicalHabits?.length
      ? (historicalHabits.filter(h => h.completed).length / historicalHabits.length) * 100
      : 50

    // Simple correlation estimate
    const productivityCorrelation = moodIndex > 50 ? avgCompletion * 1.1 : avgCompletion * 0.9

    // Save weather snapshot
    const { data: snapshot, error: insertError } = await supabase
      .from('weather_snapshots')
      .insert({
        user_id: user.id,
        workspace_id: workspaceContext.workspaceId,
        date: dateStr,
        location: weatherData.location,
        weather: weatherData.weather,
        temp: weatherData.temp,
        humidity: weatherData.humidity,
        mood_index: moodIndex,
        productivity_correlation: productivityCorrelation,
      })
      .select()
      .single()

    if (insertError) throw insertError

    return new Response(JSON.stringify({
      success: true,
      cached: false,
      data: snapshot
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    const error = err as Error
    console.error('Error syncing weather:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
