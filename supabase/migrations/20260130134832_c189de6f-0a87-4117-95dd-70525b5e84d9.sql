-- MILESTONE 2: RLS Policies Enforcement with Workspace Isolation
-- ================================================================

-- Enable RLS on undo_stack if not already
ALTER TABLE public.undo_stack ENABLE ROW LEVEL SECURITY;

-- Enable RLS on usage_ledger if not already
ALTER TABLE public.usage_ledger ENABLE ROW LEVEL SECURITY;

-- Enable RLS on system_events
ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on these tables to recreate them
DROP POLICY IF EXISTS "Users can view own undo stack" ON public.undo_stack;
DROP POLICY IF EXISTS "Users can insert own undo stack" ON public.undo_stack;
DROP POLICY IF EXISTS "Users can update own undo stack" ON public.undo_stack;
DROP POLICY IF EXISTS "Users can view own usage" ON public.usage_ledger;
DROP POLICY IF EXISTS "Backend can insert usage" ON public.usage_ledger;

-- RLS policies for undo_stack with workspace isolation
CREATE POLICY "undo_stack_select"
ON public.undo_stack FOR SELECT
USING (
  user_id = auth.uid() 
  AND (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
);

CREATE POLICY "undo_stack_insert"
ON public.undo_stack FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
);

CREATE POLICY "undo_stack_update"
ON public.undo_stack FOR UPDATE
USING (
  user_id = auth.uid()
  AND (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
);

-- RLS policies for usage_ledger
CREATE POLICY "usage_ledger_select"
ON public.usage_ledger FOR SELECT
USING (
  user_id = auth.uid()
  AND (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
);

CREATE POLICY "usage_ledger_insert"
ON public.usage_ledger FOR INSERT
WITH CHECK (true);

-- RLS policies for system_events
CREATE POLICY "system_events_select"
ON public.system_events FOR SELECT
USING (
  user_id = auth.uid()
  AND (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
);

CREATE POLICY "system_events_insert"
ON public.system_events FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
);

-- Enable RLS on streaks and add proper policies
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own streaks" ON public.streaks;

CREATE POLICY "streaks_all"
ON public.streaks FOR ALL
USING (
  user_id = auth.uid()
  AND (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
)
WITH CHECK (
  user_id = auth.uid()
  AND (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
);