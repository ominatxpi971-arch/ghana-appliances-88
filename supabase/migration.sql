-- ============================================
-- Ghana Appliances — Supabase Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Products
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  category TEXT NOT NULL,
  price_ghs NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  specs JSONB DEFAULT '{}',
  stock INT DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Orders
CREATE TABLE IF NOT EXISTS orders (
  id BIGINT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT DEFAULT '',
  customer_city TEXT DEFAULT '',
  customer_address TEXT NOT NULL,
  customer_region TEXT DEFAULT '',
  customer_deliveryTime TEXT DEFAULT 'any',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','shipping','delivered','cancelled')),
  subtotal_ghs NUMERIC(10,2) DEFAULT 0,
  discount_ghs NUMERIC(10,2) DEFAULT 0,
  delivery_fee NUMERIC(10,2) DEFAULT 0,
  total_ghs NUMERIC(10,2) NOT NULL,
  coupon_code TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL
);

-- 5. Site Settings (single row)
CREATE TABLE IF NOT EXISTS site_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  site_name TEXT DEFAULT 'Ghana Appliances',
  site_description TEXT DEFAULT 'Quality Electrical Appliances in Ghana',
  phone TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  currency TEXT DEFAULT 'GHS',
  cod_label TEXT DEFAULT 'Cash on Delivery',
  hero_title TEXT DEFAULT 'Quality Electrical Appliances Delivered to Your Door',
  hero_subtitle TEXT DEFAULT '',
  hero_badge TEXT DEFAULT '⚡ COD Available Nationwide',
  seo_title TEXT DEFAULT '',
  seo_description TEXT DEFAULT '',
  seo_keywords TEXT DEFAULT '',
  meta_pixel_id TEXT DEFAULT '',
  google_analytics_id TEXT DEFAULT '',
  resend_api_key TEXT DEFAULT '',
  footer_about TEXT DEFAULT '',
  footer_cod_text TEXT DEFAULT 'COD available nationwide.'
);

-- 6. Coupons
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount NUMERIC(10,2) NOT NULL,
  type TEXT DEFAULT 'fixed' CHECK (type IN ('percent','fixed')),
  min_order NUMERIC(10,2) DEFAULT 0,
  max_uses INT DEFAULT 0,
  used INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Public can read active products, categories, settings
CREATE POLICY products_public_read ON products FOR SELECT USING (active = true);
CREATE POLICY categories_public_read ON categories FOR SELECT USING (true);
CREATE POLICY settings_public_read ON site_settings FOR SELECT USING (true);

-- Anyone can create orders (COD, no payment)
CREATE POLICY orders_public_insert ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY order_items_public_insert ON order_items FOR INSERT WITH CHECK (true);

-- Authenticated (service_role) has full access to everything
-- No need for explicit policies, service_role bypasses RLS

-- ============================================
-- Seed Data
-- ============================================
INSERT INTO site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (name, slug, sort_order) VALUES
  ('Televisions', 'televisions', 1),
  ('Air Conditioners', 'air-conditioners', 2),
  ('Refrigerators', 'refrigerators', 3),
  ('Washing Machines', 'washing-machines', 4),
  ('Small Appliances', 'small-appliances', 5)
ON CONFLICT (slug) DO NOTHING;