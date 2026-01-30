-- MILESTONE 1: Schema Fixes and Comprehensive Indexes
-- =====================================================

-- Add missing columns to streaks
ALTER TABLE public.streaks 
ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

-- Add workspace_id to system_events
ALTER TABLE public.system_events 
ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Add missing columns to undo_stack for full reversibility
ALTER TABLE public.undo_stack 
ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS entity text,
ADD COLUMN IF NOT EXISTS entity_id uuid,
ADD COLUMN IF NOT EXISTS operation text,
ADD COLUMN IF NOT EXISTS previous_state jsonb,
ADD COLUMN IF NOT EXISTS current_state jsonb,
ADD COLUMN IF NOT EXISTS is_undone boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS undone_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone DEFAULT (now() + interval '30 days');

-- Add missing columns to usage_ledger
ALTER TABLE public.usage_ledger 
ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS service text,
ADD COLUMN IF NOT EXISTS operation text,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Create comprehensive indexes for BI performance
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON public.daily_stats(user_id, date);
CREATE INDEX IF NOT EXISTS idx_weekly_stats_user_week ON public.weekly_stats(user_id, week_start);
CREATE INDEX IF NOT EXISTS idx_monthly_stats_user_month ON public.monthly_stats(user_id, month);
CREATE INDEX IF NOT EXISTS idx_scores_daily_user_date ON public.scores_daily(user_id, date);
CREATE INDEX IF NOT EXISTS idx_scores_weekly_user_week ON public.scores_weekly(user_id, week_start);
CREATE INDEX IF NOT EXISTS idx_scores_monthly_user_month ON public.scores_monthly(user_id, month);

-- Create indexes for core tables
CREATE INDEX IF NOT EXISTS idx_tasks_user ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace ON public.tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);

CREATE INDEX IF NOT EXISTS idx_habits_user ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_workspace ON public.habits(workspace_id);
CREATE INDEX IF NOT EXISTS idx_habits_active ON public.habits(is_active);

CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date ON public.habit_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit ON public.habit_logs(habit_id);

CREATE INDEX IF NOT EXISTS idx_projects_user ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_workspace ON public.projects(workspace_id);

CREATE INDEX IF NOT EXISTS idx_goals_user ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_workspace ON public.goals(workspace_id);

CREATE INDEX IF NOT EXISTS idx_finance_transactions_user_date ON public.finance_transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_time ON public.calendar_events(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date ON public.journal_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_time ON public.focus_sessions(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_routines_user ON public.routines(user_id);
CREATE INDEX IF NOT EXISTS idx_routine_logs_user_date ON public.routine_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_automation_rules_user_event ON public.automation_rules(user_id, trigger_event);
CREATE INDEX IF NOT EXISTS idx_automation_events_user ON public.automation_events(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_proposals_user_status ON public.ai_proposals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_streaks_user ON public.streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_streaks_habit ON public.streaks(habit_id);
CREATE INDEX IF NOT EXISTS idx_system_events_user ON public.system_events(user_id);
CREATE INDEX IF NOT EXISTS idx_system_events_type ON public.system_events(event_type);
CREATE INDEX IF NOT EXISTS idx_system_events_created ON public.system_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_undo_stack_user ON public.undo_stack(user_id);
CREATE INDEX IF NOT EXISTS idx_undo_stack_action ON public.undo_stack(action_id);
CREATE INDEX IF NOT EXISTS idx_usage_ledger_user_day ON public.usage_ledger(user_id, day);