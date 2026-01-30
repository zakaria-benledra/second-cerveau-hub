-- =============================================
-- LOT 03: Savings Goals + Habits KPI Tables
-- =============================================

-- 1. SAVINGS GOALS TABLE (full CRUD + progress calculation)
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workspace_id UUID NOT NULL,
  name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL DEFAULT 0,
  current_amount NUMERIC NOT NULL DEFAULT 0,
  target_date DATE,
  category_id UUID REFERENCES public.finance_categories(id) ON DELETE SET NULL,
  allocation_type TEXT DEFAULT 'fixed' CHECK (allocation_type IN ('fixed', 'percentage', 'round_up')),
  allocation_value NUMERIC DEFAULT 0,
  color TEXT,
  icon TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for savings_goals
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON public.savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_workspace_id ON public.savings_goals(workspace_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_status ON public.savings_goals(status);

-- RLS for savings_goals
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own savings goals'
  ) THEN
    CREATE POLICY "Users can manage own savings goals"
      ON public.savings_goals
      FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Updated_at trigger for savings_goals
DROP TRIGGER IF EXISTS update_savings_goals_updated_at ON public.savings_goals;
CREATE TRIGGER update_savings_goals_updated_at
  BEFORE UPDATE ON public.savings_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. HABITS DAILY KPI TABLE (for performance - computed nightly)
CREATE TABLE IF NOT EXISTS public.habits_kpi (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workspace_id UUID NOT NULL,
  habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  streak_at_date INTEGER DEFAULT 0,
  consistency_7d NUMERIC DEFAULT 0,
  consistency_30d NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (habit_id, date)
);

-- Indexes for habits_kpi
CREATE INDEX IF NOT EXISTS idx_habits_kpi_user_id ON public.habits_kpi(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_kpi_workspace_id ON public.habits_kpi(workspace_id);
CREATE INDEX IF NOT EXISTS idx_habits_kpi_habit_date ON public.habits_kpi(habit_id, date);
CREATE INDEX IF NOT EXISTS idx_habits_kpi_date ON public.habits_kpi(date);

-- RLS for habits_kpi
ALTER TABLE public.habits_kpi ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own habits KPI'
  ) THEN
    CREATE POLICY "Users can view own habits KPI"
      ON public.habits_kpi
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Backend can manage habits KPI'
  ) THEN
    CREATE POLICY "Backend can manage habits KPI"
      ON public.habits_kpi
      FOR ALL
      USING (true);
  END IF;
END $$;

-- 3. FINANCE CATEGORIZATION RULES (extensible via DB)
CREATE TABLE IF NOT EXISTS public.finance_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workspace_id UUID NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  regex_pattern TEXT,
  category_id UUID REFERENCES public.finance_categories(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for finance_rules
CREATE INDEX IF NOT EXISTS idx_finance_rules_user_id ON public.finance_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_rules_workspace_id ON public.finance_rules(workspace_id);
CREATE INDEX IF NOT EXISTS idx_finance_rules_priority ON public.finance_rules(priority DESC);

-- RLS for finance_rules
ALTER TABLE public.finance_rules ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own finance rules'
  ) THEN
    CREATE POLICY "Users can manage own finance rules"
      ON public.finance_rules
      FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Updated_at trigger for finance_rules
DROP TRIGGER IF EXISTS update_finance_rules_updated_at ON public.finance_rules;
CREATE TRIGGER update_finance_rules_updated_at
  BEFORE UPDATE ON public.finance_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. ADD goal_id TO FINANCE_TRANSACTIONS (link transactions to savings goals)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'finance_transactions' AND column_name = 'goal_id'
  ) THEN
    ALTER TABLE public.finance_transactions 
    ADD COLUMN goal_id UUID REFERENCES public.savings_goals(id) ON DELETE SET NULL;
    
    CREATE INDEX idx_finance_transactions_goal_id ON public.finance_transactions(goal_id);
  END IF;
END $$;