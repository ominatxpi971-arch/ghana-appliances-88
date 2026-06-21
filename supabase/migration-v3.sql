-- ============================================
-- Ghana Appliances ¡ª Migration v3
-- Remove postal_code from customer_profiles
-- ============================================

ALTER TABLE customer_profiles DROP COLUMN IF EXISTS postal_code;