-- =============================================
-- V35 LEARNING LOOP — MIGRATION COMPLÈTE
-- =============================================

-- 1. COLONNES AUDIT SUR SAGE_RUNS
ALTER TABLE IF EXISTS public.sage_runs
  ADD COLUMN IF NOT EXISTS consent_snapshot jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS learning_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS context_vector jsonb DEFAULT '[]'::jsonb;

-- 2. COLONNES AUDIT SUR SAGE_EXPERIENCES  
ALTER TABLE IF EXISTS public.sage_experiences
  ADD COLUMN IF NOT EXISTS consent_snapshot jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS learning_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS policy_version text DEFAULT 'v35',
  ADD COLUMN IF NOT EXISTS feedback_type text;

-- 3. COLONNES SUR SAGE_FEEDBACK
ALTER TABLE IF EXISTS public.sage_feedback
  ADD COLUMN IF NOT EXISTS consent_snapshot jsonb DEFAULT '{}'::jsonb;

-- 4. INDEX POUR JOB NIGHTLY
CREATE INDEX IF NOT EXISTS idx_sage_experiences_pending 
  ON public.sage_experiences(user_id, created_at DESC) 
  WHERE reward IS NULL AND learning_enabled = true;

CREATE INDEX IF NOT EXISTS idx_sage_experiences_user_learning
  ON public.sage_experiences(user_id, learning_enabled);

-- 5. NETTOYER TOUTES LES POLICIES EXISTANTES
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'sage_policy_weights',
        'sage_memory_patterns',
        'sage_memory_facts',
        'sage_experiences',
        'sage_feedback',
        'sage_runs',
        'user_consents',
        'behavioral_dna'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- 6. ENABLE + FORCE RLS
ALTER TABLE public.sage_policy_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sage_memory_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sage_memory_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sage_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sage_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sage_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavioral_dna ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.sage_policy_weights FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sage_memory_patterns FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sage_memory_facts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sage_experiences FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sage_feedback FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sage_runs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_consents FORCE ROW LEVEL SECURITY;
ALTER TABLE public.behavioral_dna FORCE ROW LEVEL SECURITY;

-- 7. POLICIES STRICTES
CREATE POLICY "v35_sage_policy_weights_user_only"
  ON public.sage_policy_weights FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "v35_sage_memory_patterns_user_only"
  ON public.sage_memory_patterns FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "v35_sage_memory_facts_user_only"
  ON public.sage_memory_facts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "v35_sage_experiences_user_only"
  ON public.sage_experiences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "v35_sage_feedback_user_only"
  ON public.sage_feedback FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "v35_sage_runs_user_only"
  ON public.sage_runs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "v35_user_consents_user_only"
  ON public.user_consents FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "v35_behavioral_dna_user_only"
  ON public.behavioral_dna FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 8. CONTRAINTE VERSION
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'chk_policy_version' 
    AND table_name = 'sage_experiences'
  ) THEN
    ALTER TABLE public.sage_experiences 
    ADD CONSTRAINT chk_policy_version 
    CHECK (policy_version IS NULL OR policy_version IN ('v34', 'v35', 'v36'));
  END IF;
END $$;

-- 9. COMMENT POUR DOCUMENTATION
COMMENT ON TABLE public.sage_experiences IS 'Expériences d''apprentissage du Policy Engine - v35';
COMMENT ON COLUMN public.sage_experiences.consent_snapshot IS 'Snapshot du consentement au moment de l''enregistrement';
COMMENT ON COLUMN public.sage_experiences.learning_enabled IS 'Si l''apprentissage était actif (peut être désactivé rétroactivement)';