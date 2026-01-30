-- ============================================
-- MILESTONE 1: COMPLETE SCHEMA COMPLIANCE
-- ============================================

-- Add workspace_id to all tables that don't have it
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.habit_logs ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.finance_transactions ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.finance_categories ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.inbox_items ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.focus_sessions ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.routines ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.routine_logs ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.scores_daily ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.scores_weekly ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.scores_monthly ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.daily_stats ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.weekly_stats ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.monthly_stats ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.automation_rules ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.automation_events ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.ai_proposals ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.agent_actions ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);

-- Add source field to all operational tables
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS source text DEFAULT 'ui' CHECK (source IN ('ui', 'api', 'automation', 'ai', 'integration', 'system'));
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS source text DEFAULT 'ui' CHECK (source IN ('ui', 'api', 'automation', 'ai', 'integration', 'system'));
ALTER TABLE public.habit_logs ADD COLUMN IF NOT EXISTS source text DEFAULT 'ui' CHECK (source IN ('ui', 'api', 'automation', 'ai', 'integration', 'system'));
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS source text DEFAULT 'ui' CHECK (source IN ('ui', 'api', 'automation', 'ai', 'integration', 'system'));
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS source text DEFAULT 'ui' CHECK (source IN ('ui', 'api', 'automation', 'ai', 'integration', 'system'));
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS source text DEFAULT 'ui' CHECK (source IN ('ui', 'api', 'automation', 'ai', 'integration', 'system'));
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS source text DEFAULT 'ui' CHECK (source IN ('ui', 'api', 'automation', 'ai', 'integration', 'system'));
ALTER TABLE public.finance_transactions ADD COLUMN IF NOT EXISTS source text DEFAULT 'ui' CHECK (source IN ('ui', 'api', 'automation', 'ai', 'integration', 'system'));
ALTER TABLE public.inbox_items ADD COLUMN IF NOT EXISTS source text DEFAULT 'ui' CHECK (source IN ('ui', 'api', 'automation', 'ai', 'integration', 'system'));
ALTER TABLE public.focus_sessions ADD COLUMN IF NOT EXISTS source text DEFAULT 'ui' CHECK (source IN ('ui', 'api', 'automation', 'ai', 'integration', 'system'));
ALTER TABLE public.routines ADD COLUMN IF NOT EXISTS source text DEFAULT 'ui' CHECK (source IN ('ui', 'api', 'automation', 'ai', 'integration', 'system'));
ALTER TABLE public.routine_logs ADD COLUMN IF NOT EXISTS source text DEFAULT 'ui' CHECK (source IN ('ui', 'api', 'automation', 'ai', 'integration', 'system'));
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS source text DEFAULT 'ui' CHECK (source IN ('ui', 'api', 'automation', 'ai', 'integration', 'system'));
ALTER TABLE public.automation_rules ADD COLUMN IF NOT EXISTS source text DEFAULT 'ui' CHECK (source IN ('ui', 'api', 'automation', 'ai', 'integration', 'system'));
ALTER TABLE public.ai_proposals ADD COLUMN IF NOT EXISTS source text DEFAULT 'ai' CHECK (source IN ('ui', 'api', 'automation', 'ai', 'integration', 'system'));
ALTER TABLE public.agent_actions ADD COLUMN IF NOT EXISTS source text DEFAULT 'ai' CHECK (source IN ('ui', 'api', 'automation', 'ai', 'integration', 'system'));

