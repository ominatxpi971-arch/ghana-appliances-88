<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes ? APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in node_modules/next/dist/docs/ before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Ghana Appliances ? Project Status & TODO

## Quick Facts
- **Site**: https://ghanaappliance.cc (Vercel)
- **DB**: Supabase (project: henhsucxsfijzxzcbzrh)
- **Stack**: Next.js 16.2.6, React 19, Tailwind 4, Supabase, shadcn/ui
- **Admin password**: admin123 (hardcoded, see security issues below)
- **Admin login**: /admin/login ? /admin

## Current State (2026-05-15)
- Site is deployed and working on Vercel
- PG pooler is DOWN ? use Supabase REST API (JS client) for data operations, NOT pg Pool
- Migration v9 (search_logs + source_category) has been RUN manually in SQL Editor
- migrate/route.ts has v9 added but PG connections fail
- Analytics dashboard API gracefully handles missing tables

## Priority Tasks

### 1. SECURITY (urgent)
- [ ] **Move password out of client code** ? ADMIN_PASSWORD hardcoded in src/components/shop/admin-context.tsx
- [ ] **Fix localStorage bypass** ? setting "admin-logged-in":"true" in console bypasses login
- [ ] **Add auth to ALL admin API routes** ? products, orders, coupons, settings CRUD have zero auth

### 2. Frontend Improvements
- [ ] **Homepage Banner carousel** ? Hero area currently text-only, needs image upload + carousel
- [ ] **Product compare page** ? use-compare hook exists, /compare page missing
- [ ] **Out of stock badge** ? products with stock=0 need visual indicator
- [ ] **Category quick-nav on homepage** ? icon-based category grid
- [ ] **Product detail image thumbnails** ? gallery with thumbnail switcher

### 3. Admin Backend Improvements
- [ ] **Shipping fee config** ? 16 Ghana regions, currently hardcoded in orders/route.ts
- [ ] **Change password in Settings** ? currently requires code deploy
- [ ] **Bulk price edit** ? select products, apply % or fixed change
- [ ] **Low stock alerts** ? dashboard red highlight when stock < threshold

