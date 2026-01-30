-- Add new columns to existing ai_interventions table for automatic intervention logging
ALTER TABLE public.ai_interventions 
ADD COLUMN IF NOT EXISTS reason text,
ADD COLUMN IF NOT EXISTS severity text DEFAULT 'advisory',
ADD COLUMN IF NOT EXISTS auto_applied boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS applied_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS reverted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS impact_before jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS impact_after jsonb DEFAULT '{}';

-- Add check constraint for severity
ALTER TABLE public.ai_interventions 
DROP CONSTRAINT IF EXISTS ai_interventions_severity_check;

ALTER TABLE public.ai_interventions 
ADD CONSTRAINT ai_interventions_severity_check 
CHECK (severity IN ('advisory', 'warning', 'critical'));

-- Add index for applied_at for performance on time-based queries
CREATE INDEX IF NOT EXISTS idx_ai_interventions_applied_at 
ON public.ai_interventions(applied_at DESC);

-- Add index for severity for filtering critical interventions
CREATE INDEX IF NOT EXISTS idx_ai_interventions_severity 
ON public.ai_interventions(severity);

-- Add index for auto_applied interventions
CREATE INDEX IF NOT EXISTS idx_ai_interventions_auto_applied 
ON public.ai_interventions(auto_applied) WHERE auto_applied = true;