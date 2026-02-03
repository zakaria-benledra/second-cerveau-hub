-- =============================================
-- PARTIE 1 : CRÉER LA TABLE WIKI (V48)
-- =============================================

-- Supprimer si existe (pour repartir propre)
DROP TABLE IF EXISTS public.program_elements_wiki CASCADE;

-- Créer la table
CREATE TABLE public.program_elements_wiki (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  program_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  element_type TEXT NOT NULL DEFAULT 'habit' CHECK (element_type IN ('habit', 'task', 'goal')),
  linked_item_id UUID,
  
  -- Infos de base
  title TEXT NOT NULL,
  short_description TEXT DEFAULT '',
  
  -- Contenu Wiki
  why_this_practice TEXT DEFAULT '',
  scientific_basis TEXT DEFAULT '',
  methodology_source TEXT DEFAULT '',
  how_to_guide JSONB DEFAULT '[]'::jsonb,
  best_practices TEXT[] DEFAULT '{}'::text[],
  common_mistakes TEXT[] DEFAULT '{}'::text[],
  immediate_benefits TEXT[] DEFAULT '{}'::text[],
  medium_term_benefits TEXT[] DEFAULT '{}'::text[],
  long_term_benefits TEXT[] DEFAULT '{}'::text[],
  personalized_tips TEXT[] DEFAULT '{}'::text[],
  adaptation_suggestions TEXT DEFAULT '',
  
  -- Métadonnées
  recommended_time TEXT DEFAULT 'morning',
  duration_minutes INTEGER DEFAULT 10,
  frequency TEXT DEFAULT 'daily',
  difficulty_level INTEGER DEFAULT 2,
  xp_reward INTEGER DEFAULT 15,
  streak_bonus_xp INTEGER DEFAULT 5,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performance
CREATE INDEX idx_wiki_linked_item ON program_elements_wiki(linked_item_id);
CREATE INDEX idx_wiki_user ON program_elements_wiki(user_id);
CREATE INDEX idx_wiki_program ON program_elements_wiki(program_id);
CREATE INDEX idx_wiki_type ON program_elements_wiki(element_type);

-- Activer RLS
ALTER TABLE program_elements_wiki ENABLE ROW LEVEL SECURITY;

-- Politique : les utilisateurs gèrent leurs propres wikis
CREATE POLICY "Users can manage own wiki entries"
  ON program_elements_wiki
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger pour updated_at
CREATE TRIGGER wiki_updated_at_trigger
  BEFORE UPDATE ON program_elements_wiki
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();