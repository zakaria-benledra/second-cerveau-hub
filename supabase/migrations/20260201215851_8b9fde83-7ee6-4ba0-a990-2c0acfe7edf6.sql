-- ================================================
-- SAGECORE v1.0 — Database Schema
-- ================================================

-- Profil utilisateur Sage
CREATE TABLE IF NOT EXISTS public.sage_user_profile (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  north_star_identity TEXT NOT NULL DEFAULT 'Une personne disciplinée et épanouie',
  values JSONB DEFAULT '["discipline", "équilibre", "progression"]',
  constraints JSONB DEFAULT '{"max_daily_tasks": 10, "quiet_hours": [22, 7]}',
  communication_style TEXT DEFAULT 'direct' CHECK (communication_style IN ('direct', 'gentle', 'motivational', 'analytical')),
  timezone TEXT DEFAULT 'Europe/Paris',
  ai_profiling_enabled BOOLEAN DEFAULT true,
  processing_limited BOOLEAN DEFAULT false,
  workspace_id UUID REFERENCES public.workspaces(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Faits mémorisés
CREATE TABLE IF NOT EXISTS public.sage_memory_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fact TEXT NOT NULL,
  category TEXT CHECK (category IN ('preference', 'constraint', 'strength', 'weakness')),
  confidence FLOAT CHECK (confidence BETWEEN 0 AND 1) DEFAULT 0.5,
  last_seen TIMESTAMPTZ DEFAULT now(),
  workspace_id UUID REFERENCES public.workspaces(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Patterns détectés
CREATE TABLE IF NOT EXISTS public.sage_memory_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern TEXT NOT NULL,
  evidence JSONB DEFAULT '[]',
  confidence FLOAT CHECK (confidence BETWEEN 0 AND 1) DEFAULT 0.5,
  actionable BOOLEAN DEFAULT true,
  last_seen TIMESTAMPTZ DEFAULT now(),
  workspace_id UUID REFERENCES public.workspaces(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Poids du Policy Engine
CREATE TABLE IF NOT EXISTS public.sage_policy_weights (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  weights JSONB NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, action_type)
);

-- Expériences (pour replay)
CREATE TABLE IF NOT EXISTS public.sage_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  context_vector JSONB NOT NULL,
  action_type TEXT NOT NULL,
  reward FLOAT,
  metrics_before JSONB,
  metrics_after JSONB,
  workspace_id UUID REFERENCES public.workspaces(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Runs (observabilité) - créer avant sage_feedback
CREATE TABLE IF NOT EXISTS public.sage_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill TEXT,
  model_engine TEXT DEFAULT 'gemini',
  json_valid BOOLEAN,
  retry_count INT DEFAULT 0,
  latency_ms INT,
  action_type TEXT,
  confidence FLOAT,
  reasoning TEXT,
  safety_blocked BOOLEAN DEFAULT false,
  safety_reason TEXT,
  workspace_id UUID REFERENCES public.workspaces(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Feedback utilisateur
CREATE TABLE IF NOT EXISTS public.sage_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  run_id UUID REFERENCES public.sage_runs(id) ON DELETE SET NULL,
  helpful BOOLEAN,
  ignored BOOLEAN,
  action_type TEXT,
  workspace_id UUID REFERENCES public.workspaces(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- ROW LEVEL SECURITY
-- ================================================

ALTER TABLE public.sage_user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sage_memory_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sage_memory_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sage_policy_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sage_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sage_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sage_runs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Users can access own profile" ON public.sage_user_profile;
CREATE POLICY "Users can access own profile" ON public.sage_user_profile
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can access own facts" ON public.sage_memory_facts;
CREATE POLICY "Users can access own facts" ON public.sage_memory_facts
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can access own patterns" ON public.sage_memory_patterns;
CREATE POLICY "Users can access own patterns" ON public.sage_memory_patterns
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can access own weights" ON public.sage_policy_weights;
CREATE POLICY "Users can access own weights" ON public.sage_policy_weights
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can access own experiences" ON public.sage_experiences;
CREATE POLICY "Users can access own experiences" ON public.sage_experiences
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can access own feedback" ON public.sage_feedback;
CREATE POLICY "Users can access own feedback" ON public.sage_feedback
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can access own runs" ON public.sage_runs;
CREATE POLICY "Users can access own runs" ON public.sage_runs
  FOR ALL USING (auth.uid() = user_id);

-- ================================================
-- INDEXES
-- ================================================

CREATE INDEX IF NOT EXISTS idx_sage_experiences_user_created ON public.sage_experiences(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sage_runs_user_created ON public.sage_runs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sage_feedback_run ON public.sage_feedback(run_id);
CREATE INDEX IF NOT EXISTS idx_sage_memory_facts_user ON public.sage_memory_facts(user_id);
CREATE INDEX IF NOT EXISTS idx_sage_memory_patterns_user ON public.sage_memory_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_sage_policy_weights_user ON public.sage_policy_weights(user_id);

-- ================================================
-- TRIGGERS for updated_at
-- ================================================

CREATE OR REPLACE FUNCTION public.update_sage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_sage_user_profile_updated_at ON public.sage_user_profile;
CREATE TRIGGER update_sage_user_profile_updated_at
  BEFORE UPDATE ON public.sage_user_profile
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sage_updated_at();