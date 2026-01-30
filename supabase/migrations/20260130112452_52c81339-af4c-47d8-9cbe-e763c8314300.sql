-- =============================================
-- SECOND CERVEAU — MILESTONE 1 & 2 DATABASE SCHEMA
-- Full production schema with RLS policies
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- IDENTITY TABLES
-- =============================================

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User preferences
CREATE TABLE public.preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  timezone TEXT DEFAULT 'Europe/Paris',
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  energy_profile JSONB DEFAULT '{"peakHours": [9, 10, 11], "lowHours": [14, 15]}'::jsonb,
  daily_capacity_min INTEGER DEFAULT 480,
  agent_mode TEXT DEFAULT 'assisted' CHECK (agent_mode IN ('off', 'assisted', 'autonomous')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- EXECUTION TABLES
-- =============================================

-- Tasks
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  start_date DATE,
  estimate_min INTEGER,
  actual_duration_min INTEGER,
  energy_level TEXT CHECK (energy_level IN ('low', 'medium', 'high')),
  project_id UUID,
  goal_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Task Events (for audit trail)
CREATE TABLE public.task_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'updated', 'completed', 'reopened', 'deleted')),
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- HABITS TABLES
-- =============================================

-- Habits
CREATE TABLE public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_frequency TEXT NOT NULL DEFAULT 'daily' CHECK (target_frequency IN ('daily', 'weekly', 'monthly')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habit Logs
CREATE TABLE public.habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(habit_id, date)
);

-- Streaks (materialized view for performance)
CREATE TABLE public.streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL UNIQUE REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  max_streak INTEGER NOT NULL DEFAULT 0,
  last_completed_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- INBOX & NOTIFICATIONS
-- =============================================

-- Inbox Items
CREATE TABLE public.inbox_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'capture' CHECK (source IN ('email', 'note', 'capture', 'agent', 'calendar')),
  title TEXT NOT NULL,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'processed', 'archived')),
  converted_task_id UUID REFERENCES public.tasks(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'action', 'agent')),
  title TEXT NOT NULL,
  message TEXT,
  payload JSONB,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- ORGANIZATION TABLES
-- =============================================

-- Domains
CREATE TABLE public.domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  domain_id UUID REFERENCES public.domains(id) ON DELETE SET NULL,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Resources
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('link', 'file', 'note', 'image')),
  url TEXT,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign key for tasks.project_id
ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

-- =============================================
-- GOALS & ROUTINES
-- =============================================

-- Goals
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target NUMERIC,
  unit TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign key for tasks.goal_id
ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_goal_id_fkey 
FOREIGN KEY (goal_id) REFERENCES public.goals(id) ON DELETE SET NULL;

-- Routines
CREATE TABLE public.routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('morning', 'evening', 'custom')),
  name TEXT NOT NULL,
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Routine Logs
CREATE TABLE public.routine_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed_items JSONB DEFAULT '[]'::jsonb,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(routine_id, date)
);

-- =============================================
-- FOCUS / TIME MANAGEMENT
-- =============================================

-- Focus Sessions
CREATE TABLE public.focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_min INTEGER,
  type TEXT DEFAULT 'pomodoro' CHECK (type IN ('pomodoro', 'deep_work', 'time_block')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Time Blocks
CREATE TABLE public.time_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  title TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- BI / STATS TABLES (ONLY SOURCE FOR DASHBOARDS)
-- =============================================

-- Daily Stats
CREATE TABLE public.daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  tasks_planned INTEGER NOT NULL DEFAULT 0,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  habits_completed INTEGER NOT NULL DEFAULT 0,
  habits_total INTEGER NOT NULL DEFAULT 0,
  focus_minutes INTEGER NOT NULL DEFAULT 0,
  overload_index NUMERIC(4,2) DEFAULT 0,
  clarity_score NUMERIC(4,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Weekly Stats
CREATE TABLE public.weekly_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Monthly Stats
CREATE TABLE public.monthly_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);

-- =============================================
-- AI & GOVERNANCE TABLES
-- =============================================

-- Agent Actions (PROPOSE → APPROVE → EXECUTE)
CREATE TABLE public.agent_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('plan_day', 'weekly_review', 'task_suggestion', 'habit_reminder', 'goal_decomposition', 'inbox_triage')),
  proposed_payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'approved', 'executed', 'rejected', 'reverted')),
  explanation TEXT,
  confidence_score NUMERIC(3,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  executed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Undo Stack
CREATE TABLE public.undo_stack (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID NOT NULL REFERENCES public.agent_actions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  revert_payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit Log (append-only)
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- GOVERNANCE TABLES
-- =============================================

-- Metric Registry
CREATE TABLE public.metric_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  formula TEXT NOT NULL,
  source_tables TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(key, version)
);

-- Usage Ledger (AI costs tracking)
CREATE TABLE public.usage_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  tokens_in INTEGER NOT NULL DEFAULT 0,
  tokens_out INTEGER NOT NULL DEFAULT 0,
  cost_estimate NUMERIC(10,4) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, day)
);

-- AI Metrics
CREATE TABLE public.ai_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  approval_rate NUMERIC(4,2),
  rejection_rate NUMERIC(4,2),
  latency_ms INTEGER,
  total_requests INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- System Health
CREATE TABLE public.system_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
  last_check TIMESTAMPTZ NOT NULL DEFAULT now(),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_tasks_user_due ON public.tasks(user_id, due_date);
