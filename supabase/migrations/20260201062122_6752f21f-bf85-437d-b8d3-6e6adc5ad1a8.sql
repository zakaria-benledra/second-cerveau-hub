-- Table des événements analytics
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  session_id TEXT,
  event_name TEXT NOT NULL,
  event_category TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  page_path TEXT,
  referrer TEXT,
  user_agent TEXT,
  device_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour les requêtes rapides
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_workspace ON analytics_events(workspace_id);
CREATE INDEX idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_date ON analytics_events(created_at);
CREATE INDEX idx_analytics_events_category ON analytics_events(event_category);

-- RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert events" ON analytics_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own events" ON analytics_events
  FOR SELECT USING (auth.uid() = user_id);

-- Table pour les sessions
CREATE TABLE IF NOT EXISTS analytics_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  page_views INTEGER DEFAULT 0,
  events_count INTEGER DEFAULT 0,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  country TEXT
);

CREATE INDEX idx_analytics_sessions_user ON analytics_sessions(user_id);
CREATE INDEX idx_analytics_sessions_workspace ON analytics_sessions(workspace_id);
CREATE INDEX idx_analytics_sessions_date ON analytics_sessions(started_at);

ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert sessions" ON analytics_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update sessions" ON analytics_sessions
  FOR UPDATE USING (true);

CREATE POLICY "Users can view own sessions" ON analytics_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Vue pour les métriques agrégées
CREATE OR REPLACE VIEW analytics_daily_summary AS
SELECT 
  DATE(created_at) as date,
  event_category,
  event_name,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as unique_sessions
FROM analytics_events
GROUP BY DATE(created_at), event_category, event_name
ORDER BY date DESC, count DESC;

-- Vue pour la rétention utilisateur
CREATE OR REPLACE VIEW analytics_user_retention AS
SELECT 
  p.user_id,
  p.created_at as signup_date,
  DATE(p.created_at) as signup_day,
  MAX(CASE WHEN DATE(e.created_at) = DATE(p.created_at) THEN 1 ELSE 0 END) as day_0,
  MAX(CASE WHEN DATE(e.created_at) = DATE(p.created_at) + 1 THEN 1 ELSE 0 END) as day_1,
  MAX(CASE WHEN DATE(e.created_at) BETWEEN DATE(p.created_at) + 2 AND DATE(p.created_at) + 7 THEN 1 ELSE 0 END) as day_7,
  MAX(CASE WHEN DATE(e.created_at) BETWEEN DATE(p.created_at) + 8 AND DATE(p.created_at) + 30 THEN 1 ELSE 0 END) as day_30
FROM profiles p
LEFT JOIN analytics_events e ON e.user_id = p.user_id
GROUP BY p.user_id, p.created_at;