
-- =============================================
-- P0 FIXES: R2, R3, R8
-- =============================================

-- R3: Add run_id to sage_experiences for causal linking
ALTER TABLE public.sage_experiences 
ADD COLUMN IF NOT EXISTS run_id UUID REFERENCES public.sage_runs(id) ON DELETE SET NULL;

-- R3: Add feedback_type column to sage_experiences for direct access
ALTER TABLE public.sage_experiences
ADD COLUMN IF NOT EXISTS feedback_type TEXT CHECK (feedback_type IN ('accepted', 'rejected', 'ignored'));

-- R2: Create trigger to sync feedback_type from sage_feedback to sage_experiences
CREATE OR REPLACE FUNCTION public.sync_feedback_to_experience()
RETURNS TRIGGER AS $$
BEGIN
  -- Update sage_experiences with feedback_type based on run_id match
  UPDATE public.sage_experiences se
  SET feedback_type = CASE 
    WHEN NEW.helpful = true THEN 'accepted'
    WHEN NEW.ignored = true THEN 'ignored'
    ELSE 'rejected'
  END
  WHERE se.run_id = NEW.run_id
    AND se.user_id = NEW.user_id
    AND se.feedback_type IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_sync_feedback_to_experience
  AFTER INSERT ON public.sage_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_feedback_to_experience();

-- R8: AI Cost Ledger
CREATE TABLE IF NOT EXISTS public.ai_cost_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  function_name TEXT NOT NULL,
  model_name TEXT NOT NULL DEFAULT 'unknown',
  input_tokens INT NOT NULL DEFAULT 0,
  output_tokens INT NOT NULL DEFAULT 0,
  cost_usd NUMERIC(10,6) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cost_ledger_user_date ON public.ai_cost_ledger(user_id, created_at DESC);

ALTER TABLE public.ai_cost_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own costs" ON public.ai_cost_ledger FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can insert costs" ON public.ai_cost_ledger FOR INSERT WITH CHECK (auth.uid() = user_id);

-- R8: AI Rate Limits
CREATE TABLE IF NOT EXISTS public.ai_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  daily_token_limit INT DEFAULT 50000,
  daily_tokens_used INT DEFAULT 0,
  daily_cost_limit_usd NUMERIC(10,4) DEFAULT 1.00,
  daily_cost_used_usd NUMERIC(10,4) DEFAULT 0,
  quota_reset_at TIMESTAMPTZ NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 day')
);

ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own limits" ON public.ai_rate_limits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own limits" ON public.ai_rate_limits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service can insert limits" ON public.ai_rate_limits FOR INSERT WITH CHECK (auth.uid() = user_id);

-- R8: Function to check and update rate limits (used by edge functions)
CREATE OR REPLACE FUNCTION public.check_ai_rate_limit(p_user_id UUID, p_tokens INT, p_cost NUMERIC)
RETURNS BOOLEAN AS $$
DECLARE
  v_limit RECORD;
BEGIN
  -- Get or create rate limit record
  INSERT INTO public.ai_rate_limits (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  SELECT * INTO v_limit FROM public.ai_rate_limits WHERE user_id = p_user_id FOR UPDATE;
  
  -- Reset if quota expired
  IF v_limit.quota_reset_at <= now() THEN
    UPDATE public.ai_rate_limits 
    SET daily_tokens_used = 0, daily_cost_used_usd = 0, quota_reset_at = CURRENT_DATE + INTERVAL '1 day'
    WHERE user_id = p_user_id;
    v_limit.daily_tokens_used := 0;
    v_limit.daily_cost_used_usd := 0;
  END IF;
  
  -- Check limits
  IF (v_limit.daily_tokens_used + p_tokens) > v_limit.daily_token_limit THEN
    RETURN FALSE;
  END IF;
  
  IF (v_limit.daily_cost_used_usd + p_cost) > v_limit.daily_cost_limit_usd THEN
    RETURN FALSE;
  END IF;
  
  -- Update usage
  UPDATE public.ai_rate_limits 
  SET daily_tokens_used = daily_tokens_used + p_tokens, 
      daily_cost_used_usd = daily_cost_used_usd + p_cost
  WHERE user_id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
