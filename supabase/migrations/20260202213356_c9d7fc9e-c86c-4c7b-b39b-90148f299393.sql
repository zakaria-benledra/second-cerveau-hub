-- Weather cache table for API responses
CREATE TABLE IF NOT EXISTS public.weather_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_key TEXT NOT NULL,
  weather_data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '3 hours'),
  UNIQUE(location_key)
);

-- Index for expiration cleanup
CREATE INDEX idx_weather_cache_expires ON public.weather_cache(expires_at);
CREATE INDEX idx_weather_cache_location ON public.weather_cache(location_key);

-- RLS (public read for weather data, no user-specific data)
ALTER TABLE public.weather_cache ENABLE ROW LEVEL SECURITY;

-- Allow reading cached weather (non-sensitive)
CREATE POLICY "Weather cache readable by authenticated users" 
  ON public.weather_cache FOR SELECT 
  TO authenticated 
  USING (true);

-- Only service role can insert/update
CREATE POLICY "Weather cache writable by service role" 
  ON public.weather_cache FOR ALL 
  TO service_role 
  USING (true);