-- Create user_preferences table for storing user settings and onboarding state
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  workspace_id UUID REFERENCES public.workspaces(id),
  
  -- Onboarding state
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Transformation goals (0-100 sliders)
  goal_discipline INTEGER DEFAULT 50 CHECK (goal_discipline >= 0 AND goal_discipline <= 100),
  goal_financial_stability INTEGER DEFAULT 50 CHECK (goal_financial_stability >= 0 AND goal_financial_stability <= 100),
  goal_mental_balance INTEGER DEFAULT 50 CHECK (goal_mental_balance >= 0 AND goal_mental_balance <= 100),
  
  -- Other preferences
  theme TEXT DEFAULT 'dark',
  notifications_enabled BOOLEAN DEFAULT true,
  sound_enabled BOOLEAN DEFAULT true,
  
  -- Metadata
  source TEXT DEFAULT 'ui',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for fast lookup
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();