-- Vue matérialisée pour le classement (anonymisé par défaut)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.leaderboard_weekly AS
SELECT 
  gp.id as user_id,
  COALESCE(up.display_name, 'Joueur Anonyme') as display_name,
  COALESCE(up.avatar_url, '') as avatar_url,
  gp.total_xp,
  gp.current_level,
  gp.current_streak,
  gp.longest_streak,
  COALESCE(gp.lifetime_habits_completed, 0) + COALESCE(gp.lifetime_tasks_completed, 0) as total_actions,
  RANK() OVER (ORDER BY gp.total_xp DESC) as rank_xp,
  RANK() OVER (ORDER BY gp.current_streak DESC) as rank_streak
FROM public.gamification_profiles gp
LEFT JOIN public.user_profiles up ON gp.id = up.id
WHERE gp.total_xp > 0;

-- Index pour performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_weekly_user ON public.leaderboard_weekly(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_weekly_rank_xp ON public.leaderboard_weekly(rank_xp);
CREATE INDEX IF NOT EXISTS idx_leaderboard_weekly_rank_streak ON public.leaderboard_weekly(rank_streak);

-- Fonction pour rafraîchir (à appeler via cron)
CREATE OR REPLACE FUNCTION public.refresh_leaderboard()
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.leaderboard_weekly;
END;
$$;