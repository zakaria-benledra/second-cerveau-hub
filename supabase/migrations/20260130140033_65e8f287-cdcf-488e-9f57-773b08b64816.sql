
-- Fix remaining overly permissive RLS policies
-- These are backend-only tables that should require admin role

-- Fix ai_metrics INSERT policy
DROP POLICY IF EXISTS "Service role can insert AI metrics" ON public.ai_metrics;
CREATE POLICY "Admins can insert AI metrics" 
ON public.ai_metrics 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fix system_health INSERT policy (we already fixed UPDATE, but INSERT was added separately)
DROP POLICY IF EXISTS "Service role can insert system health" ON public.system_health;
-- Policy already exists from previous migration, just ensure it's correct

-- Fix usage_ledger INSERT policy
DROP POLICY IF EXISTS "usage_ledger_insert" ON public.usage_ledger;
CREATE POLICY "Admins can insert usage ledger" 
ON public.usage_ledger 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Also add proper UPDATE policy for usage_ledger
DROP POLICY IF EXISTS "usage_ledger_update" ON public.usage_ledger;
CREATE POLICY "Admins can update usage ledger" 
ON public.usage_ledger 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));
