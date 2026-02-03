-- Table Wiki pour les explications scientifiques
CREATE TABLE IF NOT EXISTS public.program_elements_wiki (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL,
  user_id UUID NOT NULL,
  
  element_type TEXT NOT NULL CHECK (element_type IN ('habit', 'task', 'goal')),
  linked_item_id UUID,
  
  title TEXT NOT NULL,
  short_description TEXT,
  
  why_this_practice TEXT,
  scientific_basis TEXT,
  methodology_source TEXT,
  how_to_guide JSONB DEFAULT '[]',
  best_practices TEXT[],
  common_mistakes TEXT[],
  immediate_benefits TEXT[],
  medium_term_benefits TEXT[],
  long_term_benefits TEXT[],
  personalized_tips TEXT[],
  adaptation_suggestions TEXT,
  
  recommended_time TEXT,
  duration_minutes INTEGER,
  frequency TEXT,
  difficulty_level INTEGER,
  xp_reward INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wiki_linked ON program_elements_wiki(linked_item_id);
CREATE INDEX IF NOT EXISTS idx_wiki_program ON program_elements_wiki(program_id);
CREATE INDEX IF NOT EXISTS idx_wiki_user ON program_elements_wiki(user_id);

ALTER TABLE program_elements_wiki ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own wiki" ON program_elements_wiki 
  FOR ALL USING (auth.uid() = user_id);

-- Table pour les messages quotidiens de Sage
CREATE TABLE IF NOT EXISTS public.program_daily_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL,
  user_id UUID NOT NULL,
  day_number INTEGER NOT NULL,
  morning_message TEXT,
  evening_message TEXT,
  daily_tip TEXT,
  reflection_prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(program_id, user_id, day_number)
);

CREATE INDEX IF NOT EXISTS idx_daily_messages_lookup ON program_daily_messages(program_id, user_id, day_number);

ALTER TABLE program_daily_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own messages" ON program_daily_messages 
  FOR ALL USING (auth.uid() = user_id);