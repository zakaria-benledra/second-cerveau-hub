-- Cache table for AI suggestions to improve response time
CREATE TABLE IF NOT EXISTS ai_suggestions_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  cache_key TEXT NOT NULL,
  suggestions JSONB NOT NULL,
  context_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '1 hour'),
  UNIQUE(user_id, cache_key)
);

-- Indexes for performance
CREATE INDEX idx_cache_user_key ON ai_suggestions_cache(user_id, cache_key);
CREATE INDEX idx_cache_expires ON ai_suggestions_cache(expires_at);

-- Enable RLS
ALTER TABLE ai_suggestions_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can access their own cache
CREATE POLICY "Users access own cache" ON ai_suggestions_cache
  FOR ALL USING (auth.uid() = user_id);