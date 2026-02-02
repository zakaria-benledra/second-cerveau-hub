-- Add personalization level and AI preferences to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS personalization_level TEXT 
  DEFAULT 'balanced' 
  CHECK (personalization_level IN ('conservative', 'balanced', 'exploratory'));

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_preferences JSONB DEFAULT '{
  "suggestion_frequency": "normal",
  "exploration_enabled": true,
  "explain_suggestions": true
}'::jsonb;