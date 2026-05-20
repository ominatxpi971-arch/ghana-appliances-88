-- Migration v9: Analytics enhancements
-- search_logs: on-site search tracking
-- Add source_category column to visitor_logs for channel classification

-- Search logs table
CREATE TABLE IF NOT EXISTS search_logs (
  id SERIAL PRIMARY KEY,
  query TEXT NOT NULL,
  results_count INT DEFAULT 0,
  session_id TEXT DEFAULT '',
  ip TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_logs_query ON search_logs(query);
CREATE INDEX IF NOT EXISTS idx_search_logs_created ON search_logs(created_at);

ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY search_logs_admin_all ON search_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY search_logs_public_insert ON search_logs FOR INSERT WITH CHECK (true);

-- Add source_category to visitor_logs for channel analysis
ALTER TABLE visitor_logs ADD COLUMN IF NOT EXISTS source_category TEXT DEFAULT '';
UPDATE visitor_logs SET source_category = 
  CASE 
    WHEN referrer = '' OR referrer IS NULL THEN 'direct'
    WHEN referrer LIKE '%google.%' OR referrer LIKE '%bing.%' OR referrer LIKE '%yahoo.%' OR referrer LIKE '%duckduckgo.%' THEN 'search'
    WHEN referrer LIKE '%facebook.%' OR referrer LIKE '%instagram.%' OR referrer LIKE '%twitter.%' OR referrer LIKE '%x.com%' OR referrer LIKE '%tiktok.%' OR referrer LIKE '%linkedin.%' OR referrer LIKE '%pinterest.%' OR referrer LIKE '%whatsapp.%' OR referrer LIKE '%reddit.%' OR referrer LIKE '%youtube.%' THEN 'social'
    ELSE 'referral'
  END
WHERE source_category IS NULL OR source_category = '';
