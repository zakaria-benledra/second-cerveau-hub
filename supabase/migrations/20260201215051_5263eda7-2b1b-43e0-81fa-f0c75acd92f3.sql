-- Add GDPR rights columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS processing_limited boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS processing_limit_scope text,
ADD COLUMN IF NOT EXISTS processing_limit_date timestamptz;

-- Add AI profiling consent columns to sage_user_profile
ALTER TABLE public.sage_user_profile
ADD COLUMN IF NOT EXISTS ai_profiling_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS opt_out_date timestamptz;

-- Create sage_runs table for tracking AI decisions
CREATE TABLE IF NOT EXISTS public.sage_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  context_vector numeric[],
  reasoning text,
  confidence numeric(3,2),
  outcome text,
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sage_runs_user ON public.sage_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_sage_runs_created ON public.sage_runs(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.sage_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage their sage runs"
ON public.sage_runs FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());