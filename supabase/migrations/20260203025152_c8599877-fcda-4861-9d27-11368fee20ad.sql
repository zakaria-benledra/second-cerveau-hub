-- Programme généré par IA
CREATE TABLE IF NOT EXISTS public.ai_generated_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Informations du programme
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 30,
  program_type TEXT NOT NULL, -- 'discipline', 'mental', 'finance', 'balanced', 'custom'
  
  -- Méthodologies utilisées
  methodologies TEXT[] DEFAULT '{}', -- ['atomic_habits', 'gtd', 'pomodoro', 'mindfulness']
  scientific_references JSONB DEFAULT '[]', -- [{source, title, key_insight}]
  
  -- Contenu généré
  global_explanation TEXT, -- Explication globale du programme
  expected_outcomes TEXT[], -- Résultats attendus
  daily_schedule JSONB NOT NULL DEFAULT '[]', -- Planning jour par jour détaillé
  
  -- Personnalisation utilisée
  user_profile_snapshot JSONB NOT NULL DEFAULT '{}',
  generation_prompt TEXT, -- Le prompt complet utilisé
  
  -- Statut
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'archived')),
  current_day INTEGER DEFAULT 1,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  
  -- XP et progression
  total_xp_available INTEGER DEFAULT 0,
  total_xp_earned INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Éléments du programme avec explications détaillées (WIKI)
CREATE TABLE IF NOT EXISTS public.program_elements_wiki (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.ai_generated_programs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Type et référence
  element_type TEXT NOT NULL CHECK (element_type IN ('habit', 'task', 'goal', 'milestone', 'reflection')),
  linked_item_id UUID, -- ID dans habits/tasks/goals
  
  -- Contenu principal
  title TEXT NOT NULL,
  short_description TEXT,
  
  -- WIKI COMPLET
  why_this_practice TEXT NOT NULL, -- Pourquoi cette pratique est importante
  scientific_basis TEXT, -- Base scientifique/études
  methodology_source TEXT, -- Ex: "Atomic Habits - James Clear, Chapitre 2"
  
  how_to_guide JSONB DEFAULT '[]', -- [{step, title, description, tip}]
  best_practices TEXT[],
  common_mistakes TEXT[],
  
  -- Bénéfices détaillés
  immediate_benefits TEXT[], -- Court terme (1-7 jours)
  medium_term_benefits TEXT[], -- Moyen terme (1-4 semaines)
  long_term_benefits TEXT[], -- Long terme (1+ mois)
  
  -- Conseils personnalisés
  personalized_tips TEXT[], -- Adaptés aux intérêts de l'utilisateur
  adaptation_suggestions TEXT, -- Comment adapter si difficile
  
  -- Planning
  scheduled_day INTEGER, -- Jour d'introduction dans le programme
  recommended_time TEXT, -- 'morning', 'afternoon', 'evening', 'flexible'
  duration_minutes INTEGER,
  frequency TEXT, -- 'daily', 'weekly', '3x_week'
  
  -- Gamification
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  xp_reward INTEGER DEFAULT 10,
  streak_bonus_xp INTEGER DEFAULT 5,
  
  -- Statut
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Messages Sage contextuels et vivants
CREATE TABLE IF NOT EXISTS public.sage_contextual_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contexte
  page_path TEXT NOT NULL, -- '/dashboard', '/tasks', '/habits', etc.
  user_state TEXT NOT NULL, -- 'first_visit', 'returning', 'struggling', 'winning', 'streak_broken'
  time_of_day TEXT, -- 'morning', 'afternoon', 'evening', 'night'
  sage_tone TEXT NOT NULL, -- 'encouraging', 'direct', 'gentle'
  
  -- Messages (avec variables)
  greeting TEXT,
  main_message TEXT NOT NULL,
  contextual_tip TEXT,
  motivation_quote TEXT,
  action_suggestion TEXT,
  
  -- Personnalité
  emoji TEXT,
  mood TEXT, -- 'happy', 'proud', 'supportive', 'concerned', 'excited', 'calm'
  energy TEXT, -- 'high', 'medium', 'low'
  
  -- Conditions d'affichage
  min_score INTEGER,
  max_score INTEGER,
  min_streak INTEGER,
  max_streak INTEGER,
  has_active_program BOOLEAN,
  
  -- Priorité (pour résolution des conflits)
  priority INTEGER DEFAULT 50,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Progression quotidienne détaillée
CREATE TABLE IF NOT EXISTS public.daily_program_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.ai_generated_programs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  day_number INTEGER NOT NULL,
  progress_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Ce qui était prévu
  planned_habits JSONB DEFAULT '[]',
  planned_tasks JSONB DEFAULT '[]',
  daily_focus TEXT,
  sage_message_of_day TEXT,
  reflection_prompt TEXT,
  
  -- Ce qui a été fait
  completed_habits JSONB DEFAULT '[]',
  completed_tasks JSONB DEFAULT '[]',
  
  -- Métriques
  completion_rate NUMERIC(5,2) DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  
  -- Journal du jour
  user_reflection TEXT,
  mood TEXT,
  energy_level TEXT,
  
  -- Sage feedback
  sage_feedback TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(program_id, day_number)
);

-- RLS
ALTER TABLE public.ai_generated_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_elements_wiki ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sage_contextual_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_program_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own programs" ON public.ai_generated_programs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own elements" ON public.program_elements_wiki FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Sage messages visible to all" ON public.sage_contextual_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own progress" ON public.daily_program_progress FOR ALL USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_ai_programs_user_active ON public.ai_generated_programs(user_id, status) WHERE status = 'active';
CREATE INDEX idx_program_elements_program ON public.program_elements_wiki(program_id, element_type);
CREATE INDEX idx_sage_messages_context ON public.sage_contextual_messages(page_path, sage_tone);
CREATE INDEX idx_daily_progress_program ON public.daily_program_progress(program_id, day_number);