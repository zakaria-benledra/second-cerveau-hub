-- Sage Memory System Tables

-- User profile for Sage personalization
CREATE TABLE public.sage_user_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  north_star_identity text NOT NULL DEFAULT 'Une personne disciplinée et épanouie',
  values text[] DEFAULT ARRAY['discipline', 'équilibre', 'progression'],
  constraints jsonb DEFAULT '{"max_daily_tasks": 10, "quiet_hours": [22, 7]}'::jsonb,
  communication_style text DEFAULT 'direct' CHECK (communication_style IN ('direct', 'gentle', 'motivational', 'analytical')),
  timezone text DEFAULT 'Europe/Paris',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Memory facts learned about the user
CREATE TABLE public.sage_memory_facts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  fact text NOT NULL,
  category text NOT NULL CHECK (category IN ('preference', 'constraint', 'strength', 'weakness')),
  confidence numeric(3,2) NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  last_seen timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  source text DEFAULT 'inference'
);

-- Patterns detected in user behavior
CREATE TABLE public.sage_memory_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  pattern text NOT NULL,
  evidence text[] DEFAULT ARRAY[]::text[],
  confidence numeric(3,2) NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  actionable boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Feedback on Sage interventions
CREATE TABLE public.sage_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  run_id text NOT NULL,
  helpful boolean DEFAULT false,
  ignored boolean DEFAULT false,
  action_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_sage_profile_user ON public.sage_user_profile(user_id);
CREATE INDEX idx_sage_facts_user ON public.sage_memory_facts(user_id);
CREATE INDEX idx_sage_facts_confidence ON public.sage_memory_facts(user_id, confidence DESC);
CREATE INDEX idx_sage_patterns_user ON public.sage_memory_patterns(user_id);
CREATE INDEX idx_sage_patterns_confidence ON public.sage_memory_patterns(user_id, confidence DESC);
CREATE INDEX idx_sage_feedback_user ON public.sage_feedback(user_id);
CREATE INDEX idx_sage_feedback_created ON public.sage_feedback(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.sage_user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sage_memory_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sage_memory_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sage_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own data
CREATE POLICY "Users can manage their sage profile"
ON public.sage_user_profile FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage their sage facts"
ON public.sage_memory_facts FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage their sage patterns"
ON public.sage_memory_patterns FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage their sage feedback"
ON public.sage_feedback FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_sage_profile_updated_at
  BEFORE UPDATE ON public.sage_user_profile
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sage_patterns_updated_at
  BEFORE UPDATE ON public.sage_memory_patterns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();