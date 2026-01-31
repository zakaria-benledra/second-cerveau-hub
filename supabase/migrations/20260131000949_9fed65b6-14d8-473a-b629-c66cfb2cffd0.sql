-- Create gratitude_entries table for daily gratitude journal
CREATE TABLE public.gratitude_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workspace_id uuid REFERENCES public.workspaces(id),
  date date NOT NULL DEFAULT CURRENT_DATE,
  items text[] NOT NULL, -- Array de 3 gratitudes
  source text DEFAULT 'ui',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Performance indexes
CREATE INDEX idx_gratitude_entries_user_id ON public.gratitude_entries(user_id);
CREATE INDEX idx_gratitude_entries_workspace_id ON public.gratitude_entries(workspace_id);
CREATE INDEX idx_gratitude_entries_date ON public.gratitude_entries(date DESC);

-- Enable RLS
ALTER TABLE public.gratitude_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own gratitude entries"
  ON public.gratitude_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gratitude entries"
  ON public.gratitude_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gratitude entries"
  ON public.gratitude_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own gratitude entries"
  ON public.gratitude_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_gratitude_entries_updated_at
  BEFORE UPDATE ON public.gratitude_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();