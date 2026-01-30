-- LOT 10C: Behavioral AI System Tables

-- AI Interventions (AI Coach interactions)
CREATE TABLE public.ai_interventions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workspace_id uuid REFERENCES public.workspaces(id),
  intervention_type text NOT NULL CHECK (intervention_type IN ('motivation', 'warning', 'challenge', 'praise', 'restructure')),
  context jsonb DEFAULT '{}'::jsonb,
  ai_message text NOT NULL,
  user_action text CHECK (user_action IN ('accepted', 'ignored', 'rejected', 'pending')),
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz
);

-- Behavior Signals (detected patterns)
CREATE TABLE public.behavior_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workspace_id uuid REFERENCES public.workspaces(id),
  signal_type text NOT NULL CHECK (signal_type IN ('fatigue', 'overload', 'disengagement', 'momentum', 'relapse_risk', 'streak_break', 'productivity_peak')),
  score numeric NOT NULL DEFAULT 0,
  source text DEFAULT 'system',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Journal AI Assists
CREATE TABLE public.journal_ai_assists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  workspace_id uuid REFERENCES public.workspaces(id),
  suggestion text NOT NULL,
  suggestion_type text DEFAULT 'reflection',
  accepted boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Kanban Metrics Daily
CREATE TABLE public.kanban_metrics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workspace_id uuid REFERENCES public.workspaces(id),
  date date NOT NULL,
  tasks_created integer DEFAULT 0,
  tasks_completed integer DEFAULT 0,
  tasks_moved integer DEFAULT 0,
  avg_time_in_column jsonb DEFAULT '{}'::jsonb,
  productivity_score numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, workspace_id, date)
);

-- Habit Behavior Links (gratitude, victories, challenges)
CREATE TABLE public.habit_behavior_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  workspace_id uuid REFERENCES public.workspaces(id),
  behavior_type text NOT NULL CHECK (behavior_type IN ('gratitude', 'challenge', 'victory', 'ritual', 'keystone')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(habit_id, behavior_type)
);

-- AI Notifications (smart alerts)
CREATE TABLE public.ai_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workspace_id uuid REFERENCES public.workspaces(id),
  message text NOT NULL,
  title text,
  urgency text DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'critical')),
  notification_type text DEFAULT 'insight',
  delivered boolean DEFAULT false,
  read_at timestamptz,
  action_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Finance Parsed Transactions (for import pipeline)
CREATE TABLE public.finance_parsed_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  workspace_id uuid REFERENCES public.workspaces(id),
  date date NOT NULL,
  label text,
  amount numeric NOT NULL,
  type text DEFAULT 'expense',
  category_id uuid REFERENCES public.finance_categories(id),
  anomaly_score numeric DEFAULT 0,
  imported boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavior_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_ai_assists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_metrics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_behavior_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_parsed_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own ai_interventions" ON public.ai_interventions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own behavior_signals" ON public.behavior_signals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own journal_ai_assists" ON public.journal_ai_assists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own kanban_metrics_daily" ON public.kanban_metrics_daily FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own habit_behavior_links" ON public.habit_behavior_links FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own ai_notifications" ON public.ai_notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own finance_parsed_transactions" ON public.finance_parsed_transactions FOR ALL USING (auth.uid() = user_id);

-- Backend policies for edge functions
CREATE POLICY "Backend can manage ai_interventions" ON public.ai_interventions FOR ALL USING (true);
CREATE POLICY "Backend can manage behavior_signals" ON public.behavior_signals FOR ALL USING (true);
CREATE POLICY "Backend can manage kanban_metrics_daily" ON public.kanban_metrics_daily FOR ALL USING (true);
CREATE POLICY "Backend can manage ai_notifications" ON public.ai_notifications FOR ALL USING (true);

-- Indexes for performance
CREATE INDEX idx_ai_interventions_user ON public.ai_interventions(user_id, created_at DESC);
CREATE INDEX idx_behavior_signals_user ON public.behavior_signals(user_id, created_at DESC);
CREATE INDEX idx_behavior_signals_type ON public.behavior_signals(signal_type, score);
CREATE INDEX idx_kanban_metrics_daily_user_date ON public.kanban_metrics_daily(user_id, date DESC);
CREATE INDEX idx_ai_notifications_user ON public.ai_notifications(user_id, delivered, created_at DESC);
CREATE INDEX idx_finance_parsed_transactions_doc ON public.finance_parsed_transactions(document_id);
CREATE INDEX idx_journal_ai_assists_entry ON public.journal_ai_assists(entry_id);