-- ============================================
-- Ghana Appliances â€?Migration v2
-- IP Tracking, Visitor Analytics, Customer Auth
-- ============================================

-- Add IP to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_ip TEXT DEFAULT '';

-- Visitor analytics log
CREATE TABLE IF NOT EXISTS visitor_logs (
  id BIGSERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  country TEXT DEFAULT '',
  region TEXT DEFAULT '',
  city TEXT DEFAULT '',
  path TEXT NOT NULL,
  referrer TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  event_type TEXT DEFAULT 'pageview' CHECK (event_type IN ('pageview','click','add_to_cart','checkout','order','search','other')),
  event_label TEXT DEFAULT '',
  session_id TEXT DEFAULT '',
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast analytics queries
CREATE INDEX IF NOT EXISTS idx_visitor_logs_created ON visitor_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_ip ON visitor_logs(ip);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_event ON visitor_logs(event_type);

-- Customer profiles (extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS customer_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT DEFAULT '',
  last_name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  city TEXT DEFAULT '',
  region TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.customer_profiles (id, first_name, last_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'last_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS for customer_profiles
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_logs ENABLE ROW LEVEL SECURITY;

-- Customers can read/update their own profile
CREATE POLICY profiles_self_read ON customer_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_self_update ON customer_profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Public can insert visitor logs
CREATE POLICY visitor_logs_public_insert ON visitor_logs FOR INSERT WITH CHECK (true);
CREATE POLICY visitor_logs_admin_select ON visitor_logs FOR SELECT TO authenticated USING (true);
