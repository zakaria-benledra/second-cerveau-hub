-- Create user_learning_profile table for adaptive AI learning
CREATE TABLE IF NOT EXISTS public.user_learning_profile (
  user_id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id),
  
  -- Preference scores by suggestion type (0-100)
  pref_coach_motivation REAL DEFAULT 50,
  pref_coach_practical REAL DEFAULT 50,
  pref_coach_analytical REAL DEFAULT 50,
  
  pref_journal_introspection REAL DEFAULT 50,
  pref_journal_gratitude REAL DEFAULT 50,
  pref_journal_goals REAL DEFAULT 50,
  
  -- Detected patterns
  best_engagement_time TEXT,  -- 'morning', 'afternoon', 'evening'
  preferred_tone TEXT DEFAULT 'balanced',  -- 'supportive', 'challenging', 'balanced'
  response_length_pref TEXT DEFAULT 'medium',  -- 'short', 'medium', 'detailed'
  
  -- Metrics
  total_interactions INTEGER DEFAULT 0,
  positive_feedback_rate REAL DEFAULT 0.5,
  last_updated TIMESTAMPTZ DEFAULT now(),
  
  learning_data JSONB DEFAULT '{}'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_learning_profile_workspace ON public.user_learning_profile(workspace_id);

-- Enable RLS
ALTER TABLE public.user_learning_profile ENABLE ROW LEVEL SECURITY;

-- RLS policy for users to view their own learning profile
CREATE POLICY "Users view own learning" ON public.user_learning_profile 
  FOR SELECT USING (auth.uid() = user_id);

-- Trigger function to update learning profile after feedback
CREATE OR REPLACE FUNCTION public.update_learning_profile()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  positive_count INTEGER;
  neutral_count INTEGER;
  negative_count INTEGER;
  total_count INTEGER;
  new_rate REAL;
  best_hour INTEGER;
  best_time TEXT;
BEGIN
  -- Count feedbacks by rating
  SELECT 
    COUNT(*) FILTER (WHERE rating = 1),
    COUNT(*) FILTER (WHERE rating = 0),
    COUNT(*) FILTER (WHERE rating = -1),
    COUNT(*)
  INTO positive_count, neutral_count, negative_count, total_count
  FROM public.suggestion_feedback
  WHERE user_id = NEW.user_id;

  -- Calculate positive feedback rate (positive / total)
  new_rate := CASE WHEN total_count > 0 THEN positive_count::REAL / total_count ELSE 0.5 END;

  -- Determine best engagement time based on positive feedback timestamps
  SELECT EXTRACT(HOUR FROM created_at)::INTEGER
  INTO best_hour
  FROM public.suggestion_feedback
  WHERE user_id = NEW.user_id AND rating = 1
  GROUP BY EXTRACT(HOUR FROM created_at)
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  best_time := CASE 
    WHEN best_hour IS NULL THEN NULL
    WHEN best_hour < 12 THEN 'morning'
    WHEN best_hour < 18 THEN 'afternoon'
    ELSE 'evening'
  END;

  -- Upsert the learning profile
  INSERT INTO public.user_learning_profile (
    user_id, 
    total_interactions, 
    positive_feedback_rate, 
    best_engagement_time,
    last_updated
  )
  VALUES (NEW.user_id, total_count, new_rate, best_time, now())
  ON CONFLICT (user_id) DO UPDATE SET
    total_interactions = total_count,
    positive_feedback_rate = new_rate,
    best_engagement_time = COALESCE(best_time, public.user_learning_profile.best_engagement_time),
    last_updated = now();

  RETURN NEW;
END;
$$;

-- Create trigger on suggestion_feedback
CREATE TRIGGER on_feedback_update_learning
  AFTER INSERT ON public.suggestion_feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_learning_profile();