-- Add tiktok_pixel_id column to site_settings table
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS tiktok_pixel_id TEXT DEFAULT '';

-- Verify
SELECT id, meta_pixel_id, google_analytics_id, tiktok_pixel_id FROM site_settings WHERE id = 1;
