-- Fix the fn_update_daily_stats function to use the correct unique constraint
-- The daily_stats table has UNIQUE (user_id, workspace_id, date) but the function uses ON CONFLICT (user_id, date)

CREATE OR REPLACE FUNCTION public.fn_update_daily_stats()
RETURNS TRIGGER AS $$
DECLARE
  stat_date date;
  user_uuid uuid;
  ws_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    user_uuid := OLD.user_id;
    ws_id := OLD.workspace_id;
    stat_date := CURRENT_DATE;
  ELSE
    user_uuid := NEW.user_id;
    ws_id := NEW.workspace_id;
    stat_date := CURRENT_DATE;
  END IF;

  -- Use the correct unique constraint (user_id, workspace_id, date)
  INSERT INTO public.daily_stats (user_id, workspace_id, date, tasks_planned, tasks_completed, habits_completed, habits_total)
  VALUES (user_uuid, ws_id, stat_date, 0, 0, 0, 0)
  ON CONFLICT (user_id, workspace_id, date) DO UPDATE SET updated_at = now();

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;