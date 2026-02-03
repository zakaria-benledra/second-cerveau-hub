-- Archives des programmes terminés (pour AI learning)
CREATE TABLE IF NOT EXISTS public.program_archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  workspace_id UUID REFERENCES workspaces(id),
  program_id UUID NOT NULL REFERENCES programs(id),
  original_user_program_id UUID,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ DEFAULT now(),
  final_status TEXT CHECK (final_status IN ('completed', 'abandoned', 'replaced')),
  days_completed INTEGER DEFAULT 0,
  total_xp_earned INTEGER DEFAULT 0,
  completion_rate NUMERIC(5,2) DEFAULT 0,
  performance_data JSONB DEFAULT '{}',
  created_habits JSONB DEFAULT '[]',
  created_tasks JSONB DEFAULT '[]',
  created_goals JSONB DEFAULT '[]',
  user_feedback TEXT,
  ai_analysis JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Templates de contenu par programme
CREATE TABLE IF NOT EXISTS public.program_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  template_type TEXT CHECK (template_type IN ('habit', 'task', 'goal', 'routine')) NOT NULL,
  day_to_create INTEGER DEFAULT 1,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority TEXT DEFAULT 'medium',
  frequency TEXT,
  target_value INTEGER,
  personalization_tags TEXT[] DEFAULT '{}',
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  is_required BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Lien entre éléments créés et programme source
CREATE TABLE IF NOT EXISTS public.program_created_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  workspace_id UUID REFERENCES workspaces(id),
  user_program_id UUID NOT NULL REFERENCES user_programs(id) ON DELETE CASCADE,
  item_type TEXT CHECK (item_type IN ('habit', 'task', 'goal', 'routine')) NOT NULL,
  item_id UUID NOT NULL,
  template_id UUID REFERENCES program_templates(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_program_id, item_type, item_id)
);

-- Ajouter les colonnes created_from_program aux tables existantes
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS created_from_program UUID REFERENCES programs(id);
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS created_from_program UUID REFERENCES programs(id);
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS created_from_program UUID REFERENCES programs(id);
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS created_from_program UUID REFERENCES programs(id);

-- RLS
ALTER TABLE program_archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_created_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own archives" ON program_archives FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own archives" ON program_archives FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Templates visible to all" ON program_templates FOR SELECT USING (true);
CREATE POLICY "Users manage own created items" ON program_created_items FOR ALL USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_program_archives_user ON program_archives(user_id, ended_at DESC);
CREATE INDEX IF NOT EXISTS idx_program_templates_program ON program_templates(program_id, day_to_create);
CREATE INDEX IF NOT EXISTS idx_program_created_items_user ON program_created_items(user_id, user_program_id);
CREATE INDEX IF NOT EXISTS idx_habits_program ON habits(created_from_program) WHERE created_from_program IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_program ON tasks(created_from_program) WHERE created_from_program IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_goals_program ON goals(created_from_program) WHERE created_from_program IS NOT NULL;

-- Templates pour le programme "Démarrage Minded" (7 jours)
INSERT INTO program_templates (program_id, template_type, day_to_create, title, description, category, frequency, personalization_tags, difficulty)
SELECT p.id, 'habit', 1, 'Réveil matinal', 'Se lever à heure fixe chaque jour', 'morning', 'daily', ARRAY['santé', 'productivité'], 'easy'
FROM programs p WHERE p.slug = 'onboarding-7'
ON CONFLICT DO NOTHING;

INSERT INTO program_templates (program_id, template_type, day_to_create, title, description, category, frequency, personalization_tags, difficulty)
SELECT p.id, 'habit', 1, 'Verre d''eau au réveil', 'Boire un grand verre d''eau dès le réveil', 'health', 'daily', ARRAY['santé', 'bien-être'], 'easy'
FROM programs p WHERE p.slug = 'onboarding-7'
ON CONFLICT DO NOTHING;

INSERT INTO program_templates (program_id, template_type, day_to_create, title, description, category, frequency, personalization_tags, difficulty)
SELECT p.id, 'habit', 1, 'Lecture 10 min', '10 minutes de lecture chaque jour', 'learning', 'daily', ARRAY['apprentissage', 'développement'], 'easy'
FROM programs p WHERE p.slug = 'onboarding-7'
ON CONFLICT DO NOTHING;

