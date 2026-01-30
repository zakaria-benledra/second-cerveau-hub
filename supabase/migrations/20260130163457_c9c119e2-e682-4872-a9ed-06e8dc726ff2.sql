-- ================================================================
-- PRODUCTION-GRADE MIGRATION: Multi-Tenant + Idempotent + Secure
-- ================================================================

-- 1. IDEMPOTENCE: Add event_id with UNIQUE constraint for deduplication
ALTER TABLE public.task_events 
ADD COLUMN IF NOT EXISTS event_id text;

-- Create unique constraint for task_events deduplication
CREATE UNIQUE INDEX IF NOT EXISTS task_events_event_id_unique 
ON public.task_events (event_id) 
WHERE event_id IS NOT NULL;

-- Add event_id to undo_stack
ALTER TABLE public.undo_stack
ADD COLUMN IF NOT EXISTS event_id text;

CREATE UNIQUE INDEX IF NOT EXISTS undo_stack_event_id_unique 
ON public.undo_stack (event_id) 
WHERE event_id IS NOT NULL;

-- 2. SAVINGS GOALS TABLE (Finance Pipeline)
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  goal_id uuid REFERENCES public.goals(id) ON DELETE SET NULL,
  name text NOT NULL,
  target_amount numeric NOT NULL DEFAULT 0,
  current_amount numeric NOT NULL DEFAULT 0,
  category_id uuid REFERENCES public.finance_categories(id) ON DELETE SET NULL,
  deadline date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  source text DEFAULT 'ui',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. MULTI-TENANT RLS ON NEW TABLES
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own savings goals"
ON public.savings_goals FOR ALL
USING (auth.uid() = user_id AND (workspace_id IS NULL OR is_workspace_member(auth.uid(), workspace_id)));

-- 4. RLS FOR task_events (enforce user_id AND workspace_id)
DROP POLICY IF EXISTS "Users can manage task events" ON public.task_events;
CREATE POLICY "Users can manage task events"
ON public.task_events FOR ALL
USING (auth.uid() = user_id AND (workspace_id IS NULL OR is_workspace_member(auth.uid(), workspace_id)));

-- 5. RLS FOR undo_stack (enforce user_id AND workspace_id)
DROP POLICY IF EXISTS "Users can manage undo stack" ON public.undo_stack;
CREATE POLICY "Users can manage undo stack"
ON public.undo_stack FOR ALL
USING (auth.uid() = user_id AND (workspace_id IS NULL OR is_workspace_member(auth.uid(), workspace_id)));

-- 6. ENCRYPTED TOKEN COLUMN for connected_accounts
-- Note: We use pgcrypto for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encrypted column for refresh tokens (if not exists)
ALTER TABLE public.connected_accounts
ADD COLUMN IF NOT EXISTS refresh_token_encrypted bytea;

-- 7. BI INDEXES for multi-tenant stats queries
CREATE INDEX IF NOT EXISTS idx_daily_stats_workspace_date 
ON public.daily_stats (workspace_id, user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_scores_daily_workspace_date
ON public.scores_daily (user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_scores_weekly_workspace
ON public.scores_weekly (user_id, week_start DESC);

CREATE INDEX IF NOT EXISTS idx_finance_transactions_workspace
ON public.finance_transactions (user_id, workspace_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_habit_logs_workspace
ON public.habit_logs (user_id, workspace_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_savings_goals_workspace
ON public.savings_goals (user_id, workspace_id);

-- 8. EVENT_TYPE ENUM for strong typing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_event_type') THEN
    CREATE TYPE task_event_type AS ENUM (
      'created', 
      'updated', 
      'status_changed', 
      'completed', 
      'reverted', 
      'deleted',
      'archived'
    );
  END IF;
END $$;

-- 9. TRIGGER for updated_at on savings_goals
CREATE TRIGGER update_savings_goals_updated_at
BEFORE UPDATE ON public.savings_goals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. FUNCTION to compute savings goal progress
CREATE OR REPLACE FUNCTION public.compute_savings_progress(goal_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT SUM(amount) FROM finance_transactions 
     WHERE type = 'income' 
     AND category_id = (SELECT category_id FROM savings_goals WHERE id = goal_id)),
    0
  );
$$;