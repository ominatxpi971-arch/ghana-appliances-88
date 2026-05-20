-- Supabase Schema for Ghana Appliances E-commerce

-- Categories table
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '''',
  category TEXT NOT NULL REFERENCES categories(slug),
  price_ghs NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  specs JSONB DEFAULT '''{}''',
  stock INT DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_city TEXT NOT NULL DEFAULT '''',
  customer_address TEXT NOT NULL,
  status TEXT DEFAULT ''pending'' CHECK (status IN (''pending'',''confirmed'',''shipping'',''delivered'',''cancelled'')),
  total_ghs NUMERIC(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL
);

-- Site settings table (single row)
CREATE TABLE site_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  site_name TEXT DEFAULT ''Ghana Appliances'',
  site_description TEXT DEFAULT ''Quality Electrical Appliances in Ghana'',
  phone TEXT DEFAULT '''',
  whatsapp TEXT DEFAULT '''',
  email TEXT DEFAULT '''',
  address TEXT DEFAULT '''',
  logo_url TEXT DEFAULT '''',
  currency TEXT DEFAULT ''GHS'',
  cod_label TEXT DEFAULT ''Cash on Delivery''
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Public read access for products and categories
CREATE POLICY products_public_read ON products FOR SELECT USING (active = true);
CREATE POLICY categories_public_read ON categories FOR SELECT USING (true);

-- Anyone can create orders
CREATE POLICY orders_public_insert ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY order_items_public_insert ON order_items FOR INSERT WITH CHECK (true);

-- Admin full access (authenticated users)
CREATE POLICY products_admin_all ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY orders_admin_all ON orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY order_items_admin_all ON order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY categories_admin_all ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY settings_admin_all ON site_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY settings_public_read ON site_settings FOR SELECT USING (true);

-- Insert default settings row
INSERT INTO site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Insert default categories
INSERT INTO categories (name, slug, sort_order) VALUES
  (''Televisions'', ''televisions'', 1),
  (''Air Conditioners'', ''air-conditioners'', 2),
  (''Refrigerators'', ''refrigerators'', 3),
  (''Washing Machines'', ''washing-machines'', 4),
  (''Small Appliances'', ''small-appliances'', 5)
ON CONFLICT (slug) DO NOTHING;
