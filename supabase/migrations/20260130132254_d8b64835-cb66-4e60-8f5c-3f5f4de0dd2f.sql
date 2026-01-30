-- Fix RLS on automation_templates table
ALTER TABLE public.automation_templates ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read templates (they are global)
CREATE POLICY "Anyone can read automation templates"
ON public.automation_templates FOR SELECT
TO authenticated
USING (true);