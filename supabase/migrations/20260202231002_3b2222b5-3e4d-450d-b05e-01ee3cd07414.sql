-- Ensure no NULLs exist before adding constraints (safety)
UPDATE user_profiles SET personalization_level = 'balanced' WHERE personalization_level IS NULL;
UPDATE user_profiles SET ai_preferences = '{"suggestion_frequency": "normal", "exploration_enabled": true, "explain_suggestions": true}'::jsonb WHERE ai_preferences IS NULL;
UPDATE user_profiles SET interests = '{}' WHERE interests IS NULL;
UPDATE user_profiles SET gender = 'prefer_not_to_say' WHERE gender IS NULL;

-- Add NOT NULL constraints to prevent future NULLs
ALTER TABLE user_profiles ALTER COLUMN personalization_level SET NOT NULL;
ALTER TABLE user_profiles ALTER COLUMN ai_preferences SET NOT NULL;
ALTER TABLE user_profiles ALTER COLUMN interests SET NOT NULL;