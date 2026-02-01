-- Activer RLS sur badges et weekly_challenges
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_challenges ENABLE ROW LEVEL SECURITY;

-- Politique de lecture publique pour badges (référentiel)
CREATE POLICY "Anyone can read badges" ON badges
  FOR SELECT USING (true);

-- Politique de lecture publique pour weekly_challenges
CREATE POLICY "Anyone can read active challenges" ON weekly_challenges
  FOR SELECT USING (is_active = true);

-- Corriger les fonctions avec search_path sécurisé
CREATE OR REPLACE FUNCTION calculate_level(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN GREATEST(1, FLOOR(SQRT(xp::float / 50)));
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION xp_for_next_level(current_level INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN (current_level + 1) * (current_level + 1) * 50;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION create_gamification_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO gamification_profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;