CREATE INDEX idx_habits_user_id ON public.habits(user_id);
CREATE INDEX idx_habit_logs_habit_date ON public.habit_logs(habit_id, date);
CREATE INDEX idx_inbox_items_user_status ON public.inbox_items(user_id, status);
CREATE INDEX idx_daily_stats_user_date ON public.daily_stats(user_id, date);
CREATE INDEX idx_agent_actions_user_status ON public.agent_actions(user_id, status);
CREATE INDEX idx_audit_log_user_created ON public.audit_log(user_id, created_at);

-- =============================================
-- ROW LEVEL SECURITY (MULTI-TENANT ISOLATION)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.undo_stack ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_ledger ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Preferences policies
CREATE POLICY "Users can view own preferences" ON public.preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON public.preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON public.preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tasks policies
CREATE POLICY "Users can view own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- Task Events policies
CREATE POLICY "Users can view own task events" ON public.task_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own task events" ON public.task_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Habits policies
CREATE POLICY "Users can view own habits" ON public.habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habits" ON public.habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habits" ON public.habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own habits" ON public.habits FOR DELETE USING (auth.uid() = user_id);

-- Habit Logs policies
CREATE POLICY "Users can view own habit logs" ON public.habit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habit logs" ON public.habit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habit logs" ON public.habit_logs FOR UPDATE USING (auth.uid() = user_id);

-- Streaks policies
CREATE POLICY "Users can view own streaks" ON public.streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own streaks" ON public.streaks FOR ALL USING (auth.uid() = user_id);

-- Inbox policies
CREATE POLICY "Users can view own inbox" ON public.inbox_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own inbox" ON public.inbox_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inbox" ON public.inbox_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own inbox" ON public.inbox_items FOR DELETE USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Domains policies
CREATE POLICY "Users can manage own domains" ON public.domains FOR ALL USING (auth.uid() = user_id);

-- Projects policies
CREATE POLICY "Users can manage own projects" ON public.projects FOR ALL USING (auth.uid() = user_id);

-- Resources policies
CREATE POLICY "Users can manage own resources" ON public.resources FOR ALL USING (auth.uid() = user_id);

-- Goals policies
CREATE POLICY "Users can manage own goals" ON public.goals FOR ALL USING (auth.uid() = user_id);

-- Routines policies
CREATE POLICY "Users can manage own routines" ON public.routines FOR ALL USING (auth.uid() = user_id);

-- Routine Logs policies
CREATE POLICY "Users can manage own routine logs" ON public.routine_logs FOR ALL USING (auth.uid() = user_id);

-- Focus Sessions policies
CREATE POLICY "Users can manage own focus sessions" ON public.focus_sessions FOR ALL USING (auth.uid() = user_id);

-- Time Blocks policies
CREATE POLICY "Users can manage own time blocks" ON public.time_blocks FOR ALL USING (auth.uid() = user_id);

-- Daily Stats policies
CREATE POLICY "Users can view own daily stats" ON public.daily_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own daily stats" ON public.daily_stats FOR ALL USING (auth.uid() = user_id);

-- Weekly Stats policies
CREATE POLICY "Users can manage own weekly stats" ON public.weekly_stats FOR ALL USING (auth.uid() = user_id);

-- Monthly Stats policies
CREATE POLICY "Users can manage own monthly stats" ON public.monthly_stats FOR ALL USING (auth.uid() = user_id);

-- Agent Actions policies
CREATE POLICY "Users can view own agent actions" ON public.agent_actions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own agent actions" ON public.agent_actions FOR ALL USING (auth.uid() = user_id);

-- Undo Stack policies
CREATE POLICY "Users can manage own undo stack" ON public.undo_stack FOR ALL USING (auth.uid() = user_id);

-- Audit Log policies (read-only for users)
CREATE POLICY "Users can view own audit log" ON public.audit_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own audit log" ON public.audit_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usage Ledger policies
CREATE POLICY "Users can view own usage" ON public.usage_ledger FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own usage" ON public.usage_ledger FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- TRIGGERS FOR AUTOMATIC PROFILE CREATION
-- =============================================

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  
  INSERT INTO public.preferences (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_preferences_updated_at BEFORE UPDATE ON public.preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON public.habits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inbox_items_updated_at BEFORE UPDATE ON public.inbox_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_domains_updated_at BEFORE UPDATE ON public.domains FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_routines_updated_at BEFORE UPDATE ON public.routines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_daily_stats_updated_at BEFORE UPDATE ON public.daily_stats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_weekly_stats_updated_at BEFORE UPDATE ON public.weekly_stats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_monthly_stats_updated_at BEFORE UPDATE ON public.monthly_stats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_agent_actions_updated_at BEFORE UPDATE ON public.agent_actions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- SEED CANONICAL METRICS
-- =============================================

INSERT INTO public.metric_registry (key, version, description, formula, source_tables, status) VALUES
('completion_rate', 1, 'Task completion rate', 'tasks_completed / tasks_planned', ARRAY['daily_stats'], 'active'),
('overload_index', 1, 'Daily workload vs capacity', 'SUM(estimate_min due today) / daily_capacity_min', ARRAY['tasks', 'preferences'], 'active'),
('habit_adherence', 1, 'Habit completion rate', 'completed_logs / expected_logs', ARRAY['habit_logs', 'habits'], 'active'),
('clarity_score', 1, 'Task clarity index', 'tasks_with(estimate + due_date + next_action) / total_tasks', ARRAY['tasks'], 'active'),
('focus_ratio', 1, 'Focus time ratio', 'focus_minutes / (8 * 60)', ARRAY['daily_stats'], 'active');

-- Initialize system health
INSERT INTO public.system_health (service, status, message) VALUES
('database', 'healthy', 'PostgreSQL operational'),
('auth', 'healthy', 'Authentication service operational'),
('api', 'healthy', 'API endpoints operational');

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.habits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.habit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inbox_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_actions;