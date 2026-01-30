-- ============================================
-- 5 MANDATORY AUTOMATION RULES (SEED DATA)
-- ============================================

-- Insert default automation rules for each trigger type
CREATE TABLE IF NOT EXISTS public.automation_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  trigger_event text NOT NULL,
  trigger_conditions jsonb NOT NULL DEFAULT '{}',
  action_type text NOT NULL,
  action_payload jsonb NOT NULL DEFAULT '{}',
  priority integer DEFAULT 0,
  is_default boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.automation_templates (name, trigger_event, trigger_conditions, action_type, action_payload, priority) VALUES
('Rattrapage habitude manquée', 'habit.missed', '{"min_missed": 1}', 'create_task', '{"title": "Rattraper habitude: {{habit_name}}", "priority": "medium"}', 10),
('Alerte budget', 'budget.threshold_reached', '{"threshold_percent": 80}', 'notify_and_propose', '{"type": "warning", "title": "Budget à {{percent}}%"}', 20),
('Jour surchargé', 'day.overloaded', '{"max_tasks": 10}', 'ai_proposal', '{"type": "reschedule_overload", "title": "Réorganiser la journée"}', 15),
('Réengagement inactivité', 'user.inactive', '{"days": 7}', 'send_notification', '{"type": "info", "title": "Vous nous manquez!"}', 5),
('Célébration objectif', 'goal.achieved', '{}', 'reward_prompt', '{"type": "success", "title": "🎉 Objectif atteint!"}', 25)
ON CONFLICT DO NOTHING;

-- ============================================
-- STATS AUTO-UPDATE FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.fn_update_daily_stats()
RETURNS TRIGGER AS $$
DECLARE
  stat_date date;
  user_uuid uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    user_uuid := OLD.user_id;
    stat_date := CURRENT_DATE;
  ELSE
    user_uuid := NEW.user_id;
    stat_date := CURRENT_DATE;
  END IF;

  INSERT INTO public.daily_stats (user_id, date, tasks_planned, tasks_completed, habits_completed, habits_total)
  VALUES (user_uuid, stat_date, 0, 0, 0, 0)
  ON CONFLICT (user_id, date) DO UPDATE SET updated_at = now();

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply stats trigger to tasks
DROP TRIGGER IF EXISTS update_stats_on_task ON public.tasks;
CREATE TRIGGER update_stats_on_task
AFTER INSERT OR UPDATE OR DELETE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.fn_update_daily_stats();

-- Apply stats trigger to habit_logs
DROP TRIGGER IF EXISTS update_stats_on_habit_log ON public.habit_logs;
CREATE TRIGGER update_stats_on_habit_log
AFTER INSERT OR UPDATE OR DELETE ON public.habit_logs
FOR EACH ROW EXECUTE FUNCTION public.fn_update_daily_stats();

-- ============================================
-- GDPR FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.export_user_data(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'profile', (SELECT to_jsonb(p) FROM profiles p WHERE p.user_id = target_user_id),
    'preferences', (SELECT to_jsonb(pr) FROM preferences pr WHERE pr.user_id = target_user_id),
    'tasks', (SELECT jsonb_agg(t) FROM tasks t WHERE t.user_id = target_user_id),
    'habits', (SELECT jsonb_agg(h) FROM habits h WHERE h.user_id = target_user_id),
    'habit_logs', (SELECT jsonb_agg(hl) FROM habit_logs hl WHERE hl.user_id = target_user_id),
    'projects', (SELECT jsonb_agg(p) FROM projects p WHERE p.user_id = target_user_id),
    'goals', (SELECT jsonb_agg(g) FROM goals g WHERE g.user_id = target_user_id),
    'journal_entries', (SELECT jsonb_agg(j) FROM journal_entries j WHERE j.user_id = target_user_id),
    'finance_transactions', (SELECT jsonb_agg(f) FROM finance_transactions f WHERE f.user_id = target_user_id)
  ) INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_user_data(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.agent_actions WHERE user_id = target_user_id;
  DELETE FROM public.ai_proposals WHERE user_id = target_user_id;
  DELETE FROM public.automation_events WHERE user_id = target_user_id;
  DELETE FROM public.automation_rules WHERE user_id = target_user_id;
  DELETE FROM public.system_events WHERE user_id = target_user_id;
  DELETE FROM public.audit_log WHERE user_id = target_user_id;
  DELETE FROM public.notifications WHERE user_id = target_user_id;
  DELETE FROM public.scores_monthly WHERE user_id = target_user_id;
  DELETE FROM public.scores_weekly WHERE user_id = target_user_id;
  DELETE FROM public.scores_daily WHERE user_id = target_user_id;
  DELETE FROM public.daily_stats WHERE user_id = target_user_id;
  DELETE FROM public.focus_sessions WHERE user_id = target_user_id;
  DELETE FROM public.habit_logs WHERE user_id = target_user_id;
  DELETE FROM public.streaks WHERE user_id = target_user_id;
  DELETE FROM public.habits WHERE user_id = target_user_id;
  DELETE FROM public.routine_logs WHERE user_id = target_user_id;
  DELETE FROM public.routines WHERE user_id = target_user_id;
  DELETE FROM public.journal_entries WHERE user_id = target_user_id;
  DELETE FROM public.calendar_events WHERE user_id = target_user_id;
  DELETE FROM public.budgets WHERE user_id = target_user_id;
  DELETE FROM public.finance_transactions WHERE user_id = target_user_id;
  DELETE FROM public.finance_categories WHERE user_id = target_user_id;
  DELETE FROM public.inbox_items WHERE user_id = target_user_id;
  DELETE FROM public.tasks WHERE user_id = target_user_id;
  DELETE FROM public.goals WHERE user_id = target_user_id;
  DELETE FROM public.projects WHERE user_id = target_user_id;
  DELETE FROM public.domains WHERE user_id = target_user_id;
  DELETE FROM public.preferences WHERE user_id = target_user_id;
  DELETE FROM public.profiles WHERE user_id = target_user_id;
  RETURN true;
END;
$$;