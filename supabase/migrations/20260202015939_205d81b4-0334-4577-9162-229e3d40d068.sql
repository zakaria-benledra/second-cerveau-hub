-- Migration: Add system_alerts table for observability
-- This table stores critical alerts for monitoring

CREATE TABLE IF NOT EXISTS public.system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  service TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  user_id UUID REFERENCES auth.users(id),
  workspace_id UUID REFERENCES public.workspaces(id),
  trace_id TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_system_alerts_severity 
  ON public.system_alerts(severity) 
  WHERE resolved = false;

CREATE INDEX IF NOT EXISTS idx_system_alerts_service 
  ON public.system_alerts(service, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_alerts_created 
  ON public.system_alerts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_alerts_workspace 
  ON public.system_alerts(workspace_id, created_at DESC);

-- RLS: Only admins can see alerts
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all alerts in their workspace
CREATE POLICY "Admins can view workspace alerts"
  ON public.system_alerts
  FOR SELECT
  TO authenticated
  USING (
    public.has_workspace_role(auth.uid(), workspace_id, 'admin')
  );

-- Policy: Admins can resolve alerts in their workspace
CREATE POLICY "Admins can update workspace alerts"
  ON public.system_alerts
  FOR UPDATE
  TO authenticated
  USING (
    public.has_workspace_role(auth.uid(), workspace_id, 'admin')
  );

-- Service role can insert alerts (from Edge Functions)
-- No INSERT policy needed - Edge Functions use service_role key

COMMENT ON TABLE public.system_alerts IS 'Critical system alerts for monitoring and incident response';