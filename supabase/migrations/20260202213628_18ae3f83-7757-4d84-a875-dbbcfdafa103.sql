-- User levels table (complements gamification_profiles)
CREATE TABLE IF NOT EXISTS public.user_levels (
  user_id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id),
  current_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  total_xp_earned INTEGER DEFAULT 0,
  last_level_up_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Gamification challenges table
CREATE TABLE IF NOT EXISTS public.gamification_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT CHECK (challenge_type IN ('daily', 'weekly', 'monthly', 'special')),
  target_type TEXT,
  target_value INTEGER,
  xp_reward INTEGER DEFAULT 100,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User challenge progress
CREATE TABLE IF NOT EXISTS public.user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id),
  challenge_id UUID NOT NULL REFERENCES public.gamification_challenges(id) ON DELETE CASCADE,
  current_progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- Enable RLS
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage own levels" ON public.user_levels 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Challenges readable by all authenticated" ON public.gamification_challenges 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users manage own challenge progress" ON public.user_challenges 
  FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_levels_user ON public.user_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_user ON public.user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_gamification_challenges_active ON public.gamification_challenges(is_active) WHERE is_active = true;

-- Insert additional badges if not exist
INSERT INTO public.badges (id, name, description, icon, category, requirement_type, requirement_value, xp_reward, rarity) VALUES
('streak_7', 'Une Semaine', '7 jours de suite', '🔥', 'streak', 'streak_days', 7, 50, 'common'),
('streak_30', 'Un Mois', '30 jours de suite', '💪', 'streak', 'streak_days', 30, 150, 'rare'),
('streak_100', 'Centurion', '100 jours de suite', '🏅', 'streak', 'streak_days', 100, 500, 'epic'),
('streak_365', 'Immortel', '365 jours de suite', '⭐', 'streak', 'streak_days', 365, 1000, 'legendary'),
('early_bird', 'Lève-tôt', 'Complète une habitude avant 7h', '🐦', 'special', 'early_completion', 1, 50, 'common'),
('night_owl', 'Oiseau de Nuit', 'Complète une tâche après 22h', '🦉', 'special', 'late_completion', 1, 50, 'common'),
('perfect_week', 'Semaine Parfaite', '100% des habitudes pendant 7 jours', '💯', 'special', 'perfect_week', 1, 200, 'rare'),
('comeback', 'Le Retour', 'Reviens après 7 jours d''absence', '🔄', 'special', 'comeback', 1, 75, 'common')
ON CONFLICT (id) DO NOTHING;

-- Insert sample challenges
INSERT INTO public.gamification_challenges (title, description, challenge_type, target_type, target_value, xp_reward, is_active) VALUES
('Semaine Active', 'Complète 7 habitudes cette semaine', 'weekly', 'habits_completed', 7, 100, true),
('Marathon Journal', 'Écris 5 entrées journal ce mois', 'monthly', 'journal_entries', 5, 150, true),
('Productivité Express', 'Termine 3 tâches aujourd''hui', 'daily', 'tasks_completed', 3, 50, true)
ON CONFLICT DO NOTHING;