## Key Files
- Admin context/auth: src/components/shop/admin-context.tsx
- Admin layout: src/app/admin/layout.tsx
- API routes: src/app/api/*
- Database lib: src/lib/db.ts
- Types: src/lib/types.ts
- Analytics hook: src/hooks/use-analytics.ts
- Meta Pixel: src/lib/pixel.ts (ID: 1277873870983230 in DB)
- Tracking scripts: src/components/TrackingScripts.tsx
- Homepage client: src/app/HomePageClient.tsx

## DB Schema Notes
- visitor_logs: analytics events (has source_category column)
- search_logs: on-site search tracking (table exists, policies set)
- products: has SEO fields (seo_title, seo_description, seo_keywords)
- posts: blog posts
- orders + order_items: order management
- coupons: discount codes
- gsc_data: Google Search Console data
- site_settings: single-row settings table

## Environment
- .env.local has Supabase keys and DB password
- Supabase service_role key expires 2094
- PG pooler returns "Tenant or user not found" ? DO NOT waste time debugging PG connections, use supabase-js client
- npx blocked by PowerShell policy ? use "node node_modules/..." instead
- Vercel CLI authenticated as ominatxpi971-5730

---

## 馃敀 Completed Work (2026-05-16 ~ 2026-05-17)

### Performance Optimizations (2026-05-16)
- [x] **Hero images compressed**: hero-1.jpg(3.5MB) 鈫?hero-1.webp(56KB), hero-2.jpg(4.3MB) 鈫?hero-2.webp(193KB), hero-3.jpg(3.9MB) 鈫?hero-3.webp(144KB)
- [x] **next.config.ts**: Added image formats (WebP/AVIF), deviceSizes, imageSizes, minimumCacheTTL, compress, security headers (X-Frame-Options, X-XSS-Protection, Permissions-Policy), static asset Cache-Control immutable
- [x] **CLS fix**: Hero section changed to fixed height h-[420px] md:h-[520px] (was variable, caused layout shift during carousel rotation)
- [x] **Font loading**: Geist font display: 'swap' + system font fallbacks
- [x] **Preconnect**: Added for Supabase and Google Fonts in layout.tsx
- [x] **Image sizes**: Added responsive sizes attributes to ProductCard and Hero images
- [x] **globals.css**: Added content-visibility: auto for below-fold sections

### ISR Revalidation Fix (2026-05-17)
- [x] **Root cause**: Frontend pages had evalidate = 3600 but NO on-demand revalidation. Products created in admin wouldn't show for 1 hour.
- [x] **Added evalidatePath** to:
  - POST /api/products 鈫?revalidates / and /products
  - PUT /api/products/[id] 鈫?revalidates /, /products, /products/{slug}
  - DELETE /api/products/[id] 鈫?revalidates /, /products, /products/{slug}
  - POST /api/products/bulk-price 鈫?revalidates / and /products
- [x] **Removed deprecated config export** from pi/upload/route.ts

---

## 馃攧 Deep Audit Findings (2026-05-17)

### 馃毃 P0 - CRITICAL (must fix immediately)

| # | Issue | File:Line | Risk |
|---|-------|-----------|------|
| 1 | /api/debug exposes env info + service role key prefix | src/app/api/debug/route.ts | Info leak |
| 2 | /api/export-orders GET is fully public 鈫?downloads CSV with all customer PII (names, phones, emails, addresses, IPs) | src/app/api/export-orders/route.ts | Data breach |
| 3 | Default admin password dmin123 hardcoded | src/lib/auth.ts:7 | Account takeover |
| 4 | HMAC signing key is ghana-appliances-admin-auth-v2:admin123 鈫?predictable, brute-forceable | src/lib/auth.ts:6-8 | Token forgery |
| 5 | Homepage (/) has NO generateMetadata export 鈫?uses root layout fallback title for all missing pages | src/app/page.tsx | SEO |
| 6 | 8 pages have NO metadata: cart, checkout, track, compare, auth/login, auth/register, auth/account | respective page.tsx | SEO |

### 攳笍 P1 - HIGH

**Security:**
| # | Issue | File:Line |
|---|-------|-----------|
| 7 | Middleware allows ALL GET 鈫?if (method === 'GET') return next() 鈫?/api/gsc, /api/analytics/*, /api/coupons all public | src/middleware.ts:24 |
| 8 | No CSRF protection on admin POST/PUT/DELETE | src/middleware.ts |
| 9 | No rate limiting on /api/auth/login 鈫?brute-forceable | src/middleware.ts |
| 10 | /api/upload is in PUBLIC_POST_ROUTES 鈫?anyone can upload files | src/middleware.ts:11 |
| 11 | /api/profiles POST uses admin client with zero auth 鈫?anyone can modify user profiles | src/middleware.ts:10, pi/profiles/route.ts:48 |
| 12 | /api/test-email and /api/send-email are public 鈫?spam/phishing risk | src/middleware.ts:12-13 |
| 13 | Email HTML injection 鈫?4 email functions interpolate user data directly into HTML without escaping | src/lib/email.ts |
| 14 | Missing CSP header (Content-Security-Policy) | 
ext.config.ts |
| 15 | Missing HSTS header (Strict-Transport-Security) | 
ext.config.ts |
| 16 | No server-side file type validation on upload | src/app/api/upload/route.ts |

**Performance:**
| # | Issue | File:Line |
|---|-------|-----------|
| 17 | ProductCard N+1: each card fetches /api/reviews?productId=... independently (8 cards = 8 requests) | src/components/shop/product-card.tsx:24 |
| 18 | No 
ext/dynamic imports 鈫?recharts(500KB+) and admin pages bundled into main chunk | entire codebase |
| 19 | Zero Suspense boundaries 鈫?no streaming SSR | entire codebase |
| 20 | Cart page uses bare <img> tag instead of next/image | src/app/cart/page.tsx |

**UX:**
| # | Issue | File:Line |
|---|-------|-----------|
| 21 | 0 loading.tsx files 鈫?no skeleton/loading states | entire codebase |
| 22 | 0 error.tsx files (except AdminErrorBoundary) 鈫?pages crash to white screen | entire codebase |
| 23 | [object Object] bug in TrackingScripts pixel noscript | src/components/TrackingScripts.tsx:17 |

### 熅★笍 P2 - MEDIUM

| # | Category | Issue | File:Line |
|---|----------|-------|-----------|
| 24 | SEO | Sitemap missing /about, /contact pages | sitemap.xml/route.ts |
| 25 | SEO | 10 pages missing canonical URLs | various page.tsx |
| 26 | SEO | hreflang lost when pages set canonical (overrides root alternates) | various page.tsx |
| 27 | SEO | Root layout 	witter.images missing | layout.tsx |
| 28 | SEO | BreadcrumbSchema missing on /products, /blog, /about, /contact | various pages |
| 29 | Code | 46 ny type usages | throughout codebase |
| 30 | Code | console.error/log/warn in production code | email.ts, db.ts, pixel.ts |
| 31 | Code | TrackOrder page uses 3 sequential API calls (can parallelize) | pp/track/page.tsx |
| 32 | Code | No SiteSettings type 鈫?30+ settings: any casts | lib/types.ts |
| 33 | Security | Admin auth is client-side only 鈫?HTML skeleton exposed to everyone | dmin-context.tsx |
| 34 | Security | No token revocation 鈫?8hr valid tokens can't be invalidated | lib/auth.ts |
| 35 | UX | i18n system is a placeholder 鈫?7 translations, English only | lib/i18n.tsx |
| 36 | UX | Contact form has no rate limiting | pi/contact/route.ts |

### 熅笍 P3 - LOW

| # | Issue |
|---|-------|
| 37 | Middleware route matching uses O(n) or loop 鈫?use Set.has() for O(1) |
| 38 | Cookie name should use __Host- prefix for stronger integrity |
| 39 | robots.ts should also disallow /compare |
| 40 | "Ghana Appliances" hardcoded in 25+ places instead of settings.site_name |
| 41 | Password stored in both env var AND DB settings 鈫?dual source can desync |

---

## 馃敆 Fix Order Recommendation

1. **P0 Security**: Remove /api/debug, add auth to /api/export-orders, fix default password
2. **P0 SEO**: Add generateMetadata to homepage + 8 missing pages
3. **P1 Security**: Fix middleware GET bypass, add CSRF, rate limiting, remove public upload/email
4. **P1 Security**: Add CSP + HSTS headers
5. **P1 Performance**: Fix N+1 in ProductCard, add dynamic imports for recharts/admin
6. **P1 UX**: Add loading.tsx and error.tsx to key pages
7. **P2**: Create SiteSettings type, fix sitemap, add canonical/hreflang

---

## 猬愶笍 Key Architectural Notes

- **All DB access**: Uses supabase-js admin client (service_role key). RLS is **bypassed**. Do NOT waste time on PG pooler.
- **Admin auth**: HMAC-signed cookie dmin_auth_token, verified client-side via /api/auth/verify. No server-side page protection.
- **Cart**: Pure localStorage (ghana-appliances-cart key). No server-side cart. Cross-tab sync via cart-updated DOM event.
- **Orders**: COD only, no payment gateway. Stock decremented at order creation.
- **Images**: Products uploaded to Supabase Storage bucket products. Public URLs stored in products.images[].
- **Build**: Turbopack, Next.js 16.2.6. Only warning: middleware deprecation (rename to proxy.ts).
- **Deploy**: 
px vercel --yes --prod from project root. Avoid PowerShell for npm (use cmd).