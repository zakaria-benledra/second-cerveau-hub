-- Fix: Drop existing policy before recreating (idempotent)
DROP POLICY IF EXISTS "Users can manage own weekly stats" ON public.weekly_stats;
DROP POLICY IF EXISTS "Users can view own system events" ON public.system_events;
DROP POLICY IF EXISTS "Backend can insert system events" ON public.system_events;

-- Recreate policies
CREATE POLICY "Users can manage own weekly stats" 
ON public.weekly_stats FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own system events" 
ON public.system_events FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own system events" 
ON public.system_events FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add missing index on calendar_events for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS calendar_events_user_provider_external 
ON public.calendar_events (user_id, provider, external_id) 
WHERE external_id IS NOT NULL;