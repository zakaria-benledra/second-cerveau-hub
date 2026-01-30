-- Add streak freeze feature to habits table
ALTER TABLE public.habits 
ADD COLUMN IF NOT EXISTS streak_freezes_available integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_freeze_reset_date date DEFAULT CURRENT_DATE;

-- Create streak freeze logs table
CREATE TABLE IF NOT EXISTS public.habit_streak_freezes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id uuid REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  workspace_id uuid REFERENCES public.workspaces(id),
  date date NOT NULL DEFAULT CURRENT_DATE,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_habit_streak_freezes_habit_date 
ON public.habit_streak_freezes(habit_id, date);

CREATE INDEX IF NOT EXISTS idx_habit_streak_freezes_user
ON public.habit_streak_freezes(user_id);

-- Enable RLS
ALTER TABLE public.habit_streak_freezes ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own streak freezes"
ON public.habit_streak_freezes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streak freezes"
ON public.habit_streak_freezes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Function to reset weekly freezes (to be called by cron on Mondays)
CREATE OR REPLACE FUNCTION public.reset_weekly_streak_freezes()
RETURNS void AS $$
BEGIN
  UPDATE public.habits
  SET 
    streak_freezes_available = 1,
    last_freeze_reset_date = CURRENT_DATE
  WHERE 
    EXTRACT(DOW FROM CURRENT_DATE) = 1 -- Monday
    AND (last_freeze_reset_date IS NULL OR last_freeze_reset_date < CURRENT_DATE)
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to use a streak freeze
CREATE OR REPLACE FUNCTION public.use_streak_freeze(p_habit_id uuid, p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_freezes_available integer;
  v_workspace_id uuid;
BEGIN
  -- Check available freezes
  SELECT streak_freezes_available, workspace_id 
  INTO v_freezes_available, v_workspace_id
  FROM public.habits
  WHERE id = p_habit_id AND user_id = p_user_id AND deleted_at IS NULL;
  
  IF v_freezes_available IS NULL THEN
    RETURN false;
  END IF;
  
  IF v_freezes_available <= 0 THEN
    RETURN false;
  END IF;
  
  -- Use the freeze
  UPDATE public.habits
  SET streak_freezes_available = streak_freezes_available - 1
  WHERE id = p_habit_id AND user_id = p_user_id;
  
  -- Log the freeze usage
  INSERT INTO public.habit_streak_freezes (habit_id, user_id, workspace_id, date)
  VALUES (p_habit_id, p_user_id, v_workspace_id, CURRENT_DATE);
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;