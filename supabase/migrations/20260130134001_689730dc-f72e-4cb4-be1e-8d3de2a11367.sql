-- ============================================
-- A) DATA GOVERNANCE: Constraints, Audit, Prompts
-- ============================================

-- 1. AI Prompts versioning table
CREATE TABLE IF NOT EXISTS public.ai_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  template text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  model text DEFAULT 'google/gemini-3-flash-preview',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(name, version)
);

-- RLS for ai_prompts (read-only for authenticated, admin can manage)
ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read prompts" ON public.ai_prompts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage prompts" ON public.ai_prompts
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default prompts
INSERT INTO public.ai_prompts (name, version, template, model) VALUES
  ('daily_briefing', 1, 'Tu es un coach de productivité personnel intelligent. Tu analyses les données de l''utilisateur et fournis des conseils personnalisés en français. Sois concis, motivant et actionnable.', 'google/gemini-3-flash-preview'),
  ('risk_analysis', 1, 'Tu es un analyste de risques comportementaux. Analyse les données et identifie les risques potentiels. Réponds en JSON structuré.', 'google/gemini-3-flash-preview'),
  ('weekly_review', 1, 'Tu es un coach de performance personnel. Génère des insights perspicaces basés sur la semaine de l''utilisateur. Réponds en JSON structuré.', 'google/gemini-3-flash-preview'),
  ('proposal_generation', 1, 'Tu es un assistant de productivité qui génère des propositions d''actions concrètes. Réponds en JSON structuré avec title, description, reasoning, confidence, priority, actions.', 'google/gemini-3-flash-preview')
ON CONFLICT DO NOTHING;

-- 2. Job runs table for DLQ/observability
CREATE TABLE IF NOT EXISTS public.job_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'failed', 'partial')),
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  duration_ms integer,
  records_processed integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  error_message text,
  error_stack text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Index for job monitoring
CREATE INDEX IF NOT EXISTS idx_job_runs_job_name_created ON public.job_runs(job_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_runs_status ON public.job_runs(status) WHERE status = 'failed';

ALTER TABLE public.job_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view job runs" ON public.job_runs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Service can insert job runs" ON public.job_runs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service can update job runs" ON public.job_runs
  FOR UPDATE USING (true);

-- 3. Add audit trigger to ALL core tables (if not exists)
CREATE OR REPLACE FUNCTION public.fn_audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Apply audit triggers to critical tables
DROP TRIGGER IF EXISTS audit_tasks ON public.tasks;
CREATE TRIGGER audit_tasks AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS audit_habits ON public.habits;
CREATE TRIGGER audit_habits AFTER INSERT OR UPDATE OR DELETE ON public.habits
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS audit_habit_logs ON public.habit_logs;
CREATE TRIGGER audit_habit_logs AFTER INSERT OR UPDATE OR DELETE ON public.habit_logs
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS audit_goals ON public.goals;
CREATE TRIGGER audit_goals AFTER INSERT OR UPDATE OR DELETE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS audit_projects ON public.projects;
CREATE TRIGGER audit_projects AFTER INSERT OR UPDATE OR DELETE ON public.projects
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

-- 4. Add computed_at column for KPI versioning
ALTER TABLE public.scores_weekly ADD COLUMN IF NOT EXISTS kpi_version integer DEFAULT 1;
ALTER TABLE public.scores_monthly ADD COLUMN IF NOT EXISTS kpi_version integer DEFAULT 1;

-- 5. Add critical indexes for stats queries
CREATE INDEX IF NOT EXISTS idx_scores_daily_user_date ON public.scores_daily(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_scores_weekly_user_week ON public.scores_weekly(user_id, week_start DESC);
CREATE INDEX IF NOT EXISTS idx_scores_monthly_user_month ON public.scores_monthly(user_id, month DESC);
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON public.daily_stats(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON public.tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_habits_user_active ON public.habits(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date ON public.habit_logs(user_id, date DESC);

-- 6. RBAC helper function for workspace roles
CREATE OR REPLACE FUNCTION public.has_workspace_role(_user_id uuid, _workspace_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = _user_id
      AND workspace_id = _workspace_id
      AND role = _role
  )
$$;

-- Function to get user's workspace
CREATE OR REPLACE FUNCTION public.get_user_workspace(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT workspace_id FROM public.memberships
  WHERE user_id = _user_id
  LIMIT 1
$$;