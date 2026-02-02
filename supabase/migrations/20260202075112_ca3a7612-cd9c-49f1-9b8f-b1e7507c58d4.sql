-- Create suggestion_feedback table for AI learning loop
CREATE TABLE IF NOT EXISTS public.suggestion_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id),
  suggestion_id TEXT NOT NULL,
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('coach', 'journal', 'proposal', 'insight')),
  rating INTEGER NOT NULL CHECK (rating IN (-1, 0, 1)),
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_feedback_user ON public.suggestion_feedback(user_id);
CREATE INDEX idx_feedback_type ON public.suggestion_feedback(suggestion_type);
CREATE INDEX idx_feedback_rating ON public.suggestion_feedback(rating);
CREATE INDEX idx_feedback_workspace ON public.suggestion_feedback(workspace_id);

-- Enable RLS
ALTER TABLE public.suggestion_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for user access
CREATE POLICY "Users manage own feedback" ON public.suggestion_feedback
  FOR ALL USING (auth.uid() = user_id);