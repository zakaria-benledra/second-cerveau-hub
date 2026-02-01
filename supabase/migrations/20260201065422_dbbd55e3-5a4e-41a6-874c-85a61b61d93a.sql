-- Plans disponibles
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly INTEGER NOT NULL, -- en centimes
  price_yearly INTEGER, -- en centimes
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
  '["Tout Premium", "Multi-utilisateurs", "Dashboard admin", "Défis d''équipe", "API access"]'::jsonb,
  '{"max_habits": -1, "max_active_tasks": -1, "max_goals": -1, "analytics_days": 365, "max_team_members": 10}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  features = EXCLUDED.features,
  limits = EXCLUDED.limits;

-- Abonnements utilisateurs
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'past_due', 'trialing'
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
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe ON user_subscriptions(stripe_subscription_id);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Trigger pour créer un abonnement gratuit par défaut
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_subscriptions (user_id, plan_id, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_user_created_subscription ON auth.users;
CREATE TRIGGER on_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_subscription();

-- Créer les abonnements pour les utilisateurs existants
INSERT INTO user_subscriptions (user_id, plan_id, status)
SELECT id, 'free', 'active' FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Historique des paiements
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_id TEXT,
  amount INTEGER NOT NULL, -- en centimes
  currency TEXT DEFAULT 'eur',
  status TEXT NOT NULL, -- 'succeeded', 'failed', 'pending'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON payment_history
  FOR SELECT USING (auth.uid() = user_id);