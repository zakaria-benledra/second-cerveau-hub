-- MILESTONE 3: Comprehensive Audit Triggers for All Mutable Tables
-- ==================================================================

-- Drop existing triggers if they exist to recreate them properly
DROP TRIGGER IF EXISTS audit_tasks ON public.tasks;
DROP TRIGGER IF EXISTS audit_habits ON public.habits;
DROP TRIGGER IF EXISTS audit_habit_logs ON public.habit_logs;
DROP TRIGGER IF EXISTS audit_projects ON public.projects;
DROP TRIGGER IF EXISTS audit_goals ON public.goals;
DROP TRIGGER IF EXISTS audit_routines ON public.routines;
DROP TRIGGER IF EXISTS audit_routine_logs ON public.routine_logs;
DROP TRIGGER IF EXISTS audit_focus_sessions ON public.focus_sessions;
DROP TRIGGER IF EXISTS audit_journal_entries ON public.journal_entries;
DROP TRIGGER IF EXISTS audit_calendar_events ON public.calendar_events;
DROP TRIGGER IF EXISTS audit_finance_transactions ON public.finance_transactions;
DROP TRIGGER IF EXISTS audit_finance_categories ON public.finance_categories;
DROP TRIGGER IF EXISTS audit_budgets ON public.budgets;
DROP TRIGGER IF EXISTS audit_inbox_items ON public.inbox_items;
DROP TRIGGER IF EXISTS audit_notifications ON public.notifications;
DROP TRIGGER IF EXISTS audit_ai_proposals ON public.ai_proposals;
DROP TRIGGER IF EXISTS audit_agent_actions ON public.agent_actions;
DROP TRIGGER IF EXISTS audit_automation_rules ON public.automation_rules;
DROP TRIGGER IF EXISTS audit_streaks ON public.streaks;
DROP TRIGGER IF EXISTS audit_domains ON public.domains;
DROP TRIGGER IF EXISTS audit_preferences ON public.preferences;

-- Create the comprehensive audit function
CREATE OR REPLACE FUNCTION public.fn_comprehensive_audit()
RETURNS TRIGGER AS $$
DECLARE
  audit_user_id uuid;
BEGIN
  -- Get user_id from the record or from auth context
  IF TG_OP = 'DELETE' THEN
    audit_user_id := COALESCE(OLD.user_id, auth.uid());
    INSERT INTO public.audit_log (user_id, action, entity, entity_id, old_value, created_at)
    VALUES (audit_user_id, 'delete', TG_TABLE_NAME, OLD.id, to_jsonb(OLD), now());
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    audit_user_id := COALESCE(NEW.user_id, auth.uid());
    INSERT INTO public.audit_log (user_id, action, entity, entity_id, old_value, new_value, created_at)
    VALUES (audit_user_id, 'update', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW), now());
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    audit_user_id := COALESCE(NEW.user_id, auth.uid());
    INSERT INTO public.audit_log (user_id, action, entity, entity_id, new_value, created_at)
    VALUES (audit_user_id, 'create', TG_TABLE_NAME, NEW.id, to_jsonb(NEW), now());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for all mutable core tables
CREATE TRIGGER audit_tasks
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.fn_comprehensive_audit();

CREATE TRIGGER audit_habits
  AFTER INSERT OR UPDATE OR DELETE ON public.habits
  FOR EACH ROW EXECUTE FUNCTION public.fn_comprehensive_audit();

CREATE TRIGGER audit_habit_logs
  AFTER INSERT OR UPDATE OR DELETE ON public.habit_logs
  FOR EACH ROW EXECUTE FUNCTION public.fn_comprehensive_audit();

CREATE TRIGGER audit_projects
  AFTER INSERT OR UPDATE OR DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.fn_comprehensive_audit();

CREATE TRIGGER audit_goals
  AFTER INSERT OR UPDATE OR DELETE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.fn_comprehensive_audit();

CREATE TRIGGER audit_routines
  AFTER INSERT OR UPDATE OR DELETE ON public.routines
  FOR EACH ROW EXECUTE FUNCTION public.fn_comprehensive_audit();

CREATE TRIGGER audit_routine_logs
  AFTER INSERT OR UPDATE OR DELETE ON public.routine_logs
  FOR EACH ROW EXECUTE FUNCTION public.fn_comprehensive_audit();

CREATE TRIGGER audit_focus_sessions
  AFTER INSERT OR UPDATE OR DELETE ON public.focus_sessions
  FOR EACH ROW EXECUTE FUNCTION public.fn_comprehensive_audit();

CREATE TRIGGER audit_journal_entries
  AFTER INSERT OR UPDATE OR DELETE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.fn_comprehensive_audit();

CREATE TRIGGER audit_calendar_events
  AFTER INSERT OR UPDATE OR DELETE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.fn_comprehensive_audit();

CREATE TRIGGER audit_finance_transactions
  AFTER INSERT OR UPDATE OR DELETE ON public.finance_transactions
  FOR EACH ROW EXECUTE FUNCTION public.fn_comprehensive_audit();

CREATE TRIGGER audit_finance_categories
  AFTER INSERT OR UPDATE OR DELETE ON public.finance_categories
  FOR EACH ROW EXECUTE FUNCTION public.fn_comprehensive_audit();

CREATE TRIGGER audit_budgets
  AFTER INSERT OR UPDATE OR DELETE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.fn_comprehensive_audit();

CREATE TRIGGER audit_inbox_items
  AFTER INSERT OR UPDATE OR DELETE ON public.inbox_items
  FOR EACH ROW EXECUTE FUNCTION public.fn_comprehensive_audit();

CREATE TRIGGER audit_notifications
  AFTER INSERT OR UPDATE OR DELETE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.fn_comprehensive_audit();

CREATE TRIGGER audit_ai_proposals
  AFTER INSERT OR UPDATE OR DELETE ON public.ai_proposals
  FOR EACH ROW EXECUTE FUNCTION public.fn_comprehensive_audit();

CREATE TRIGGER audit_agent_actions
  AFTER INSERT OR UPDATE OR DELETE ON public.agent_actions
  FOR EACH ROW EXECUTE FUNCTION public.fn_comprehensive_audit();

CREATE TRIGGER audit_automation_rules
  AFTER INSERT OR UPDATE OR DELETE ON public.automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.fn_comprehensive_audit();

CREATE TRIGGER audit_streaks
  AFTER INSERT OR UPDATE OR DELETE ON public.streaks
  FOR EACH ROW EXECUTE FUNCTION public.fn_comprehensive_audit();

CREATE TRIGGER audit_domains
  AFTER INSERT OR UPDATE OR DELETE ON public.domains
  FOR EACH ROW EXECUTE FUNCTION public.fn_comprehensive_audit();

CREATE TRIGGER audit_preferences
  AFTER INSERT OR UPDATE OR DELETE ON public.preferences
  FOR EACH ROW EXECUTE FUNCTION public.fn_comprehensive_audit();