-- Create indexes for workspace_id
CREATE INDEX IF NOT EXISTS idx_tasks_workspace ON public.tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_habits_workspace ON public.habits(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_workspace ON public.projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_goals_workspace ON public.goals(workspace_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_workspace ON public.calendar_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_workspace ON public.finance_transactions(workspace_id);

-- ============================================
-- AUTOMATIC AUDIT LOGGING FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.fn_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (user_id, action, entity, entity_id, new_value)
    VALUES (
      COALESCE(NEW.user_id, auth.uid()),
      'create',
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (user_id, action, entity, entity_id, old_value, new_value)
    VALUES (
      COALESCE(NEW.user_id, auth.uid()),
      'update',
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (user_id, action, entity, entity_id, old_value)
    VALUES (
      COALESCE(OLD.user_id, auth.uid()),
      'delete',
      TG_TABLE_NAME,
      OLD.id,
      to_jsonb(OLD)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply audit triggers to all operational tables
DROP TRIGGER IF EXISTS audit_tasks ON public.tasks;
CREATE TRIGGER audit_tasks AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS audit_habits ON public.habits;
CREATE TRIGGER audit_habits AFTER INSERT OR UPDATE OR DELETE ON public.habits
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS audit_habit_logs ON public.habit_logs;
CREATE TRIGGER audit_habit_logs AFTER INSERT OR UPDATE OR DELETE ON public.habit_logs
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS audit_projects ON public.projects;
CREATE TRIGGER audit_projects AFTER INSERT OR UPDATE OR DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS audit_goals ON public.goals;
CREATE TRIGGER audit_goals AFTER INSERT OR UPDATE OR DELETE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS audit_calendar_events ON public.calendar_events;
CREATE TRIGGER audit_calendar_events AFTER INSERT OR UPDATE OR DELETE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS audit_journal_entries ON public.journal_entries;
CREATE TRIGGER audit_journal_entries AFTER INSERT OR UPDATE OR DELETE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS audit_finance_transactions ON public.finance_transactions;
CREATE TRIGGER audit_finance_transactions AFTER INSERT OR UPDATE OR DELETE ON public.finance_transactions
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS audit_inbox_items ON public.inbox_items;
CREATE TRIGGER audit_inbox_items AFTER INSERT OR UPDATE OR DELETE ON public.inbox_items
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS audit_focus_sessions ON public.focus_sessions;
CREATE TRIGGER audit_focus_sessions AFTER INSERT OR UPDATE OR DELETE ON public.focus_sessions
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS audit_routines ON public.routines;
CREATE TRIGGER audit_routines AFTER INSERT OR UPDATE OR DELETE ON public.routines
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS audit_ai_proposals ON public.ai_proposals;
CREATE TRIGGER audit_ai_proposals AFTER INSERT OR UPDATE OR DELETE ON public.ai_proposals
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS audit_agent_actions ON public.agent_actions;
CREATE TRIGGER audit_agent_actions AFTER INSERT OR UPDATE OR DELETE ON public.agent_actions
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS audit_automation_rules ON public.automation_rules;
CREATE TRIGGER audit_automation_rules AFTER INSERT OR UPDATE OR DELETE ON public.automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

-- ============================================
-- PLAN GATING: Feature access function
-- ============================================

CREATE OR REPLACE FUNCTION public.check_feature_access(
  _user_id uuid,
  _feature text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_plan plan_tier;
  feature_allowed boolean := false;
BEGIN
  -- Get user's plan from their workspace
  SELECT w.plan INTO user_plan
  FROM public.workspaces w
  JOIN public.memberships m ON m.workspace_id = w.id
  WHERE m.user_id = _user_id
  LIMIT 1;
  
  -- Default to free if no workspace
  IF user_plan IS NULL THEN
    user_plan := 'free';
  END IF;
  
  -- Check feature access based on plan
  CASE _feature
    WHEN 'ai_coach' THEN
      feature_allowed := user_plan IN ('pro', 'enterprise');
    WHEN 'unlimited_automations' THEN
      feature_allowed := user_plan = 'enterprise';
    WHEN 'bi_dashboards' THEN
      feature_allowed := user_plan IN ('pro', 'enterprise');
    WHEN 'history_90d' THEN
      feature_allowed := user_plan IN ('pro', 'enterprise');
    WHEN 'history_unlimited' THEN
      feature_allowed := user_plan = 'enterprise';
    WHEN 'export_data' THEN
      feature_allowed := user_plan IN ('pro', 'enterprise');
    ELSE
      feature_allowed := true; -- Default allow
  END CASE;
  
  RETURN feature_allowed;
END;
$$;

-- ============================================
-- QA TEST STATUS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.qa_test_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name text NOT NULL,
  module text NOT NULL,
  ui_entry text NOT NULL,
  expected_action text NOT NULL,
  expected_result text NOT NULL,
  verify_screen text NOT NULL,
  status text DEFAULT 'not_tested' CHECK (status IN ('not_tested', 'partial', 'verified', 'failed')),
  last_tested_at timestamptz,
  tested_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.qa_test_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view QA status"
ON public.qa_test_status FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can update QA status"
ON public.qa_test_status FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert QA status"
ON public.qa_test_status FOR INSERT
TO authenticated
WITH CHECK (true);

-- Insert default test matrix
INSERT INTO public.qa_test_status (feature_name, module, ui_entry, expected_action, expected_result, verify_screen) VALUES
('Create Task', 'tasks', '+ New Task button', 'Submit form', 'Task saved to database', 'Task list'),
('Edit Task', 'tasks', 'Click task card', 'Modify & save', 'Task updated', 'Task list'),
('Delete Task', 'tasks', 'Delete button', 'Confirm delete', 'Task removed', 'Task list'),
('Complete Task', 'tasks', 'Checkbox', 'Toggle status', 'Status changed, stat updated', 'Dashboard'),
('Create Habit', 'habits', '+ New Habit button', 'Submit form', 'Habit saved', 'Habit list'),
('Log Habit', 'habits', 'Check habit', 'Toggle completion', 'Log created, streak updated', 'Habit tracker'),
('AI Coach Briefing', 'ai', 'Get Briefing button', 'Generate briefing', 'AI response displayed', 'AI page'),
('AI Proposal', 'ai', 'Generate Proposal button', 'Create proposal', 'Proposal in pending state', 'Proposals list'),
('Approve Proposal', 'ai', 'Approve button', 'Execute action', 'Action executed, audit logged', 'Audit log'),
('Reject Proposal', 'ai', 'Reject button', 'Mark rejected', 'Proposal rejected', 'Proposals list'),
('Undo Action', 'ai', 'Undo button', 'Revert action', 'State restored', 'Audit log'),
('Compute Score', 'scores', 'Recompute button', 'Trigger calculation', 'Score updated', 'Scores page'),
('Create Automation', 'automation', '+ New Rule button', 'Submit form', 'Rule saved', 'Rules list'),
('Trigger Automation', 'automation', 'Test button', 'Fire rule', 'Event logged', 'Events log'),
('Simulate Missed Habit', 'qa', 'Simulate button', 'Emit event', 'Automation triggered', 'Events log'),
('Simulate Budget Overrun', 'qa', 'Simulate button', 'Emit event', 'Notification created', 'Notifications'),
('Simulate Burnout Risk', 'qa', 'Simulate button', 'Emit event', 'AI proposal created', 'AI proposals'),
('Create Project', 'projects', '+ New Project button', 'Submit form', 'Project saved', 'Project list'),
('Create Goal', 'goals', '+ New Goal button', 'Submit form', 'Goal saved', 'Goal list'),
('Add Transaction', 'finance', '+ Transaction button', 'Submit form', 'Transaction saved', 'Transactions'),
('Journal Entry', 'journal', 'New Entry button', 'Submit form', 'Entry saved', 'Journal list'),
('Focus Session', 'focus', 'Start Focus button', 'Timer starts', 'Session logged', 'Focus history'),
('Calendar Event', 'calendar', '+ Event button', 'Submit form', 'Event saved', 'Calendar view'),
('View Dashboard', 'dashboard', 'Dashboard link', 'Navigate', 'KPIs displayed', 'Dashboard')
ON CONFLICT DO NOTHING;