-- Migration: Fix permissive USING(true) policies
-- Date: 2026-02-02
-- Reason: Replace permissive policies with proper user_id filtering

-- 1. ai_interventions - should be user-scoped
DROP POLICY IF EXISTS "Backend can manage ai_interventions" ON public.ai_interventions;
DROP POLICY IF EXISTS "Users can view own interventions" ON public.ai_interventions;
DROP POLICY IF EXISTS "Service role can manage interventions" ON public.ai_interventions;

CREATE POLICY "Users can view own interventions"
  ON public.ai_interventions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage interventions"
  ON public.ai_interventions
  FOR ALL
  USING (auth.role() = 'service_role');

-- 2. behavior_signals - should be user-scoped
DROP POLICY IF EXISTS "Backend can manage behavior_signals" ON public.behavior_signals;
DROP POLICY IF EXISTS "Users can view own signals" ON public.behavior_signals;
DROP POLICY IF EXISTS "Service role can manage signals" ON public.behavior_signals;

CREATE POLICY "Users can view own signals"
  ON public.behavior_signals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage signals"
  ON public.behavior_signals
  FOR ALL
  USING (auth.role() = 'service_role');

-- 3. kanban_metrics_daily - should be user-scoped
DROP POLICY IF EXISTS "Backend can manage kanban_metrics_daily" ON public.kanban_metrics_daily;
DROP POLICY IF EXISTS "Users can view own metrics" ON public.kanban_metrics_daily;
DROP POLICY IF EXISTS "Service role can manage metrics" ON public.kanban_metrics_daily;

CREATE POLICY "Users can view own metrics"
  ON public.kanban_metrics_daily
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage metrics"
  ON public.kanban_metrics_daily
  FOR ALL
  USING (auth.role() = 'service_role');

-- 4. ai_notifications - should be user-scoped
DROP POLICY IF EXISTS "Backend can manage ai_notifications" ON public.ai_notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.ai_notifications;
DROP POLICY IF EXISTS "Service role can manage notifications" ON public.ai_notifications;

CREATE POLICY "Users can view own notifications"
  ON public.ai_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.ai_notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage notifications"
  ON public.ai_notifications
  FOR ALL
  USING (auth.role() = 'service_role');

-- 5. analytics_sessions - should be user-scoped
DROP POLICY IF EXISTS "Backend can manage analytics_sessions" ON public.analytics_sessions;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.analytics_sessions;
DROP POLICY IF EXISTS "Service role can manage sessions" ON public.analytics_sessions;

CREATE POLICY "Users can view own sessions"
  ON public.analytics_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage sessions"
  ON public.analytics_sessions
  FOR ALL
  USING (auth.role() = 'service_role');

-- 6. churn_risk_scores - should be user-scoped
DROP POLICY IF EXISTS "Backend can manage churn_risk_scores" ON public.churn_risk_scores;
DROP POLICY IF EXISTS "Users can view own risk scores" ON public.churn_risk_scores;
DROP POLICY IF EXISTS "Service role can manage risk scores" ON public.churn_risk_scores;

CREATE POLICY "Users can view own risk scores"
  ON public.churn_risk_scores
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage risk scores"
  ON public.churn_risk_scores
  FOR ALL
  USING (auth.role() = 'service_role');

-- 7. behavioral_dna - should be user-scoped
DROP POLICY IF EXISTS "Backend can manage behavioral_dna" ON public.behavioral_dna;
DROP POLICY IF EXISTS "Users can view own dna" ON public.behavioral_dna;
DROP POLICY IF EXISTS "Service role can manage dna" ON public.behavioral_dna;

CREATE POLICY "Users can view own dna"
  ON public.behavioral_dna
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage dna"
  ON public.behavioral_dna
  FOR ALL
  USING (auth.role() = 'service_role');

-- 8. user_subscriptions - should be user-scoped
DROP POLICY IF EXISTS "Backend can manage user_subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.user_subscriptions;

CREATE POLICY "Users can view own subscriptions"
  ON public.user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON public.user_subscriptions
  FOR ALL
  USING (auth.role() = 'service_role');

-- 9. ai_proposals - should be user-scoped
DROP POLICY IF EXISTS "Backend can manage ai_proposals" ON public.ai_proposals;
DROP POLICY IF EXISTS "Users can view own proposals" ON public.ai_proposals;
DROP POLICY IF EXISTS "Service role can manage proposals" ON public.ai_proposals;

CREATE POLICY "Users can view own proposals"
  ON public.ai_proposals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own proposals"
  ON public.ai_proposals
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage proposals"
  ON public.ai_proposals
  FOR ALL
  USING (auth.role() = 'service_role');

-- 10. agent_actions - should be user-scoped
DROP POLICY IF EXISTS "Backend can manage agent_actions" ON public.agent_actions;
DROP POLICY IF EXISTS "Users can view own actions" ON public.agent_actions;
DROP POLICY IF EXISTS "Service role can manage actions" ON public.agent_actions;

CREATE POLICY "Users can view own actions"
  ON public.agent_actions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own actions"
  ON public.agent_actions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage actions"
  ON public.agent_actions
  FOR ALL
  USING (auth.role() = 'service_role');

-- Add comments for documentation
COMMENT ON POLICY "Users can view own interventions" ON public.ai_interventions IS 'Users can only view their own AI interventions';
COMMENT ON POLICY "Users can view own signals" ON public.behavior_signals IS 'Users can only view their own behavior signals';
COMMENT ON POLICY "Users can view own metrics" ON public.kanban_metrics_daily IS 'Users can only view their own kanban metrics';