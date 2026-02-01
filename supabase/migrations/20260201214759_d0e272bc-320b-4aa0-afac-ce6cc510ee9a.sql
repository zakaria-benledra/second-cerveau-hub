-- Sage Experience Store Tables

-- Table for storing learning experiences
CREATE TABLE public.sage_experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  context_vector numeric[] NOT NULL,
  action_type text NOT NULL,
  reward numeric NOT NULL DEFAULT 0,
  metrics_before jsonb DEFAULT '{}'::jsonb,
  metrics_after jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table for storing policy weights per user
CREATE TABLE public.sage_policy_weights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  weights numeric[] NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, action_type)
);

-- Indexes for performance
CREATE INDEX idx_sage_experiences_user ON public.sage_experiences(user_id);
CREATE INDEX idx_sage_experiences_created ON public.sage_experiences(user_id, created_at DESC);
CREATE INDEX idx_sage_experiences_action ON public.sage_experiences(user_id, action_type);
CREATE INDEX idx_sage_weights_user ON public.sage_policy_weights(user_id);

-- Enable RLS
ALTER TABLE public.sage_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sage_policy_weights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their sage experiences"
ON public.sage_experiences FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage their sage weights"
ON public.sage_policy_weights FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_sage_weights_updated_at
  BEFORE UPDATE ON public.sage_policy_weights
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();