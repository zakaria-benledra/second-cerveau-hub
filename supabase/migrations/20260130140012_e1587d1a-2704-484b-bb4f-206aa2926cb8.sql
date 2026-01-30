
-- SECOND CERVEAU - Golden Prompt Hardening Migration
-- Purpose: Complete schema governance, fix remaining RLS issues, add missing indexes

-- ============================================
-- SECTION 1: Fix remaining RLS policy issues
-- ============================================

-- Fix overly permissive UPDATE policy on system_health (should require admin role)
DROP POLICY IF EXISTS "Service role can update system health" ON public.system_health;
CREATE POLICY "Admins can update system health" 
ON public.system_health 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- Add INSERT policy for system_health (backend only via admin)
DROP POLICY IF EXISTS "Admins can insert system health" ON public.system_health;
CREATE POLICY "Admins can insert system health" 
ON public.system_health 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- SECTION 2: Add missing workspace_id columns for tables that need multi-tenant support
-- ============================================

-- Add workspace_id to domains (safe nullable add)
ALTER TABLE public.domains 
ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);

-- Add workspace_id to notes
ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);

-- Add workspace_id to highlights
ALTER TABLE public.highlights 
ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);

-- Add workspace_id to flashcards
ALTER TABLE public.flashcards 
ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);

-- Add workspace_id to reading_items
ALTER TABLE public.reading_items 
ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);

-- Add workspace_id to quiz_results
ALTER TABLE public.quiz_results 
ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);

-- Add workspace_id to resources
ALTER TABLE public.resources 
ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);

-- Add workspace_id to time_blocks
ALTER TABLE public.time_blocks 
ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);

-- Add workspace_id to task_events
ALTER TABLE public.task_events 
ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);

-- ============================================
-- SECTION 3: Create missing performance indexes
-- ============================================

