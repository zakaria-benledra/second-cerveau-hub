-- Behavioral DNA storage table
CREATE TABLE IF NOT EXISTS public.behavioral_dna (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  dna_data jsonb NOT NULL,
  version integer NOT NULL DEFAULT 1,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_behavioral_dna_user ON public.behavioral_dna(user_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_dna_version ON public.behavioral_dna(user_id, version);

-- Enable RLS
ALTER TABLE public.behavioral_dna ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage their behavioral dna"
ON public.behavioral_dna FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_behavioral_dna_updated_at
  BEFORE UPDATE ON public.behavioral_dna
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();