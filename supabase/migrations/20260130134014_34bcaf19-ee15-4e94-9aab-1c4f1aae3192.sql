-- Fix overly permissive RLS policies on job_runs
DROP POLICY IF EXISTS "Service can insert job runs" ON public.job_runs;
DROP POLICY IF EXISTS "Service can update job runs" ON public.job_runs;

-- Only allow inserts/updates from service role (via Edge Functions)
-- These operations should only happen from backend, not directly from client
CREATE POLICY "Backend can insert job runs" ON public.job_runs
  FOR INSERT WITH CHECK (
    -- Only admins can manually insert, or it's done via service role
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner')
  );

CREATE POLICY "Backend can update job runs" ON public.job_runs
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner')
  );