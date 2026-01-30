-- Fix RLS policies for qa_test_status table (remove overly permissive policies)
DROP POLICY IF EXISTS "Authenticated users can view QA status" ON public.qa_test_status;
DROP POLICY IF EXISTS "Authenticated users can update QA status" ON public.qa_test_status;
DROP POLICY IF EXISTS "Authenticated users can insert QA status" ON public.qa_test_status;

-- Create proper RLS policies based on admin role
CREATE POLICY "Admins can manage QA status"
ON public.qa_test_status FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Users can view QA status"
ON public.qa_test_status FOR SELECT
TO authenticated
USING (true);

-- Fix system_health policies
DROP POLICY IF EXISTS "Service can insert system health" ON public.system_health;
DROP POLICY IF EXISTS "Service can update system health" ON public.system_health;

CREATE POLICY "Service role can insert system health"
ON public.system_health FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update system health"
ON public.system_health FOR UPDATE
TO service_role
USING (true);

-- Fix ai_metrics policies
DROP POLICY IF EXISTS "Service can insert AI metrics" ON public.ai_metrics;

CREATE POLICY "Service role can insert AI metrics"
ON public.ai_metrics FOR INSERT
TO service_role
WITH CHECK (true);