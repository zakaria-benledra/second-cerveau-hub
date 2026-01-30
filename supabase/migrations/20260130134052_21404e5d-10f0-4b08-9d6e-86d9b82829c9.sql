-- ============================================
-- F) BILLING INFRASTRUCTURE (Stripe-ready)
-- ============================================

-- 1. Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id text,
  stripe_subscription_id text UNIQUE,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  canceled_at timestamptz,
  trial_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_workspace ON public.subscriptions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Only workspace members can view their subscription
CREATE POLICY "Workspace members can view subscription" ON public.subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.workspace_id = subscriptions.workspace_id
        AND m.user_id = auth.uid()
    )
  );

-- Only owners can update subscription
CREATE POLICY "Workspace owners can update subscription" ON public.subscriptions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.workspace_id = subscriptions.workspace_id
        AND m.user_id = auth.uid()
        AND m.role = 'owner'
    )
  );

-- 2. Billing events table (for audit)
CREATE TABLE IF NOT EXISTS public.billing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  stripe_event_id text UNIQUE,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed boolean DEFAULT false,
  processed_at timestamptz,
  error text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_events_workspace ON public.billing_events(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_events_unprocessed ON public.billing_events(processed) WHERE processed = false;

ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace owners can view billing events" ON public.billing_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.workspace_id = billing_events.workspace_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
    )
  );

-- 3. Usage limits table
CREATE TABLE IF NOT EXISTS public.usage_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL UNIQUE,
  ai_requests_used integer DEFAULT 0,
  ai_requests_limit integer DEFAULT 100,
  automations_used integer DEFAULT 0,
  automations_limit integer DEFAULT 3,
  team_members_used integer DEFAULT 1,
  team_members_limit integer DEFAULT 1,
  storage_used_mb integer DEFAULT 0,
  storage_limit_mb integer DEFAULT 100,
  reset_at timestamptz DEFAULT (date_trunc('month', now()) + interval '1 month'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.usage_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view usage" ON public.usage_limits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.workspace_id = usage_limits.workspace_id
        AND m.user_id = auth.uid()
    )
  );

-- 4. Function to check usage limits
CREATE OR REPLACE FUNCTION public.check_usage_limit(_workspace_id uuid, _limit_type text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  usage_record record;
BEGIN
  SELECT * INTO usage_record FROM public.usage_limits WHERE workspace_id = _workspace_id;
  
  IF usage_record IS NULL THEN
    RETURN true; -- No limits set = allow
  END IF;
  
  CASE _limit_type
    WHEN 'ai_requests' THEN
      RETURN usage_record.ai_requests_used < usage_record.ai_requests_limit OR usage_record.ai_requests_limit = -1;
    WHEN 'automations' THEN
      RETURN usage_record.automations_used < usage_record.automations_limit OR usage_record.automations_limit = -1;
    WHEN 'team_members' THEN
      RETURN usage_record.team_members_used < usage_record.team_members_limit OR usage_record.team_members_limit = -1;
    WHEN 'storage' THEN
      RETURN usage_record.storage_used_mb < usage_record.storage_limit_mb OR usage_record.storage_limit_mb = -1;
    ELSE
      RETURN true;
  END CASE;
END;
$$;

-- 5. Function to increment usage
CREATE OR REPLACE FUNCTION public.increment_usage(_workspace_id uuid, _limit_type text, _amount integer DEFAULT 1)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  CASE _limit_type
    WHEN 'ai_requests' THEN
      UPDATE public.usage_limits 
      SET ai_requests_used = ai_requests_used + _amount, updated_at = now()
      WHERE workspace_id = _workspace_id;
    WHEN 'automations' THEN
      UPDATE public.usage_limits 
      SET automations_used = automations_used + _amount, updated_at = now()
      WHERE workspace_id = _workspace_id;
    WHEN 'team_members' THEN
      UPDATE public.usage_limits 
      SET team_members_used = team_members_used + _amount, updated_at = now()
      WHERE workspace_id = _workspace_id;
    WHEN 'storage' THEN
      UPDATE public.usage_limits 
      SET storage_used_mb = storage_used_mb + _amount, updated_at = now()
      WHERE workspace_id = _workspace_id;
  END CASE;
  
  RETURN true;
END;
$$;

-- 6. Plan limits configuration
CREATE TABLE IF NOT EXISTS public.plan_limits (
  plan text PRIMARY KEY CHECK (plan IN ('free', 'pro', 'enterprise')),
  ai_requests_limit integer NOT NULL,
  automations_limit integer NOT NULL,
  team_members_limit integer NOT NULL,
  storage_limit_mb integer NOT NULL,
  history_days integer NOT NULL,
  features jsonb NOT NULL DEFAULT '{}'::jsonb
);

INSERT INTO public.plan_limits (plan, ai_requests_limit, automations_limit, team_members_limit, storage_limit_mb, history_days, features) VALUES
  ('free', 100, 3, 1, 100, 7, '{"ai_coach": false, "bi_dashboards": false, "export_data": false}'::jsonb),
  ('pro', 1000, 25, 5, 1000, 90, '{"ai_coach": true, "bi_dashboards": true, "export_data": true}'::jsonb),
  ('enterprise', -1, -1, -1, -1, -1, '{"ai_coach": true, "bi_dashboards": true, "export_data": true, "sso": true, "custom_integrations": true}'::jsonb)
ON CONFLICT (plan) DO UPDATE SET
  ai_requests_limit = EXCLUDED.ai_requests_limit,
  automations_limit = EXCLUDED.automations_limit,
  team_members_limit = EXCLUDED.team_members_limit,
  storage_limit_mb = EXCLUDED.storage_limit_mb,
  history_days = EXCLUDED.history_days,
  features = EXCLUDED.features;

ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read plan limits" ON public.plan_limits
  FOR SELECT USING (true);

-- 7. Create subscription and usage_limits on workspace creation
CREATE OR REPLACE FUNCTION public.fn_create_workspace_billing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create default subscription
  INSERT INTO public.subscriptions (workspace_id, plan, status)
  VALUES (NEW.id, COALESCE(NEW.plan::text, 'free'), 'active');
  
  -- Create usage limits based on plan
  INSERT INTO public.usage_limits (
    workspace_id,
    ai_requests_limit,
    automations_limit,
    team_members_limit,
    storage_limit_mb
  )
  SELECT 
    NEW.id,
    pl.ai_requests_limit,
    pl.automations_limit,
    pl.team_members_limit,
    pl.storage_limit_mb
  FROM public.plan_limits pl
  WHERE pl.plan = COALESCE(NEW.plan::text, 'free');
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_create_workspace_billing ON public.workspaces;
CREATE TRIGGER trigger_create_workspace_billing
  AFTER INSERT ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.fn_create_workspace_billing();