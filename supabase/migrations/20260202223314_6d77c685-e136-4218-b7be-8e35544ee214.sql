-- Add personalization columns to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS personalization_level TEXT 
DEFAULT 'balanced' 
CHECK (personalization_level IN ('conservative', 'balanced', 'exploratory'));

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS ai_preferences JSONB DEFAULT '{
  "suggestion_frequency": "normal",
  "exploration_enabled": true,
  "explain_suggestions": true
}'::jsonb;

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS location_city TEXT;

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS location_country TEXT;

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS birth_year INTEGER;

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'prefer_not_to_say';

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_personalization 
ON public.user_profiles(personalization_level);