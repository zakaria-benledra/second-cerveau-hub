-- Create wins table for tracking user victories
CREATE TABLE public.wins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workspace_id uuid REFERENCES public.workspaces(id),
  title text NOT NULL,
  description text,
  category text CHECK (category IN ('habit', 'task', 'goal', 'finance', 'health', 'other')),
  tags text[] DEFAULT '{}',
  achieved_at date NOT NULL DEFAULT CURRENT_DATE,
  score_impact integer DEFAULT 0,
  source text DEFAULT 'ui',
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- Performance indexes
CREATE INDEX idx_wins_user_id ON public.wins(user_id);
CREATE INDEX idx_wins_workspace_id ON public.wins(workspace_id);
CREATE INDEX idx_wins_achieved_at ON public.wins(achieved_at DESC);
CREATE INDEX idx_wins_category ON public.wins(category);

-- Enable RLS
ALTER TABLE public.wins ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own wins"
  ON public.wins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wins"
  ON public.wins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wins"
  ON public.wins FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wins"
  ON public.wins FOR DELETE
  USING (auth.uid() = user_id);