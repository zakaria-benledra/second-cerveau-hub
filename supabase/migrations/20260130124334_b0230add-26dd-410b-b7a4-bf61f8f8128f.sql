-- ================================================
-- SECOND CERVEAU - Extended Data Contract
-- Multi-tenant, Scoring Engine, Automation Engine
-- ================================================

-- 1. APP ROLES ENUM
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE public.plan_tier AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE public.event_source AS ENUM ('ui', 'api', 'automation', 'ai', 'integration', 'system');

-- 2. WORKSPACES TABLE (Multi-tenant)
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL,
  plan plan_tier NOT NULL DEFAULT 'free',
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- 3. MEMBERSHIPS TABLE (RBAC)
CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'member',
  invited_by UUID,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, workspace_id)
);

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- 4. USER ROLES TABLE (for admin checks - separate from profile)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. SECURITY DEFINER FUNCTION for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 6. Check workspace membership
CREATE OR REPLACE FUNCTION public.is_workspace_member(_user_id UUID, _workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = _user_id AND workspace_id = _workspace_id
  )
$$;

-- 7. SCORES TABLES (Scoring Engine Output)
CREATE TABLE public.scores_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  global_score NUMERIC(5,2) DEFAULT 0,
  habits_score NUMERIC(5,2) DEFAULT 0,
  tasks_score NUMERIC(5,2) DEFAULT 0,
  finance_score NUMERIC(5,2) DEFAULT 0,
  health_score NUMERIC(5,2) DEFAULT 0,
  momentum_index NUMERIC(5,2) DEFAULT 0,
  burnout_index NUMERIC(5,2) DEFAULT 0,
  consistency_factor NUMERIC(5,2) DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.scores_daily ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.scores_weekly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  global_score NUMERIC(5,2) DEFAULT 0,
  habits_score NUMERIC(5,2) DEFAULT 0,
  tasks_score NUMERIC(5,2) DEFAULT 0,
  finance_score NUMERIC(5,2) DEFAULT 0,
  health_score NUMERIC(5,2) DEFAULT 0,
  trend_direction TEXT DEFAULT 'stable',
  week_over_week_change NUMERIC(5,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE public.scores_weekly ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.scores_monthly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  month DATE NOT NULL,
  global_score NUMERIC(5,2) DEFAULT 0,
  habits_score NUMERIC(5,2) DEFAULT 0,
  tasks_score NUMERIC(5,2) DEFAULT 0,
  finance_score NUMERIC(5,2) DEFAULT 0,
  health_score NUMERIC(5,2) DEFAULT 0,
  achievements JSONB DEFAULT '[]'::jsonb,
  insights JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);

ALTER TABLE public.scores_monthly ENABLE ROW LEVEL SECURITY;

-- 8. AUTOMATION RULES TABLE
CREATE TABLE public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_event TEXT NOT NULL,
  trigger_conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  action_type TEXT NOT NULL,
  action_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  priority INTEGER DEFAULT 0,
  channel TEXT DEFAULT 'ui',
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

-- 9. AUTOMATION EVENTS TABLE
CREATE TABLE public.automation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  rule_id UUID REFERENCES public.automation_rules(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  entity TEXT,
  entity_id UUID,
  payload JSONB DEFAULT '{}'::jsonb,
  result JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_events ENABLE ROW LEVEL SECURITY;

-- 10. AI PROPOSALS TABLE (separate from actions)
CREATE TABLE public.ai_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  reasoning TEXT,
  proposed_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  context JSONB DEFAULT '{}'::jsonb,
  confidence_score NUMERIC(3,2) DEFAULT 0.5,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  expires_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_proposals ENABLE ROW LEVEL SECURITY;

-- 11. SYSTEM EVENTS TABLE (Event Bus)
CREATE TABLE public.system_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  source event_source NOT NULL DEFAULT 'ui',
  payload JSONB DEFAULT '{}'::jsonb,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;

-- Create index for event processing
CREATE INDEX idx_system_events_unprocessed ON public.system_events(created_at) WHERE processed = false;
CREATE INDEX idx_system_events_user ON public.system_events(user_id, created_at);

-- 12. RLS POLICIES

-- Workspaces
CREATE POLICY "Users can view workspaces they belong to"
  ON public.workspaces FOR SELECT
  USING (public.is_workspace_member(auth.uid(), id) OR owner_id = auth.uid());

CREATE POLICY "Owners can manage their workspaces"
  ON public.workspaces FOR ALL
  USING (owner_id = auth.uid());

-- Memberships
CREATE POLICY "Users can view their memberships"
  ON public.memberships FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Workspace admins can manage memberships"
  ON public.memberships FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.workspace_id = memberships.workspace_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
    )
  );

-- User Roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

-- Scores (all user-owned)
CREATE POLICY "Users can manage own daily scores"
  ON public.scores_daily FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own weekly scores"
  ON public.scores_weekly FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own monthly scores"
  ON public.scores_monthly FOR ALL
  USING (user_id = auth.uid());

-- Automation
CREATE POLICY "Users can manage own automation rules"
  ON public.automation_rules FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own automation events"
  ON public.automation_events FOR ALL
  USING (user_id = auth.uid());

-- AI Proposals
CREATE POLICY "Users can manage own AI proposals"
  ON public.ai_proposals FOR ALL
  USING (user_id = auth.uid());

-- System Events
CREATE POLICY "Users can view own events"
  ON public.system_events FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own events"
  ON public.system_events FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 13. UPDATE TRIGGERS
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automation_rules_updated_at
  BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();