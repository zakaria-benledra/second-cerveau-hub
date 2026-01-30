-- ============= LOT 01: PRODUCTION-GRADE MIGRATION =============
-- Multi-tenant + Idempotency + Encryption compliance

-- ============= 1. UNIQUE CONSTRAINTS FOR IDEMPOTENCY =============

-- Add event_id column to task_events if not exists
ALTER TABLE task_events ADD COLUMN IF NOT EXISTS event_id TEXT;

-- Add unique constraint on task_events (workspace_id, event_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'task_events_workspace_event_unique'
  ) THEN
    ALTER TABLE task_events ADD CONSTRAINT task_events_workspace_event_unique 
      UNIQUE (workspace_id, event_id);
  END IF;
END $$;

-- Add event_id column to undo_stack if not exists
ALTER TABLE undo_stack ADD COLUMN IF NOT EXISTS event_id TEXT;

-- Add unique constraint on undo_stack (workspace_id, event_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'undo_stack_workspace_event_unique'
  ) THEN
    ALTER TABLE undo_stack ADD CONSTRAINT undo_stack_workspace_event_unique 
      UNIQUE (workspace_id, event_id);
  END IF;
END $$;

-- ============= 2. ENCRYPTION COLUMNS FOR connected_accounts =============

-- Add encryption columns if not exist
ALTER TABLE connected_accounts ADD COLUMN IF NOT EXISTS refresh_token_encrypted TEXT;
ALTER TABLE connected_accounts ADD COLUMN IF NOT EXISTS encryption_version INTEGER DEFAULT 2;
ALTER TABLE connected_accounts ADD COLUMN IF NOT EXISTS token_migrated_at TIMESTAMPTZ;

-- Create index for efficient lookup of unmigrated tokens
CREATE INDEX IF NOT EXISTS idx_connected_accounts_unmigrated 
  ON connected_accounts (user_id) 
  WHERE refresh_token IS NOT NULL AND refresh_token_encrypted IS NULL;

-- ============= 3. INDEXES FOR IDEMPOTENCY LOOKUPS =============

-- Fast lookup for event_id checks
CREATE INDEX IF NOT EXISTS idx_task_events_event_id ON task_events (event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_undo_stack_event_id ON undo_stack (event_id) WHERE event_id IS NOT NULL;

-- ============= 4. ENSURE workspace_id NOT NULL ON CRITICAL TABLES =============
-- Note: This is handled at application level via getRequiredWorkspaceId()
-- We add default constraints for future inserts

-- Add check constraint for workspace_id on system_events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'system_events_workspace_required'
  ) THEN
    -- First, backfill any NULL workspace_ids with a placeholder query
    -- (actual backfill requires user context)
    ALTER TABLE system_events 
      ADD CONSTRAINT system_events_workspace_required 
      CHECK (workspace_id IS NOT NULL) NOT VALID;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============= 5. UNIQUE CONSTRAINT FOR FINANCE TRANSACTIONS DEDUP =============

-- Ensure unique external_id per user for idempotent CSV imports
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'finance_transactions_user_external_unique'
  ) THEN
    ALTER TABLE finance_transactions ADD CONSTRAINT finance_transactions_user_external_unique 
      UNIQUE (user_id, external_id);
  END IF;
END $$;

-- Index for external_id lookups
CREATE INDEX IF NOT EXISTS idx_finance_transactions_external_id 
  ON finance_transactions (external_id) WHERE external_id IS NOT NULL;

-- ============= 6. CALENDAR EVENTS UNIQUE FOR SYNC IDEMPOTENCY =============

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'calendar_events_user_provider_external_unique'
  ) THEN
    ALTER TABLE calendar_events ADD CONSTRAINT calendar_events_user_provider_external_unique 
      UNIQUE (user_id, provider, external_id);
  END IF;
END $$;

-- ============= 7. HABIT_LOGS UNIQUE CONSTRAINT (per habit per day) =============

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'habit_logs_habit_date_unique'
  ) THEN
    ALTER TABLE habit_logs ADD CONSTRAINT habit_logs_habit_date_unique 
      UNIQUE (habit_id, date);
  END IF;
END $$;

-- ============= 8. WEEKLY_STATS COMPOSITE UNIQUE FOR MULTI-TENANT =============

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'weekly_stats_user_workspace_week_unique'
  ) THEN
    ALTER TABLE weekly_stats ADD CONSTRAINT weekly_stats_user_workspace_week_unique 
      UNIQUE (user_id, workspace_id, week_start);
  END IF;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ============= 9. SCORES_DAILY COMPOSITE UNIQUE FOR MULTI-TENANT =============

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'scores_daily_user_workspace_date_unique'
  ) THEN
    -- Check if simpler constraint exists first
    IF EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'scores_daily_user_id_date_key'
    ) THEN
      ALTER TABLE scores_daily DROP CONSTRAINT scores_daily_user_id_date_key;
    END IF;
    
    ALTER TABLE scores_daily ADD CONSTRAINT scores_daily_user_workspace_date_unique 
      UNIQUE (user_id, workspace_id, date);
  END IF;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ============= 10. DAILY_STATS COMPOSITE UNIQUE FOR MULTI-TENANT =============

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'daily_stats_user_workspace_date_unique'
  ) THEN
    -- Check if simpler constraint exists first
    IF EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'daily_stats_user_id_date_key'
    ) THEN
      ALTER TABLE daily_stats DROP CONSTRAINT daily_stats_user_id_date_key;
    END IF;
    
    ALTER TABLE daily_stats ADD CONSTRAINT daily_stats_user_workspace_date_unique 
      UNIQUE (user_id, workspace_id, date);
  END IF;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;