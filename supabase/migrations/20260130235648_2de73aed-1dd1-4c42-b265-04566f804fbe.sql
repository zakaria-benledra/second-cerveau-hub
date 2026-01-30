-- Create challenges table for personal challenges
CREATE TABLE public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workspace_id uuid REFERENCES public.workspaces(id),
  name text NOT NULL,
  description text,
  duration integer NOT NULL, -- en jours
  days_completed integer DEFAULT 0,
  reward text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  started_at date DEFAULT CURRENT_DATE,
  completed_at date,
  source text DEFAULT 'ui',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- Create challenge_logs table for daily tracking
CREATE TABLE public.challenge_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL, -- denormalized for RLS
  workspace_id uuid REFERENCES public.workspaces(id),
  date date NOT NULL,
  completed boolean DEFAULT false,
  note text,
  source text DEFAULT 'ui',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, date)
);

-- Performance indexes for challenges
CREATE INDEX idx_challenges_user_id ON public.challenges(user_id);
CREATE INDEX idx_challenges_workspace_id ON public.challenges(workspace_id);
CREATE INDEX idx_challenges_status ON public.challenges(status);
CREATE INDEX idx_challenges_started_at ON public.challenges(started_at DESC);

-- Performance indexes for challenge_logs
CREATE INDEX idx_challenge_logs_challenge_id ON public.challenge_logs(challenge_id);
CREATE INDEX idx_challenge_logs_user_id ON public.challenge_logs(user_id);
CREATE INDEX idx_challenge_logs_date ON public.challenge_logs(date DESC);

-- Enable RLS on challenges
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Challenges RLS policies
CREATE POLICY "Users can view own challenges"
  ON public.challenges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenges"
  ON public.challenges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenges"
  ON public.challenges FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own challenges"
  ON public.challenges FOR DELETE
  USING (auth.uid() = user_id);

-- Enable RLS on challenge_logs
ALTER TABLE public.challenge_logs ENABLE ROW LEVEL SECURITY;

-- Challenge logs RLS policies (using denormalized user_id to avoid recursion)
CREATE POLICY "Users can view own challenge logs"
  ON public.challenge_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenge logs"
  ON public.challenge_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenge logs"
  ON public.challenge_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own challenge logs"
  ON public.challenge_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at on challenges
CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON public.challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();