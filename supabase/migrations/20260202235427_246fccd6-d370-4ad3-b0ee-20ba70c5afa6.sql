-- Ajouter les colonnes manquantes à gamification_challenges
ALTER TABLE public.gamification_challenges 
  ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '🎯',
  ADD COLUMN IF NOT EXISTS difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard', 'extreme')) DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS repeatable BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS cooldown_days INTEGER DEFAULT 0;

-- Défis par défaut
INSERT INTO public.gamification_challenges (title, description, challenge_type, target_type, target_value, xp_reward, icon, difficulty) VALUES
('Matinal Productif', 'Complète 3 habitudes avant midi', 'daily', 'habits', 3, 30, '🌅', 'easy'),
('Focus Master', '2 heures de focus sans interruption', 'daily', 'focus', 120, 40, '🎯', 'medium'),
('Journaliste', 'Écris une entrée journal', 'daily', 'journal', 1, 25, '📝', 'easy'),
('Tâches Éclair', 'Complète 5 tâches', 'daily', 'tasks', 5, 35, '⚡', 'medium'),
('Streak Guardian', 'Maintiens ton streak', 'daily', 'streak', 1, 20, '🔥', 'easy'),
('Semaine Parfaite', '100% des habitudes pendant 7 jours', 'weekly', 'habits', 7, 150, '💯', 'hard'),
('Conquérant', 'Complète 25 tâches', 'weekly', 'tasks', 25, 100, '🏆', 'medium'),
('Réflexion Profonde', '5 entrées journal', 'weekly', 'journal', 5, 75, '🧠', 'medium'),
('Score Champion', 'Maintiens un score >80%', 'weekly', 'score', 80, 120, '📈', 'hard'),
('Légende du Mois', '30 jours de streak', 'monthly', 'streak', 30, 500, '👑', 'extreme'),
('Centurion', '100 tâches complétées', 'monthly', 'tasks', 100, 300, '⚔️', 'hard'),
('Maître Zen', '20 entrées journal', 'monthly', 'journal', 20, 200, '🧘', 'medium')
ON CONFLICT DO NOTHING;