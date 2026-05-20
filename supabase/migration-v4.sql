-- ============================================
-- Ghana Appliances — Migration v4
-- Order Management Fix + Email/Settings columns
-- ============================================

-- Add missing columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_region TEXT DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_deliverytime TEXT DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal_ghs NUMERIC(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_ghs NUMERIC(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT DEFAULT NULL;

-- Add email & tracking columns to site_settings
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS resend_api_key TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS google_analytics_id TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_title TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_subtitle TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_badge TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS seo_title TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS seo_description TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS seo_keywords TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS footer_about TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS footer_cod_text TEXT DEFAULT '';

-- Contact messages table for website email system
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  subject TEXT DEFAULT '',
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS contact_messages_public_insert ON contact_messages;
CREATE POLICY contact_messages_public_insert ON contact_messages FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS contact_messages_admin_all ON contact_messages;
CREATE POLICY contact_messages_admin_all ON contact_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Update site_settings defaults
UPDATE site_settings SET resend_api_key = COALESCE(resend_api_key, ''), meta_pixel_id = COALESCE(meta_pixel_id, ''), google_analytics_id = COALESCE(google_analytics_id, '') WHERE id = 1;