INSERT INTO program_templates (program_id, template_type, day_to_create, title, description, category, priority, personalization_tags, difficulty)
SELECT p.id, 'task', 2, 'Définir mes 3 priorités de la semaine', 'Liste les 3 choses les plus importantes à accomplir', 'planning', 'medium', ARRAY['productivité'], 'easy'
FROM programs p WHERE p.slug = 'onboarding-7'
ON CONFLICT DO NOTHING;

INSERT INTO program_templates (program_id, template_type, day_to_create, title, description, category, personalization_tags, difficulty, target_value)
SELECT p.id, 'goal', 3, 'Premier streak de 7 jours', 'Maintenir mes habitudes pendant 7 jours consécutifs', 'streak', ARRAY['discipline'], 'medium', 7
FROM programs p WHERE p.slug = 'onboarding-7'
ON CONFLICT DO NOTHING;

INSERT INTO program_templates (program_id, template_type, day_to_create, title, description, category, frequency, personalization_tags, difficulty)
SELECT p.id, 'habit', 4, 'Méditation 5 min', '5 minutes de méditation ou respiration', 'mental', 'daily', ARRAY['bien-être', 'mental', 'méditation'], 'easy'
FROM programs p WHERE p.slug = 'onboarding-7'
ON CONFLICT DO NOTHING;

INSERT INTO program_templates (program_id, template_type, day_to_create, title, description, category, priority, personalization_tags, difficulty)
SELECT p.id, 'task', 5, 'Faire le point sur mes finances', 'Vérifier mes dépenses de la semaine', 'finance', 'medium', ARRAY['finance'], 'medium'
FROM programs p WHERE p.slug = 'onboarding-7'
ON CONFLICT DO NOTHING;

INSERT INTO program_templates (program_id, template_type, day_to_create, title, description, category, frequency, personalization_tags, difficulty)
SELECT p.id, 'habit', 6, 'Pas d''écran 1h avant dormir', 'Déconnexion digitale le soir', 'evening', 'daily', ARRAY['santé', 'sommeil'], 'medium'
FROM programs p WHERE p.slug = 'onboarding-7'
ON CONFLICT DO NOTHING;

INSERT INTO program_templates (program_id, template_type, day_to_create, title, description, category, personalization_tags, difficulty, target_value)
SELECT p.id, 'goal', 7, 'Score de 50% atteint', 'Atteindre un score global de 50%', 'score', ARRAY['discipline'], 'medium', 50
FROM programs p WHERE p.slug = 'onboarding-7'
ON CONFLICT DO NOTHING;

-- Templates pour "Maître de la Discipline" (30 jours)
INSERT INTO program_templates (program_id, template_type, day_to_create, title, description, category, frequency, personalization_tags, difficulty)
SELECT p.id, 'habit', 1, 'Routine matinale', 'Créer une routine matinale de 30 min', 'morning', 'daily', ARRAY['productivité', 'santé'], 'medium'
FROM programs p WHERE p.slug = 'discipline-30'
ON CONFLICT DO NOTHING;

INSERT INTO program_templates (program_id, template_type, day_to_create, title, description, category, frequency, personalization_tags, difficulty)
SELECT p.id, 'habit', 1, 'Planification quotidienne', 'Planifier sa journée chaque matin', 'planning', 'daily', ARRAY['productivité'], 'easy'
FROM programs p WHERE p.slug = 'discipline-30'
ON CONFLICT DO NOTHING;

INSERT INTO program_templates (program_id, template_type, day_to_create, title, description, category, frequency, personalization_tags, difficulty)
SELECT p.id, 'habit', 1, 'Revue du soir', 'Faire le bilan de sa journée', 'evening', 'daily', ARRAY['réflexion'], 'easy'
FROM programs p WHERE p.slug = 'discipline-30'
ON CONFLICT DO NOTHING;

INSERT INTO program_templates (program_id, template_type, day_to_create, title, description, category, personalization_tags, difficulty, target_value)
SELECT p.id, 'goal', 1, 'Streak de 30 jours', 'Ne jamais briser la chaîne pendant 30 jours', 'streak', ARRAY['discipline'], 'hard', 30
FROM programs p WHERE p.slug = 'discipline-30'
ON CONFLICT DO NOTHING;

INSERT INTO program_templates (program_id, template_type, day_to_create, title, description, category, frequency, personalization_tags, difficulty)
SELECT p.id, 'habit', 8, 'Sport 30 min', 'Activité physique quotidienne', 'health', 'daily', ARRAY['santé', 'sport', 'fitness'], 'medium'
FROM programs p WHERE p.slug = 'discipline-30'
ON CONFLICT DO NOTHING;

