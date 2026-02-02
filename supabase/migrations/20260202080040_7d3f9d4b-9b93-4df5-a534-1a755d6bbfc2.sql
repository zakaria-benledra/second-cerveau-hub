-- Create interests catalog table
CREATE TABLE IF NOT EXISTS public.interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_interests junction table
CREATE TABLE IF NOT EXISTS public.user_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interest_id UUID NOT NULL REFERENCES public.interests(id) ON DELETE CASCADE,
  intensity INTEGER DEFAULT 50 CHECK (intensity >= 0 AND intensity <= 100),
  workspace_id UUID REFERENCES public.workspaces(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, interest_id)
);

-- Enable RLS
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;

-- RLS policies for interests (public read)
CREATE POLICY "Anyone can view interests" ON public.interests FOR SELECT USING (true);

-- RLS policies for user_interests
CREATE POLICY "Users view own interests" ON public.user_interests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own interests" ON public.user_interests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own interests" ON public.user_interests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own interests" ON public.user_interests FOR DELETE USING (auth.uid() = user_id);

-- Seed some default interests
INSERT INTO public.interests (name, category, keywords, icon) VALUES
  ('Lecture', 'culture', ARRAY['livres', 'romans', 'essais'], '📚'),
  ('Sport', 'santé', ARRAY['fitness', 'exercice', 'musculation'], '🏃'),
  ('Méditation', 'bien-être', ARRAY['mindfulness', 'relaxation', 'zen'], '🧘'),
  ('Cuisine', 'lifestyle', ARRAY['recettes', 'gastronomie', 'nutrition'], '🍳'),
  ('Musique', 'culture', ARRAY['instruments', 'concerts', 'écoute'], '🎵'),
  ('Voyage', 'lifestyle', ARRAY['découverte', 'aventure', 'exploration'], '✈️'),
  ('Technologie', 'professionnel', ARRAY['innovation', 'coding', 'gadgets'], '💻'),
  ('Nature', 'bien-être', ARRAY['randonnée', 'jardinage', 'plein air'], '🌿'),
  ('Art', 'culture', ARRAY['peinture', 'dessin', 'créativité'], '🎨'),
  ('Écriture', 'culture', ARRAY['journal', 'blog', 'créatif'], '✍️'),
  ('Yoga', 'santé', ARRAY['flexibilité', 'respiration', 'postures'], '🧘‍♀️'),
  ('Photographie', 'culture', ARRAY['photos', 'images', 'visuel'], '📷'),
  ('Jeux', 'divertissement', ARRAY['gaming', 'société', 'stratégie'], '🎮'),
  ('Finance', 'professionnel', ARRAY['investissement', 'épargne', 'budget'], '💰'),
  ('Langues', 'culture', ARRAY['apprentissage', 'communication', 'polyglotte'], '🗣️')
ON CONFLICT (name) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_interests_user ON public.user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_interests_category ON public.interests(category);