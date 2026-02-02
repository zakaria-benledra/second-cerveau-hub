-- Table for tracking calendar event synchronization
CREATE TABLE IF NOT EXISTS public.calendar_events_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id),
  external_event_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'apple', 'outlook')),
  minded_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  minded_habit_id UUID REFERENCES public.habits(id) ON DELETE SET NULL,
  sync_direction TEXT CHECK (sync_direction IN ('import', 'export', 'bidirectional')),
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, external_event_id, provider)
);

-- Enable RLS
ALTER TABLE public.calendar_events_sync ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage own calendar sync" ON public.calendar_events_sync
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_calendar_events_sync_user ON public.calendar_events_sync(user_id);
CREATE INDEX idx_calendar_events_sync_provider ON public.calendar_events_sync(user_id, provider);
CREATE INDEX idx_calendar_events_sync_task ON public.calendar_events_sync(minded_task_id) WHERE minded_task_id IS NOT NULL;
CREATE INDEX idx_calendar_events_sync_habit ON public.calendar_events_sync(minded_habit_id) WHERE minded_habit_id IS NOT NULL;

-- Add sync_enabled and last_sync columns to connected_accounts if not exists
ALTER TABLE public.connected_accounts 
  ADD COLUMN IF NOT EXISTS sync_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;