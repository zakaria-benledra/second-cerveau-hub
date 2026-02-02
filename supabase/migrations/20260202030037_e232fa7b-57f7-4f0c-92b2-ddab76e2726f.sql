-- Migration: Enable RLS on subscription_plans
-- Date: 2026-02-02
-- Reason: Security best practice - all tables should have RLS

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read plans (public data)
CREATE POLICY "Anyone can view subscription plans"
  ON public.subscription_plans
  FOR SELECT
  USING (true);

-- Policy: Only service role can modify plans
CREATE POLICY "Only service role can manage plans"
  ON public.subscription_plans
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Add comment for documentation
COMMENT ON TABLE public.subscription_plans IS 'Subscription plans - RLS enabled, public read, service_role write';