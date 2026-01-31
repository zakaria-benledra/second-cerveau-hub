-- Add Financial Discipline Score columns to scores_daily
ALTER TABLE public.scores_daily 
ADD COLUMN IF NOT EXISTS financial_discipline_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS budget_adherence numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS impulsive_spending numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS savings_rate numeric DEFAULT 0;

-- Add index for financial discipline queries
CREATE INDEX IF NOT EXISTS idx_scores_daily_financial_discipline 
ON public.scores_daily (user_id, date, financial_discipline_score);

-- Comment for documentation
COMMENT ON COLUMN public.scores_daily.financial_discipline_score IS 'Composite score: 40% budget adherence + 30% (1-impulsive) + 30% savings rate';
COMMENT ON COLUMN public.scores_daily.budget_adherence IS 'Percentage of categories within budget limits';
COMMENT ON COLUMN public.scores_daily.impulsive_spending IS 'Percentage of uncategorized/impulsive transactions';
COMMENT ON COLUMN public.scores_daily.savings_rate IS 'Percentage of income saved (income - expenses) / income';