-- =============================================
-- LOT 10: PRODUCT INTELLIGENCE & FINANCE ENGINE
-- =============================================

-- MILESTONE 1: Product Intelligence Engine

-- User Journey Events (Source of Truth for Product Analytics)
CREATE TABLE IF NOT EXISTS public.user_journey_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- signup, activation, habit_locked, finance_imported, ai_action_accepted, churn_risk
  entity text,
  entity_id uuid,
  payload jsonb DEFAULT '{}'::jsonb,
  event_id text UNIQUE, -- for idempotency
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Funnel Daily (Aggregated Product Metrics)
CREATE TABLE IF NOT EXISTS public.funnel_daily (
  date date NOT NULL,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  visits integer DEFAULT 0,
  signups integer DEFAULT 0,
  activated_users integer DEFAULT 0,
  retained_users integer DEFAULT 0,
  churned_users integer DEFAULT 0,
  ai_engaged_users integer DEFAULT 0,
  finance_connected_users integer DEFAULT 0,
  activation_rate numeric DEFAULT 0,
  retention_rate numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (date, workspace_id)
);

-- Churn Risk Scores (Per-User Risk Assessment)
CREATE TABLE IF NOT EXISTS public.churn_risk_scores (
  user_id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  risk_score numeric NOT NULL DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  signals jsonb DEFAULT '{}'::jsonb,
  last_activity_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- MILESTONE 2: Finance Engine V2

-- Finance Documents (Upload Tracking)
CREATE TABLE IF NOT EXISTS public.finance_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  filename text NOT NULL,
  file_type text NOT NULL,
  storage_path text,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  parsed_at timestamptz,
  status text NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'parsing', 'parsed', 'validated', 'rejected', 'error')),
  summary jsonb DEFAULT '{}'::jsonb,
  error_message text,
  transactions_imported integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Finance Visual Snapshots (Pre-computed Visuals)
CREATE TABLE IF NOT EXISTS public.finance_visual_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  date date NOT NULL,
  snapshot_type text NOT NULL, -- daily_summary, category_breakdown, trend
  category text,
  amount numeric NOT NULL DEFAULT 0,
  income numeric DEFAULT 0,
  expenses numeric DEFAULT 0,
  trend_index numeric DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- MILESTONE 4: Weather Integration

-- Weather Snapshots
CREATE TABLE IF NOT EXISTS public.weather_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  date date NOT NULL,
  location text,
  weather text, -- clear, cloudy, rain, snow, etc.
  temp numeric,
  humidity integer,
  mood_index numeric DEFAULT 0,
  productivity_correlation numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- INDEXES for Performance

CREATE INDEX IF NOT EXISTS idx_user_journey_events_user ON public.user_journey_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_journey_events_workspace ON public.user_journey_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_user_journey_events_type ON public.user_journey_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_journey_events_created ON public.user_journey_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_funnel_daily_date ON public.funnel_daily(date DESC);
CREATE INDEX IF NOT EXISTS idx_funnel_daily_workspace ON public.funnel_daily(workspace_id);

CREATE INDEX IF NOT EXISTS idx_churn_risk_workspace ON public.churn_risk_scores(workspace_id);
CREATE INDEX IF NOT EXISTS idx_churn_risk_level ON public.churn_risk_scores(risk_level);

CREATE INDEX IF NOT EXISTS idx_finance_documents_user ON public.finance_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_documents_workspace ON public.finance_documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_finance_documents_status ON public.finance_documents(status);

CREATE INDEX IF NOT EXISTS idx_finance_visual_snapshots_user ON public.finance_visual_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_visual_snapshots_date ON public.finance_visual_snapshots(date DESC);

CREATE INDEX IF NOT EXISTS idx_weather_snapshots_user_date ON public.weather_snapshots(user_id, date DESC);

-- RLS POLICIES

ALTER TABLE public.user_journey_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.churn_risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_visual_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_snapshots ENABLE ROW LEVEL SECURITY;

-- User Journey Events: Users can view own, backend can insert
CREATE POLICY "Users can view own journey events"
  ON public.user_journey_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Backend can insert journey events"
  ON public.user_journey_events FOR INSERT
  WITH CHECK (true);

-- Funnel Daily: Admins/Owners can view all in workspace
CREATE POLICY "Workspace admins can view funnel"
  ON public.funnel_daily FOR SELECT
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Backend can manage funnel"
  ON public.funnel_daily FOR ALL
  USING (true);

-- Churn Risk: Users can view own, admins can view workspace
CREATE POLICY "Users can view own churn risk"
  ON public.churn_risk_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Backend can manage churn risk"
  ON public.churn_risk_scores FOR ALL
  USING (true);

-- Finance Documents: Users can manage own
CREATE POLICY "Users can manage own finance documents"
  ON public.finance_documents FOR ALL
  USING (auth.uid() = user_id);

-- Finance Visual Snapshots: Users can view own
CREATE POLICY "Users can view own finance snapshots"
  ON public.finance_visual_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Backend can manage finance snapshots"
  ON public.finance_visual_snapshots FOR ALL
  USING (true);

-- Weather Snapshots: Users can manage own
CREATE POLICY "Users can manage own weather"
  ON public.weather_snapshots FOR ALL
  USING (auth.uid() = user_id);

-- Audit triggers for critical tables
CREATE TRIGGER audit_user_journey_events
  AFTER INSERT OR UPDATE OR DELETE ON public.user_journey_events
  FOR EACH ROW EXECUTE FUNCTION public.fn_comprehensive_audit();

CREATE TRIGGER audit_finance_documents
  AFTER INSERT OR UPDATE OR DELETE ON public.finance_documents
  FOR EACH ROW EXECUTE FUNCTION public.fn_comprehensive_audit();

-- Updated_at triggers
CREATE TRIGGER update_funnel_daily_updated_at
  BEFORE UPDATE ON public.funnel_daily
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_churn_risk_updated_at
  BEFORE UPDATE ON public.churn_risk_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_finance_documents_updated_at
  BEFORE UPDATE ON public.finance_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();