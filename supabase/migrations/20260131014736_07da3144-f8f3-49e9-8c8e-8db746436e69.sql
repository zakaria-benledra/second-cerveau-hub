-- Add unique constraint on scores_daily for user_id and date
-- This is required for the upsert operation in compute-scores edge function
ALTER TABLE public.scores_daily 
ADD CONSTRAINT scores_daily_user_id_date_key UNIQUE (user_id, date);