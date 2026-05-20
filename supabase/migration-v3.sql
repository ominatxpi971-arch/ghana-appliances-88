-- Ghana Appliances — Migration v3
-- Product Reviews System
-- Run this in Supabase SQL Editor: https://henhsucxsfijzxzcbzrh.supabase.co

CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public can read and create reviews
DROP POLICY IF EXISTS reviews_public_read ON reviews;
CREATE POLICY reviews_public_read ON reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS reviews_public_insert ON reviews;
CREATE POLICY reviews_public_insert ON reviews FOR INSERT WITH CHECK (true);

-- Seed some reviews for the new products
INSERT INTO reviews (product_id, customer_name, rating, comment) VALUES
  ((SELECT id FROM products WHERE slug = 'samsung-55-crystal-uhd-4k-smart-tv' LIMIT 1), 'Kojo A.', 5, 'Excellent TV! Crystal clear picture and the smart features work perfectly. Delivery was fast in Accra.'),
  ((SELECT id FROM products WHERE slug = 'samsung-55-crystal-uhd-4k-smart-tv' LIMIT 1), 'Ama S.', 4, 'Great value for money. The 4K quality is amazing. Only downside is the remote could be better.'),
  ((SELECT id FROM products WHERE slug = 'lg-65-oled-evo-c4-smart-tv' LIMIT 1), 'Kwesi B.', 5, 'The OLED picture is incredible. Best TV I have ever owned. Worth every cedi.'),
  ((SELECT id FROM products WHERE slug = 'lg-1-5hp-dual-inverter-split-ac' LIMIT 1), 'Efua M.', 5, 'Cools my living room in minutes. Very quiet and the electricity bill has actually gone down!'),
  ((SELECT id FROM products WHERE slug = 'samsung-450l-french-door-refrigerator' LIMIT 1), 'Yaw D.', 4, 'Spacious and keeps everything fresh. The French door design is very convenient.'),
  ((SELECT id FROM products WHERE slug = 'binatone-1-7l-electric-kettle' LIMIT 1), 'Akosua P.', 5, 'Boils water super fast. Great quality for the price. Using it daily for 3 months now.'),
  ((SELECT id FROM products WHERE slug = 'philips-1-8l-rice-cooker' LIMIT 1), 'Kofi T.', 5, 'Perfect rice every time! The keep-warm function is great for Ghanaian families.'),
  ((SELECT id FROM products WHERE slug = 'samsung-7kg-top-load-washing-machine' LIMIT 1), 'Adwoa N.', 4, 'Cleans clothes well and is easy to use. The wobble technology really works.')
ON CONFLICT DO NOTHING;
