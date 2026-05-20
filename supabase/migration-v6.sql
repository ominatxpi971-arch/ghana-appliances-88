-- Migration: Blog posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT DEFAULT '',
  content TEXT DEFAULT '',
  featured_image TEXT,
  category TEXT DEFAULT 'General',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  author TEXT DEFAULT 'Ghana Appliances',
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY posts_public_read ON posts FOR SELECT USING (published = true);
CREATE POLICY posts_admin_all ON posts FOR ALL TO authenticated USING (true) WITH CHECK (true);