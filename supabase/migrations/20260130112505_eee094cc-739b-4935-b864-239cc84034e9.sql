-- Enable RLS on missing tables (metric_registry, ai_metrics, system_health)
-- These are public read tables but need RLS enabled

ALTER TABLE public.metric_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;

-- Metric Registry - public read for all authenticated users
CREATE POLICY "Authenticated users can view metrics" ON public.metric_registry 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can manage metrics" ON public.metric_registry 
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- AI Metrics - public read for authenticated users
CREATE POLICY "Authenticated users can view AI metrics" ON public.ai_metrics 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service can insert AI metrics" ON public.ai_metrics 
FOR INSERT TO authenticated WITH CHECK (true);

-- System Health - public read for authenticated users
CREATE POLICY "Authenticated users can view system health" ON public.system_health 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service can update system health" ON public.system_health 
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Service can insert system health" ON public.system_health 
FOR INSERT TO authenticated WITH CHECK (true);