-- 1. Table des programmes disponibles
CREATE TABLE IF NOT EXISTS public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL,
  focus_domain TEXT CHECK (focus_domain IN ('discipline', 'mental', 'finance', 'performance', 'general')),
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'extreme')) DEFAULT 'intermediate',
  icon TEXT DEFAULT '📋',
  cover_color TEXT DEFAULT 'primary',
  is_active BOOLEAN DEFAULT true,
  xp_reward INTEGER DEFAULT 500,
  badge_reward_id TEXT REFERENCES badges(id),
  requirements JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Jours/missions d'un programme
CREATE TABLE IF NOT EXISTS public.program_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  mission_type TEXT CHECK (mission_type IN ('habit', 'task', 'journal', 'goal', 'reflection', 'score', 'streak', 'custom')) NOT NULL,
  mission_target JSONB NOT NULL DEFAULT '{"count": 1}',
  bonus_mission JSONB,
  sage_tip TEXT,
  xp_reward INTEGER DEFAULT 25,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(program_id, day_number)
);

-- 3. Inscription utilisateur à un programme
CREATE TABLE IF NOT EXISTS public.user_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  workspace_id UUID REFERENCES workspaces(id),
  program_id UUID NOT NULL REFERENCES programs(id),
  status TEXT CHECK (status IN ('active', 'completed', 'paused', 'abandoned')) DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT now(),
  current_day INTEGER DEFAULT 1,
  completed_at TIMESTAMPTZ,
  streak_days INTEGER DEFAULT 0,
  total_xp_earned INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, program_id)
);

-- 4. Progression quotidienne
CREATE TABLE IF NOT EXISTS public.user_program_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  workspace_id UUID REFERENCES workspaces(id),
  user_program_id UUID NOT NULL REFERENCES user_programs(id) ON DELETE CASCADE,
  program_day_id UUID NOT NULL REFERENCES program_days(id),
  day_date DATE NOT NULL DEFAULT CURRENT_DATE,
  main_mission_completed BOOLEAN DEFAULT false,
  bonus_completed BOOLEAN DEFAULT false,
  xp_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_program_id, program_day_id)
);

-- 5. Contexte Sage par page (pour analytics)
CREATE TABLE IF NOT EXISTS public.sage_page_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  workspace_id UUID REFERENCES workspaces(id),
  page_path TEXT NOT NULL,
  visited_at TIMESTAMPTZ DEFAULT now(),
  context_data JSONB DEFAULT '{}'
);

-- RLS
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_program_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE sage_page_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Programs visible to all" ON programs FOR SELECT USING (is_active = true);
CREATE POLICY "Program days visible" ON program_days FOR SELECT USING (true);
CREATE POLICY "Users manage own programs" ON user_programs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own progress" ON user_program_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own visits" ON sage_page_visits FOR ALL USING (auth.uid() = user_id);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_user_programs_active ON user_programs(user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_program_days_lookup ON program_days(program_id, day_number);
CREATE INDEX IF NOT EXISTS idx_sage_visits_user ON sage_page_visits(user_id, visited_at DESC);

-- DONNÉES PAR DÉFAUT : Programmes
INSERT INTO programs (name, slug, description, duration_days, focus_domain, difficulty, icon, xp_reward) VALUES
('🌱 Démarrage Minded', 'onboarding-7', 'Découvre les bases de Minded en 7 jours. Parfait pour commencer !', 7, 'general', 'beginner', '🌱', 200),
('💪 Maître de la Discipline', 'discipline-30', 'Construis des habitudes solides et une routine imbattable en 30 jours.', 30, 'discipline', 'intermediate', '💪', 750),
('🧘 Équilibre Mental', 'mental-21', 'Retrouve ta sérénité et ton équilibre émotionnel en 21 jours.', 21, 'mental', 'intermediate', '🧘', 500),
('💰 Finances en Contrôle', 'finance-30', 'Reprends le contrôle de tes finances et épargne intelligemment.', 30, 'finance', 'intermediate', '💰', 750),
('🔥 Challenge Intensif', 'challenge-14', '14 jours pour te dépasser et atteindre de nouveaux sommets.', 14, 'performance', 'advanced', '🔥', 400),
('🚀 Transformation Élite', 'elite-90', 'Le programme ultime de transformation sur 3 mois.', 90, 'performance', 'extreme', '🚀', 2000)
ON CONFLICT (slug) DO NOTHING;

-- DONNÉES PAR DÉFAUT : Jours du programme Démarrage (7 jours)
DO $$
DECLARE
  prog_id UUID;
BEGIN
  SELECT id INTO prog_id FROM programs WHERE slug = 'onboarding-7';
  IF prog_id IS NOT NULL THEN
    INSERT INTO program_days (program_id, day_number, title, description, mission_type, mission_target, sage_tip, xp_reward) VALUES
    (prog_id, 1, 'Créer tes premières habitudes', 'Configure 3 habitudes simples pour commencer.', 'habit', '{"action":"create","count":3}', 'Commence simple : lever, eau, 5 min lecture. La simplicité est la clé !', 30),
    (prog_id, 2, 'Première journée complète', 'Complète toutes tes habitudes du jour.', 'habit', '{"action":"complete_all"}', 'Une habitude à la fois. Tu vas y arriver !', 30),
    (prog_id, 3, 'Planifier demain', 'Crée 3 tâches pour demain soir.', 'task', '{"action":"create","count":3}', 'Planifier le soir réduit le stress du matin de 40%.', 25),
    (prog_id, 4, 'Journal de gratitude', 'Écris une entrée sur ce pour quoi tu es reconnaissant.', 'journal', '{"action":"create","mood":"good"}', 'La gratitude améliore le bien-être de 25%. Essaie !', 25),
    (prog_id, 5, 'Streak de 3 jours', 'Maintiens tes habitudes pendant 3 jours consécutifs.', 'streak', '{"min":3}', 'Le plus dur est fait ! Continue sur ta lancée.', 40),
    (prog_id, 6, 'Atteindre 50%', 'Atteins un score global de 50% minimum.', 'score', '{"min":50}', 'Le score reflète ta constance. Chaque % compte !', 35),
    (prog_id, 7, 'Bilan de la semaine', 'Réflexion finale sur ta première semaine Minded.', 'reflection', '{"action":"journal","theme":"bilan"}', 'Bravo pour cette première semaine ! Tu as posé les fondations. 🎉', 50)
    ON CONFLICT (program_id, day_number) DO NOTHING;
  END IF;
END $$;