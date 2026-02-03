-- Boutique de récompenses
CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  reward_type TEXT CHECK (reward_type IN ('theme', 'avatar', 'badge_style', 'title', 'feature')),
  xp_cost INTEGER NOT NULL,
  icon TEXT,
  preview_url TEXT,
  is_active BOOLEAN DEFAULT true,
  rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')) DEFAULT 'common',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Récompenses débloquées
CREATE TABLE IF NOT EXISTS public.user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id),
  reward_id UUID NOT NULL REFERENCES public.rewards(id),
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  is_equipped BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, reward_id)
);

-- RLS
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rewards visible to all authenticated" ON public.rewards 
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users manage own rewards" ON public.user_rewards 
  FOR ALL USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_rewards_user ON public.user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_type ON public.rewards(reward_type, is_active);

-- Récompenses par défaut
INSERT INTO public.rewards (name, description, reward_type, xp_cost, icon, rarity) VALUES
-- Thèmes
('Thème Midnight', 'Un thème sombre et élégant', 'theme', 500, '🌙', 'common'),
('Thème Forest', 'Un thème vert apaisant', 'theme', 500, '🌲', 'common'),
('Thème Ocean', 'Un thème bleu profond', 'theme', 750, '🌊', 'rare'),
('Thème Sunset', 'Un thème chaleureux', 'theme', 750, '🌅', 'rare'),
('Thème Galaxy', 'Un thème cosmique', 'theme', 1500, '🌌', 'epic'),
('Thème Golden', 'Le thème des champions', 'theme', 3000, '✨', 'legendary'),
-- Titres
('Débutant Motivé', 'Premier pas vers le succès', 'title', 100, '🌱', 'common'),
('Habitué', 'La constance est ta force', 'title', 300, '💪', 'common'),
('Productif', 'Tu gères tes tâches comme un pro', 'title', 500, '⚡', 'rare'),
('Maître du Temps', 'Le temps est ton allié', 'title', 1000, '⏰', 'rare'),
('Légende Vivante', 'Tu inspires les autres', 'title', 2500, '🏆', 'epic'),
('Être Transcendé', 'Au-delà de l''excellence', 'title', 5000, '👑', 'legendary')
ON CONFLICT DO NOTHING;