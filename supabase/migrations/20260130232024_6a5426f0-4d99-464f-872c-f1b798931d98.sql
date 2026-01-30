-- Drop and recreate intervention_type check constraint with all valid types
ALTER TABLE public.ai_interventions 
DROP CONSTRAINT IF EXISTS ai_interventions_intervention_type_check;

ALTER TABLE public.ai_interventions 
ADD CONSTRAINT ai_interventions_intervention_type_check 
CHECK (intervention_type = ANY (ARRAY[
  'motivation'::text, 
  'warning'::text, 
  'challenge'::text, 
  'praise'::text, 
  'restructure'::text,
  'reduce_load'::text,
  'force_break'::text,
  'streak_protection'::text,
  'financial_alert'::text,
  'block_action'::text,
  'create_recovery_task'::text
]));