-- Migration: GSC search analytics data
CREATE TABLE IF NOT EXISTS gsc_data (
  id SERIAL PRIMARY KEY,
  query TEXT NOT NULL,
  clicks INT DEFAULT 0,
  impressions INT DEFAULT 0,
  ctr NUMERIC(5,2) DEFAULT 0,
  position NUMERIC(5,1) DEFAULT 0,
  country TEXT DEFAULT 'GHA',
  device TEXT DEFAULT 'ALL',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gsc_data_query ON gsc_data(query);
CREATE INDEX IF NOT EXISTS idx_gsc_data_date ON gsc_data(date);

ALTER TABLE gsc_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY gsc_data_admin_all ON gsc_data FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY gsc_data_public_none ON gsc_data FOR SELECT USING (false);