INSERT INTO program_templates (program_id, template_type, day_to_create, title, description, category, priority, personalization_tags, difficulty)
SELECT p.id, 'task', 8, 'Éliminer 3 distractions', 'Identifier et bloquer 3 sources de distraction', 'focus', 'medium', ARRAY['productivité'], 'medium'
FROM programs p WHERE p.slug = 'discipline-30'
ON CONFLICT DO NOTHING;

INSERT INTO program_templates (program_id, template_type, day_to_create, title, description, category, frequency, personalization_tags, difficulty)
SELECT p.id, 'habit', 15, 'Deep Work 2h', '2 heures de travail concentré sans interruption', 'focus', 'daily', ARRAY['productivité', 'travail'], 'hard'
FROM programs p WHERE p.slug = 'discipline-30'
ON CONFLICT DO NOTHING;

INSERT INTO program_templates (program_id, template_type, day_to_create, title, description, category, priority, personalization_tags, difficulty)
SELECT p.id, 'task', 15, 'Définir mon objectif 90 jours', 'Créer un objectif SMART pour les 3 prochains mois', 'goals', 'high', ARRAY['ambition'], 'medium'
FROM programs p WHERE p.slug = 'discipline-30'
ON CONFLICT DO NOTHING;

-- Templates pour "Équilibre Mental" (21 jours)
INSERT INTO program_templates (program_id, template_type, day_to_create, title, description, category, frequency, personalization_tags, difficulty)
SELECT p.id, 'habit', 1, 'Méditation guidée', '10 minutes de méditation guidée', 'mental', 'daily', ARRAY['méditation', 'bien-être', 'mental'], 'easy'
FROM programs p WHERE p.slug = 'mental-21'
ON CONFLICT DO NOTHING;

INSERT INTO program_templates (program_id, template_type, day_to_create, title, description, category, frequency, personalization_tags, difficulty)
SELECT p.id, 'habit', 1, 'Journal de gratitude', 'Noter 3 choses positives chaque jour', 'journal', 'daily', ARRAY['gratitude', 'positif'], 'easy'
FROM programs p WHERE p.slug = 'mental-21'
ON CONFLICT DO NOTHING;

INSERT INTO program_templates (program_id, template_type, day_to_create, title, description, category, frequency, personalization_tags, difficulty)
SELECT p.id, 'habit', 1, 'Respiration consciente', '5 respirations profondes 3x/jour', 'health', 'daily', ARRAY['respiration', 'calme'], 'easy'
FROM programs p WHERE p.slug = 'mental-21'
ON CONFLICT DO NOTHING;

INSERT INTO program_templates (program_id, template_type, day_to_create, title, description, category, frequency, personalization_tags, difficulty)
SELECT p.id, 'habit', 8, 'Digital detox 2h', '2 heures sans écran chaque jour', 'wellness', 'daily', ARRAY['déconnexion', 'calme'], 'medium'
FROM programs p WHERE p.slug = 'mental-21'
ON CONFLICT DO NOTHING;

INSERT INTO program_templates (program_id, template_type, day_to_create, title, description, category, priority, personalization_tags, difficulty)
SELECT p.id, 'task', 8, 'Créer mon rituel du soir', 'Définir une routine apaisante avant le coucher', 'sleep', 'medium', ARRAY['sommeil', 'repos'], 'easy'
FROM programs p WHERE p.slug = 'mental-21'
ON CONFLICT DO NOTHING;

INSERT INTO program_templates (program_id, template_type, day_to_create, title, description, category, frequency, personalization_tags, difficulty)
SELECT p.id, 'habit', 15, 'Marche méditative', '20 minutes de marche en pleine conscience', 'health', 'daily', ARRAY['marche', 'nature', 'méditation'], 'medium'
FROM programs p WHERE p.slug = 'mental-21'
ON CONFLICT DO NOTHING;

INSERT INTO program_templates (program_id, template_type, day_to_create, title, description, category, personalization_tags, difficulty, target_value)
SELECT p.id, 'goal', 15, 'Score Mental 75%', 'Atteindre 75% en score Mental', 'score', ARRAY['mental'], 'medium', 75
FROM programs p WHERE p.slug = 'mental-21'
ON CONFLICT DO NOTHING;