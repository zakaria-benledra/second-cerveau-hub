-- ═══════════════════════════════════════════════════════════════════
-- MINDED - SCRIPT SQL COMPLET
-- ═══════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────
-- 1. TABLE USER_PROFILES (Refonte UX)
-- ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'Europe/Paris',
  theme TEXT DEFAULT 'dark',
  sound_enabled BOOLEAN DEFAULT true,
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_step INTEGER DEFAULT 0,
  preferred_sage_tone TEXT DEFAULT 'encouraging',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger pour créer le profil automatiquement
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Créer les profils pour les utilisateurs existants
INSERT INTO user_profiles (id)
SELECT id FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────
-- 2. TABLES ANALYTICS (Phase 1)
-- ───────────────────────────────────────────────────────────────────

-- Add workspace_id to analytics_events if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'analytics_events' AND column_name = 'workspace_id') THEN
    ALTER TABLE analytics_events ADD COLUMN workspace_id UUID REFERENCES workspaces(id);
  END IF;
END $$;

-- Add workspace_id to analytics_sessions if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'analytics_sessions' AND column_name = 'workspace_id') THEN
    ALTER TABLE analytics_sessions ADD COLUMN workspace_id UUID REFERENCES workspaces(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_date ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_category ON analytics_events(event_category);

DROP POLICY IF EXISTS "Anyone can insert events" ON analytics_events;
CREATE POLICY "Anyone can insert events" ON analytics_events
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own events" ON analytics_events;
CREATE POLICY "Users can view own events" ON analytics_events
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user ON analytics_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_date ON analytics_sessions(started_at);

DROP POLICY IF EXISTS "Anyone can manage sessions" ON analytics_sessions;
CREATE POLICY "Anyone can manage sessions" ON analytics_sessions
  FOR ALL USING (true);

-- ───────────────────────────────────────────────────────────────────
-- 3. TABLES GAMIFICATION (Phase 2)
-- ───────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view own gamification" ON gamification_profiles;
CREATE POLICY "Users can view own gamification" ON gamification_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own gamification" ON gamification_profiles;
CREATE POLICY "Users can update own gamification" ON gamification_profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "System can insert gamification" ON gamification_profiles;
CREATE POLICY "System can insert gamification" ON gamification_profiles
  FOR INSERT WITH CHECK (true);

-- Update badges data
INSERT INTO badges (id, name, description, icon, category, requirement_type, requirement_value, xp_reward, rarity) VALUES
('streak_3', 'Démarrage', '3 jours consécutifs', '🌱', 'streak', 'streak_days', 3, 25, 'common'),
('streak_7', 'Semaine parfaite', '7 jours consécutifs', '🔥', 'streak', 'streak_days', 7, 50, 'common'),
('streak_14', 'Deux semaines', '14 jours consécutifs', '💪', 'streak', 'streak_days', 14, 100, 'rare'),
('streak_30', 'Mois complet', '30 jours consécutifs', '⭐', 'streak', 'streak_days', 30, 250, 'rare'),
('streak_60', 'Discipline de fer', '60 jours consécutifs', '🏆', 'streak', 'streak_days', 60, 500, 'epic'),
('streak_100', 'Centurion', '100 jours consécutifs', '👑', 'streak', 'streak_days', 100, 1000, 'legendary'),
('habits_10', 'Premiers pas', '10 habitudes complétées', '✅', 'habits', 'habits_count', 10, 25, 'common'),
('habits_50', 'Régulier', '50 habitudes complétées', '🎯', 'habits', 'habits_count', 50, 75, 'common'),
('habits_100', 'Discipliné', '100 habitudes complétées', '💫', 'habits', 'habits_count', 100, 150, 'rare'),
('habits_500', 'Machine', '500 habitudes complétées', '🤖', 'habits', 'habits_count', 500, 500, 'epic'),
('habits_1000', 'Légende', '1000 habitudes complétées', '🌟', 'habits', 'habits_count', 1000, 1000, 'legendary'),
('tasks_10', 'Productif', '10 tâches terminées', '📝', 'tasks', 'tasks_count', 10, 25, 'common'),
('tasks_50', 'Efficace', '50 tâches terminées', '🚀', 'tasks', 'tasks_count', 50, 75, 'common'),
('tasks_100', 'Pro', '100 tâches terminées', '💼', 'tasks', 'tasks_count', 100, 150, 'rare'),
('tasks_500', 'Expert', '500 tâches terminées', '🎖️', 'tasks', 'tasks_count', 500, 500, 'epic'),
('level_5', 'Apprenti', 'Atteindre niveau 5', '📚', 'level', 'level', 5, 100, 'common'),
('level_10', 'Confirmé', 'Atteindre niveau 10', '🎓', 'level', 'level', 10, 250, 'rare'),
('level_25', 'Expert', 'Atteindre niveau 25', '🏅', 'level', 'level', 25, 500, 'epic'),
('level_50', 'Maître', 'Atteindre niveau 50', '👑', 'level', 'level', 50, 1000, 'legendary'),
('first_habit', 'Première habitude', 'Compléter ta première habitude', '🎉', 'special', 'special', 1, 10, 'common'),
('first_task', 'Première tâche', 'Compléter ta première tâche', '✨', 'special', 'special', 1, 10, 'common'),
('perfect_day', 'Journée parfaite', 'Tout compléter en une journée', '🌈', 'special', 'special', 1, 100, 'rare'),
('early_bird', 'Lève-tôt', 'Compléter une action avant 7h', '🌅', 'special', 'special', 1, 50, 'rare'),
('night_owl', 'Noctambule', 'Compléter une action après 23h', '🦉', 'special', 'special', 1, 50, 'rare')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  xp_reward = EXCLUDED.xp_reward,
  rarity = EXCLUDED.rarity;

-- Table des badges débloqués
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own badges" ON user_badges;
CREATE POLICY "Users can view own badges" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert badges" ON user_badges;
CREATE POLICY "System can insert badges" ON user_badges
  FOR INSERT WITH CHECK (true);

-- Trigger pour créer profil gamification
CREATE OR REPLACE FUNCTION create_gamification_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO gamification_profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_created_gamification ON auth.users;
CREATE TRIGGER on_user_created_gamification
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_gamification_profile();

-- Créer profils gamification pour utilisateurs existants
INSERT INTO gamification_profiles (id)
SELECT id FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────
-- 4. TABLES MONETISATION (Phase 4)
-- ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly INTEGER NOT NULL,
  price_yearly INTEGER,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  features JSONB DEFAULT '[]',
  limits JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insérer les plans
INSERT INTO subscription_plans (id, name, description, price_monthly, price_yearly, features, limits) VALUES
('free', 'Gratuit', 'Pour commencer', 0, 0, 
  '["3 habitudes", "5 tâches actives", "Streak basique", "Sage basique"]'::jsonb,
  '{"max_habits": 3, "max_active_tasks": 5, "max_goals": 2, "analytics_days": 7}'::jsonb
),
('premium', 'Premium', 'Pour les ambitieux', 999, 9990,
  '["Habitudes illimitées", "Tâches illimitées", "Objectifs illimités", "Analytics complet", "Badges exclusifs", "Thèmes personnalisés", "Export données", "Support prioritaire"]'::jsonb,
  '{"max_habits": -1, "max_active_tasks": -1, "max_goals": -1, "analytics_days": 365}'::jsonb
),
('team', 'Team', 'Pour les équipes', 2999, 29990,
  '["Tout Premium", "Multi-utilisateurs", "Dashboard admin", "Défis équipe", "API access"]'::jsonb,
  '{"max_habits": -1, "max_active_tasks": -1, "max_goals": -1, "analytics_days": 365, "max_team_members": 10}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly;

-- Abonnements utilisateurs
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscription" ON user_subscriptions;
CREATE POLICY "Users can view own subscription" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can manage subscriptions" ON user_subscriptions;
CREATE POLICY "System can manage subscriptions" ON user_subscriptions
  FOR ALL USING (true);

-- Trigger pour abonnement gratuit par défaut
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_subscriptions (user_id, plan_id, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_created_subscription ON auth.users;
CREATE TRIGGER on_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_subscription();

-- Créer abonnements pour utilisateurs existants
INSERT INTO user_subscriptions (user_id, plan_id, status)
SELECT id, 'free', 'active' FROM auth.users
ON CONFLICT (user_id) DO NOTHING;