-- Workspace isolation indexes
CREATE INDEX IF NOT EXISTS idx_domains_workspace ON public.domains(workspace_id);
CREATE INDEX IF NOT EXISTS idx_notes_workspace ON public.notes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_highlights_workspace ON public.highlights(workspace_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_workspace ON public.flashcards(workspace_id);
CREATE INDEX IF NOT EXISTS idx_reading_items_workspace ON public.reading_items(workspace_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_workspace ON public.quiz_results(workspace_id);
CREATE INDEX IF NOT EXISTS idx_resources_workspace ON public.resources(workspace_id);
CREATE INDEX IF NOT EXISTS idx_time_blocks_workspace ON public.time_blocks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_task_events_workspace ON public.task_events(workspace_id);

-- User isolation indexes (for tables with user_id)
CREATE INDEX IF NOT EXISTS idx_domains_user ON public.domains(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_highlights_user ON public.highlights(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user ON public.flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_items_user ON public.reading_items(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user ON public.quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_user ON public.resources(user_id);

-- BI performance indexes
CREATE INDEX IF NOT EXISTS idx_scores_daily_user_date ON public.scores_daily(user_id, date);
CREATE INDEX IF NOT EXISTS idx_scores_weekly_user_week ON public.scores_weekly(user_id, week_start);
CREATE INDEX IF NOT EXISTS idx_scores_monthly_user_month ON public.scores_monthly(user_id, month);

-- Automation performance indexes
CREATE INDEX IF NOT EXISTS idx_automation_events_rule ON public.automation_events(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_events_status ON public.automation_events(status);
CREATE INDEX IF NOT EXISTS idx_automation_rules_active ON public.automation_rules(is_active) WHERE is_active = true;

-- Job runs monitoring indexes
CREATE INDEX IF NOT EXISTS idx_job_runs_name_status ON public.job_runs(job_name, status);
CREATE INDEX IF NOT EXISTS idx_job_runs_started ON public.job_runs(started_at DESC);

-- System events indexes
CREATE INDEX IF NOT EXISTS idx_system_events_type ON public.system_events(event_type);
CREATE INDEX IF NOT EXISTS idx_system_events_entity ON public.system_events(entity, entity_id);

-- ============================================
-- SECTION 4: Enhance RLS policies for newly workspace-enabled tables
-- ============================================

-- Update domains RLS to include workspace isolation
DROP POLICY IF EXISTS "Users can manage own domains" ON public.domains;
CREATE POLICY "Users can manage own domains" 
ON public.domains 
FOR ALL 
USING (
  user_id = auth.uid() 
  AND (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
);

-- Update notes RLS
DROP POLICY IF EXISTS "Users can manage own notes" ON public.notes;
CREATE POLICY "Users can manage own notes" 
ON public.notes 
FOR ALL 
USING (
  user_id = auth.uid() 
  AND (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
);

-- Update highlights RLS
DROP POLICY IF EXISTS "Users can manage own highlights" ON public.highlights;
CREATE POLICY "Users can manage own highlights" 
ON public.highlights 
FOR ALL 
USING (
  user_id = auth.uid() 
  AND (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
);

-- Update flashcards RLS
DROP POLICY IF EXISTS "Users can manage own flashcards" ON public.flashcards;
CREATE POLICY "Users can manage own flashcards" 
ON public.flashcards 
FOR ALL 
USING (
  user_id = auth.uid() 
  AND (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
);

-- Update reading_items RLS
DROP POLICY IF EXISTS "Users can manage own reading items" ON public.reading_items;
CREATE POLICY "Users can manage own reading items" 
ON public.reading_items 
FOR ALL 
USING (
  user_id = auth.uid() 
  AND (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
);

-- Update quiz_results RLS
DROP POLICY IF EXISTS "Users can manage own quiz results" ON public.quiz_results;
CREATE POLICY "Users can manage own quiz results" 
ON public.quiz_results 
FOR ALL 
USING (
  user_id = auth.uid() 
  AND (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
);

-- Update resources RLS
DROP POLICY IF EXISTS "Users can manage own resources" ON public.resources;
CREATE POLICY "Users can manage own resources" 
ON public.resources 
FOR ALL 
USING (
  user_id = auth.uid() 
  AND (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
);

-- Update time_blocks RLS
DROP POLICY IF EXISTS "Users can manage own time blocks" ON public.time_blocks;
CREATE POLICY "Users can manage own time blocks" 
ON public.time_blocks 
FOR ALL 
USING (
  user_id = auth.uid() 
  AND (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
);

-- Update task_events RLS
DROP POLICY IF EXISTS "Users can view own task events" ON public.task_events;
DROP POLICY IF EXISTS "Users can insert own task events" ON public.task_events;
CREATE POLICY "Users can manage own task events" 
ON public.task_events 
FOR ALL 
USING (
  user_id = auth.uid() 
  AND (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id))
);

-- ============================================
-- SECTION 5: Add audit triggers to remaining tables
-- ============================================

-- Attach comprehensive audit trigger to newly governed tables
DROP TRIGGER IF EXISTS audit_domains ON public.domains;
CREATE TRIGGER audit_domains
AFTER INSERT OR UPDATE OR DELETE ON public.domains
FOR EACH ROW EXECUTE FUNCTION public.fn_comprehensive_audit();

DROP TRIGGER IF EXISTS audit_notes ON public.notes;
CREATE TRIGGER audit_notes
AFTER INSERT OR UPDATE OR DELETE ON public.notes
FOR EACH ROW EXECUTE FUNCTION public.fn_comprehensive_audit();

DROP TRIGGER IF EXISTS audit_highlights ON public.highlights;
CREATE TRIGGER audit_highlights
AFTER INSERT OR UPDATE OR DELETE ON public.highlights
FOR EACH ROW EXECUTE FUNCTION public.fn_comprehensive_audit();

DROP TRIGGER IF EXISTS audit_flashcards ON public.flashcards;
CREATE TRIGGER audit_flashcards
AFTER INSERT OR UPDATE OR DELETE ON public.flashcards
FOR EACH ROW EXECUTE FUNCTION public.fn_comprehensive_audit();

DROP TRIGGER IF EXISTS audit_reading_items ON public.reading_items;
CREATE TRIGGER audit_reading_items
AFTER INSERT OR UPDATE OR DELETE ON public.reading_items
FOR EACH ROW EXECUTE FUNCTION public.fn_comprehensive_audit();

DROP TRIGGER IF EXISTS audit_quiz_results ON public.quiz_results;
CREATE TRIGGER audit_quiz_results
AFTER INSERT OR UPDATE OR DELETE ON public.quiz_results
FOR EACH ROW EXECUTE FUNCTION public.fn_comprehensive_audit();

DROP TRIGGER IF EXISTS audit_resources ON public.resources;
CREATE TRIGGER audit_resources
AFTER INSERT OR UPDATE OR DELETE ON public.resources
FOR EACH ROW EXECUTE FUNCTION public.fn_comprehensive_audit();

DROP TRIGGER IF EXISTS audit_time_blocks ON public.time_blocks;
CREATE TRIGGER audit_time_blocks
AFTER INSERT OR UPDATE OR DELETE ON public.time_blocks
FOR EACH ROW EXECUTE FUNCTION public.fn_comprehensive_audit();

DROP TRIGGER IF EXISTS audit_task_events ON public.task_events;
CREATE TRIGGER audit_task_events
AFTER INSERT OR UPDATE OR DELETE ON public.task_events
FOR EACH ROW EXECUTE FUNCTION public.fn_comprehensive_audit();

-- ============================================
-- SECTION 6: Add soft delete columns to core tables (non-destructive)
-- ============================================

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.routines ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.automation_rules ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Indexes for soft delete queries
CREATE INDEX IF NOT EXISTS idx_tasks_active ON public.tasks(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_active ON public.projects(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_habits_active ON public.habits(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_goals_active ON public.goals(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_routines_active ON public.routines(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_automation_rules_active_soft ON public.automation_rules(user_id) WHERE deleted_at IS NULL;
