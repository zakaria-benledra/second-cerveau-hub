-- Backfill any potential NULLs (safety)
UPDATE user_profiles SET personalization_level = 'balanced' WHERE personalization_level IS NULL;
UPDATE user_profiles SET ai_preferences = '{"suggestion_frequency":"normal","exploration_enabled":true,"explain_suggestions":true}'::jsonb WHERE ai_preferences IS NULL;
UPDATE user_profiles SET interests = '{}' WHERE interests IS NULL;

-- Add NOT NULL constraints (if not already set)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'personalization_level' AND is_nullable = 'YES') THEN
    ALTER TABLE user_profiles ALTER COLUMN personalization_level SET NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'ai_preferences' AND is_nullable = 'YES') THEN
    ALTER TABLE user_profiles ALTER COLUMN ai_preferences SET NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'interests' AND is_nullable = 'YES') THEN
    ALTER TABLE user_profiles ALTER COLUMN interests SET NOT NULL;
  END IF;
END $$;

-- Create GIN index for faster JSONB queries on ai_preferences
CREATE INDEX IF NOT EXISTS idx_user_profiles_ai_prefs ON user_profiles USING GIN (ai_preferences);