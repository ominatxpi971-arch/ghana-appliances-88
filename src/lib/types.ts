
export interface ProductVariant {
  id: string
  product_id: string
  sku?: string
  name: string
  option1_name?: string
  option1_value?: string
  option2_name?: string
  option2_value?: string
  price_ghs: number
  stock: number
  image?: string
  sort_order: number
  active: boolean
  created_at?: string
}

export interface Product {
   id: string
   name: string
   slug: string
   description: string
   category: string
   price_ghs: number
   original_price: number | null
   images: string[]
   specs: Record<string, string>
   stock: number
   featured: boolean
   active: boolean
   created_at: string
  seo_title?: string
  seo_description?: string
  seo_keywords?: string
  variants?: ProductVariant[]
 }

export interface CartItem {
  product: Product
  variant_id?: string
  variant?: ProductVariant
  quantity: number
  variants?: ProductVariant[]
}

export interface Order {
  user_id?: string | null
  id: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  customer_city: string
  customer_address: string
  customer_region?: string
  customer_deliverytime?: string
  customer_ip?: string
  status: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled'
  subtotal_ghs?: number
  discount_ghs?: number
  delivery_fee?: number
  total_ghs: number
  coupon_code?: string
  tracking_number?: string
  tracking_url?: string
  notes: string | null
  created_at: string
  items: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  variant_id?: string
  variant_name?: string
  variant_sku?: string
  quantity: number
  unit_price: number
}

export interface SiteSettings {
  site_name?: string
  site_description?: string
  phone?: string
  whatsapp?: string
  email?: string
  address?: string
  logo_url?: string
  currency?: string
  cod_label?: string
  shipping_fees?: string
  hero_title?: string
  hero_subtitle?: string
  hero_badge?: string
  footer_about?: string
  footer_cod_text?: string
  hero1_badge?: string
  hero1_title?: string
  hero1_highlight?: string
  hero1_subtitle?: string
  hero1_cta?: string
  hero1_cta_link?: string
  hero1_bg?: string
  hero1_accent?: string
  hero1_icon?: string
  hero1_image?: string
  hero2_badge?: string
  hero2_title?: string
  hero2_highlight?: string
  hero2_subtitle?: string
  hero2_cta?: string
  hero2_cta_link?: string
  hero2_bg?: string
  hero2_accent?: string
  hero2_icon?: string
  hero2_image?: string
  hero3_badge?: string
  hero3_title?: string
  hero3_highlight?: string
  hero3_subtitle?: string
  hero3_cta?: string
  hero3_cta_link?: string
  hero3_bg?: string
  hero3_accent?: string
  hero3_icon?: string
  hero3_image?: string

// SEO fields
  seo_title?: string
  seo_description?: string
  seo_keywords?: string
  og_image_url?: string
  favicon_url?: string
  
  // Page-specific SEO
  about_title?: string
  about_description?: string
  about_keywords?: string
  contact_title?: string
  contact_description?: string
  contact_keywords?: string
  faq_title?: string
  faq_description?: string
  faq_keywords?: string
  privacy_title?: string
  privacy_description?: string
  privacy_keywords?: string
  returns_title?: string
  returns_description?: string
  returns_keywords?: string
  terms_title?: string
  terms_description?: string
  terms_keywords?: string
  
  // Business info
  admin_email?: string
  admin_password?: string
  resend_api_key?: string
  google_analytics_id?: string
  meta_pixel_id?: string
  tiktok_pixel_id?: string
  meta_pixel_access_token?: string
  
  // Social/contact
  facebook_url?: string
  instagram_url?: string
  twitter_url?: string
  youtube_url?: string
  
  // Analytics settings
  analytics_enabled?: boolean
  low_stock_threshold?: number
  ad_spend_data?: string
  cookie_consent_enabled?: boolean
}

export interface VisitorLog {
  id: number
  ip: string
  country: string
  region: string
  city: string
  path: string
  referrer: string
  user_agent: string
  event_type: string
  event_label: string
  session_id: string
  created_at: string
  source_category?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  fbclid?: string
  gclid?: string
  utm_params?: string
}

export interface CustomerProfile {
  id: string
  first_name: string
  last_name: string
  phone?: string
  address?: string
  city: string
  region: string
  postal_code: string
  created_at: string
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled'
export interface Post {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  featured_image: string | null
  category: string
  tags: string[]
  author: string
  published: boolean
  created_at: string
  updated_at: string
}
