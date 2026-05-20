"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Trash2, Plus, RotateCcw } from "lucide-react"

interface Settings {
  site_name: string; site_description: string; phone: string; whatsapp: string
  email: string; address: string; logo_url: string; currency: string; cod_label: string
  hero_title: string; hero_subtitle: string; hero_badge: string
  seo_title: string; seo_description: string; seo_keywords: string
  meta_pixel_id: string; meta_pixel_access_token: string; google_analytics_id: string; resend_api_key: string
  footer_about: string; footer_cod_text: string
  admin_password: string
  // Hero slide fields
  hero1_badge: string; hero1_title: string; hero1_highlight: string; hero1_subtitle: string
  hero1_cta: string; hero1_cta_link: string; hero1_bg: string; hero1_accent: string
  hero1_icon: string; hero1_image: string
  hero2_badge: string; hero2_title: string; hero2_highlight: string; hero2_subtitle: string
  hero2_cta: string; hero2_cta_link: string; hero2_bg: string; hero2_accent: string
  hero2_icon: string; hero2_image: string
  hero3_badge: string; hero3_title: string; hero3_highlight: string; hero3_subtitle: string
  hero3_cta: string; hero3_cta_link: string; hero3_bg: string; hero3_accent: string
  hero3_icon: string; hero3_image: string
  // Shipping fee fields
  shipping_fees: string
  // Ad spend data
  ad_spend_data: string
  // Low stock threshold
  low_stock_threshold: string
  // Social & media fields
  facebook_url: string; instagram_url: string; twitter_url: string; youtube_url: string
  favicon_url: string; og_image_url: string
}

const DEFAULTS: any = {
  site_name: "Ghana Appliances", site_description: "Quality Electrical Appliances in Ghana",
  phone: "+233501234567", whatsapp: "+233501234567",
  email: "info@ghanaappliance.cc", address: "Accra, Ghana",
  logo_url: "", currency: "GHS", cod_label: "Cash on Delivery",
  hero_title: "Quality Electrical Appliances Delivered to Your Door",
  hero_subtitle: "TVs, air conditioners, refrigerators, washing machines and more. Order now and pay cash on delivery anywhere in Ghana.",
  hero_badge: "COD Available Nationwide",
  seo_title: "Ghana Appliances - Quality Electrical Appliances | COD",
  seo_description: "Buy TVs, air conditioners, refrigerators, washing machines and more in Ghana. Cash on delivery available nationwide.",
  seo_keywords: "electrical appliances ghana, buy tv accra, air conditioner ghana, refrigerator ghana, cod appliances",
  meta_pixel_id: "", meta_pixel_access_token: "", google_analytics_id: "", resend_api_key: "",
  footer_about: "Quality electrical appliances delivered to your doorstep. Pay cash on delivery.",
  footer_cod_text: "",
  admin_password: "",
  hero1_badge: "🔥 New Arrivals", hero1_title: "Premium Home Appliances", hero1_highlight: "Delivered Across Ghana",
  hero1_subtitle: "Shop the latest TVs, ACs, Refrigerators & more.", hero1_cta: "Shop Now", hero1_cta_link: "/products",
  hero1_bg: "from-gray-900 via-gray-800 to-amber-900", hero1_accent: "amber", hero1_icon: "🏠", hero1_image: "",
  hero2_badge: "💰 Best Deals", hero2_title: "Up to 30% Off", hero2_highlight: "Selected Appliances",
  hero2_subtitle: "Limited-time offers on top brands.", hero2_cta: "View Deals", hero2_cta_link: "/products",
  hero2_bg: "from-amber-900 via-orange-800 to-red-900", hero2_accent: "orange", hero2_icon: "🏷️", hero2_image: "",
  hero3_badge: "🚚 Free Delivery", hero3_title: "Free Delivery in", hero3_highlight: "Greater Accra",
  hero3_subtitle: "Order today and get free delivery within Greater Accra.", hero3_cta: "Order Now", hero3_cta_link: "/products",
  hero3_bg: "from-green-900 via-emerald-800 to-teal-900", hero3_accent: "emerald", hero3_icon: "📦", hero3_image: "",
  ad_spend_data: JSON.stringify({ "Facebook": 0, "Google": 0, "TikTok": 0 }),
  shipping_fees: JSON.stringify({ "Greater Accra": 0, "Ashanti": 50, "Western": 80, "Central": 70, "Eastern": 60, "Volta": 90, "Northern": 120, "Upper East": 150, "Upper West": 150, "Bono": 100, "Bono East": 100, "Ahafo": 100, "Western North": 90, "Oti": 100, "Savannah": 120, "North East": 130 }),
  low_stock_threshold: "5",
  facebook_url: "", instagram_url: "", twitter_url: "", youtube_url: "",
  favicon_url: "", og_image_url: "",
}

function parseShippingRegions(raw: any): { region: string; fee: string }[] {
  try {
    const obj = typeof raw === "string" ? JSON.parse(raw || "{}") : (raw && typeof raw === "object" ? raw : {})
    return Object.entries(obj).map(([region, fee]) => ({ region, fee: String(fee) }))
  } catch { return [] }
}

function serialiseShippingRegions(rows: { region: string; fee: string }[]): string {
  const obj: Record<string, number> = {}
  for (const r of rows) {
    if (r.region.trim()) obj[r.region.trim()] = Number(r.fee) || 0
  }
  return JSON.stringify(obj)
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<any>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings")
      const data = await res.json()
      setSettings({ ...DEFAULTS, ...data })
    } catch { /* use defaults */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) }); const saved = await res.json(); if (!res.ok) { throw new Error(saved.error || `Save failed (HTTP ${res.status})`) } if (saved._skipped?.length) { console.warn("Skipped columns:", saved._skipped) }
      
      setSettings({ ...DEFAULTS, ...saved }); toast.success("Settings saved successfully!")
    } catch (e: any) { toast.error(e?.message || "Failed to save settings") }
    finally { setSaving(false) }
  }

  const handleReset = () => {
    setSettings({ ...DEFAULTS })
    setConfirmReset(false)
    toast.success("Settings reset to defaults. Click Save to persist.")
  }

  const set = (k: string, v: string) => setSettings((s: any) => ({ ...s, [k]: v }))

  // Shipping regions as editable array
  const shippingRows = parseShippingRegions(settings.shipping_fees || "")
  const updateShippingRow = (idx: number, field: "region" | "fee", value: string) => {
    const rows = [...shippingRows]
    rows[idx] = { ...rows[idx], [field]: value }
    set("shipping_fees", serialiseShippingRegions(rows))
  }
  const addShippingRow = () => {
    const rows = [...shippingRows, { region: "", fee: "0" }]
    set("shipping_fees", serialiseShippingRegions(rows))
  }
  const removeShippingRow = (idx: number) => {
    const rows = shippingRows.filter((_, i) => i !== idx)
    set("shipping_fees", serialiseShippingRegions(rows))
  }

  if (loading) return <div className="py-20 text-center text-gray-400">Loading settings...</div>

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Site Settings</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmReset(true)}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
            {saving ? "Saving..." : "Save All Settings"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="mb-6 flex flex-wrap">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="homepage">Homepage</TabsTrigger>
          <TabsTrigger value="hero">Hero Slides</TabsTrigger>
          <TabsTrigger value="shipping">Shipping Fees</TabsTrigger>
          <TabsTrigger value="social">Social & Media</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="email">Email & Tracking</TabsTrigger>
          <TabsTrigger value="pages">Page Meta</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="bg-white border rounded-xl p-6 space-y-4">
          <div className="space-y-1.5"><Label>Site Name</Label><Input value={settings.site_name || ""} onChange={e => set("site_name", e.target.value)} placeholder="e.g. Ghana Appliances" /><p className="text-xs text-gray-400">Displayed in the browser tab and across the site header.</p></div>
          <div className="space-y-1.5"><Label>Site Description</Label><Textarea value={settings.site_description || ""} onChange={e => set("site_description", e.target.value)} placeholder="Short tagline describing your store" /><p className="text-xs text-gray-400">Used in meta tags and site footer.</p></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Phone</Label><Input value={settings.phone || ""} onChange={e => set("phone", e.target.value)} placeholder="+233 50 123 4567" /></div>
            <div className="space-y-1.5"><Label>WhatsApp</Label><Input value={settings.whatsapp || ""} onChange={e => set("whatsapp", e.target.value)} placeholder="+233 50 123 4567" /></div>
          </div>
          <div className="space-y-1.5"><Label>Email</Label><Input value={settings.email || ""} onChange={e => set("email", e.target.value)} placeholder="info@yourstore.com" /></div>
          <div className="space-y-1.5"><Label>Address</Label><Input value={settings.address || ""} onChange={e => set("address", e.target.value)} placeholder="Accra, Ghana" /></div>
          <div className="space-y-1.5"><Label>COD Label</Label><Input value={settings.cod_label || ""} onChange={e => set("cod_label", e.target.value)} placeholder="Cash on Delivery" /><p className="text-xs text-gray-400">Label shown on product cards and checkout.</p></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Logo URL</Label><Input value={settings.logo_url || ""} onChange={e => set("logo_url", e.target.value)} placeholder="https://..." /><p className="text-xs text-gray-400">Full URL to your site logo image.</p></div>
            <div className="space-y-1.5"><Label>Currency</Label><Input value={settings.currency || ""} onChange={e => set("currency", e.target.value)} placeholder="GHS" /><p className="text-xs text-gray-400">Currency code displayed with prices.</p></div>
          </div>
          <div className="space-y-1.5"><Label>Footer About Text</Label><Textarea value={settings.footer_about || ""} onChange={e => set("footer_about", e.target.value)} rows={2} placeholder="Brief about text shown in site footer" /></div>
        
          <div className="space-y-1.5">
            <Label>Ad Spend Data (JSON)</Label>
            <Textarea value={settings.ad_spend_data || ""} onChange={e => set("ad_spend_data", e.target.value)} rows={6} placeholder='{"Facebook": 500, "Google": 300, "TikTok": 200}' />
            <p className="text-xs text-gray-400">JSON object with platform names as keys and total spend amounts as values. Used for ROAS calculation on the Campaigns dashboard.</p>
          </div>
        </TabsContent>

        <TabsContent value="homepage" className="bg-white border rounded-xl p-6 space-y-4">
          <div className="space-y-1.5"><Label>Hero Badge Text</Label><Input value={settings.hero_badge || ""} onChange={e => set("hero_badge", e.target.value)} placeholder="e.g. COD Available Nationwide" /><p className="text-xs text-gray-400">Small badge shown at the top of the homepage hero.</p></div>
          <div className="space-y-1.5"><Label>Hero Title</Label><Textarea value={settings.hero_title || ""} onChange={e => set("hero_title", e.target.value)} rows={2} placeholder="Main headline on the homepage" /><p className="text-xs text-gray-400">Primary heading displayed on the homepage hero section.</p></div>
          <div className="space-y-1.5"><Label>Hero Subtitle</Label><Textarea value={settings.hero_subtitle || ""} onChange={e => set("hero_subtitle", e.target.value)} rows={3} placeholder="Supporting text below the hero title" /><p className="text-xs text-gray-400">Secondary text shown below the hero title.</p></div>
          <div className="space-y-1.5"><Label>COD Notice Text</Label><Input value={settings.footer_cod_text || ""} onChange={e => set("footer_cod_text", e.target.value)} placeholder="e.g. Pay cash when you receive your order" /><p className="text-xs text-gray-400">Shown in the footer and checkout to reassure customers.</p></div>
          <div className="space-y-1.5"><Label>Low Stock Threshold</Label><Input value={settings.low_stock_threshold || "5"} onChange={e => set("low_stock_threshold", e.target.value)} type="number" placeholder="5" /><p className="text-xs text-gray-400">Products with stock at or below this number will show a low-stock alert in the admin dashboard.</p></div>
        </TabsContent>

        <TabsContent value="shipping" className="bg-white border rounded-xl p-6 space-y-4">
          <p className="text-sm text-gray-500">Define delivery fees per region in Ghana. Fees are in GHS.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">Region Name</th>
                  <th className="pb-2 font-medium">Fee (GHS)</th>
                  <th className="pb-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {shippingRows.map((row, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="py-2 pr-2">
                      <Input
                        value={row.region}
                        onChange={e => updateShippingRow(idx, "region", e.target.value)}
                        placeholder="e.g. Greater Accra"
                        className="h-9"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <Input
                        value={row.fee}
                        onChange={e => updateShippingRow(idx, "fee", e.target.value)}
                        type="number"
                        placeholder="0"
                        className="h-9 w-28"
                      />
                    </td>
                    <td className="py-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => removeShippingRow(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {shippingRows.length === 0 && (
                  <tr><td colSpan={3} className="py-6 text-center text-gray-400">No regions defined. Click "Add Region" to start.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={addShippingRow}
            className="text-amber-600 border-amber-300 hover:bg-amber-50"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Region
          </Button>
        </TabsContent>

        <TabsContent value="social" className="bg-white border rounded-xl p-6 space-y-4">
          <p className="text-sm text-gray-500">Configure social media links, favicon, and Open Graph image for sharing.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Facebook URL</Label>
              <Input value={settings.facebook_url || ""} onChange={e => set("facebook_url", e.target.value)} placeholder="https://facebook.com/yourpage" />
              <p className="text-xs text-gray-400">Link to your Facebook business page.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Instagram URL</Label>
              <Input value={settings.instagram_url || ""} onChange={e => set("instagram_url", e.target.value)} placeholder="https://instagram.com/yourhandle" />
              <p className="text-xs text-gray-400">Link to your Instagram profile.</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Twitter / X URL</Label>
              <Input value={settings.twitter_url || ""} onChange={e => set("twitter_url", e.target.value)} placeholder="https://x.com/yourhandle" />
              <p className="text-xs text-gray-400">Link to your Twitter/X profile.</p>
            </div>
            <div className="space-y-1.5">
              <Label>YouTube URL</Label>
              <Input value={settings.youtube_url || ""} onChange={e => set("youtube_url", e.target.value)} placeholder="https://youtube.com/@yourchannel" />
              <p className="text-xs text-gray-400">Link to your YouTube channel.</p>
            </div>
          </div>
          <div className="border-t pt-4 mt-2">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Favicon URL</Label>
                <Input value={settings.favicon_url || ""} onChange={e => set("favicon_url", e.target.value)} placeholder="https://.../favicon.ico" />
                <p className="text-xs text-gray-400">Browser tab icon (16x16 or 32x32 .ico/.png).</p>
              </div>
              <div className="space-y-1.5">
                <Label>OG Image URL</Label>
                <Input value={settings.og_image_url || ""} onChange={e => set("og_image_url", e.target.value)} placeholder="https://.../og-image.jpg" />
                <p className="text-xs text-gray-400">Open Graph image shown when sharing links (1200x630 recommended).</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="hero" className="space-y-6">
          {[1, 2, 3].map(n => {
            const prefix = `hero${n}`
            return (
              <div key={n} className="bg-white border rounded-xl p-6 space-y-4">
                <h3 className="font-semibold text-amber-700">Hero Slide {n}</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Badge</Label><Input value={settings[`${prefix}_badge`] || ""} onChange={e => set(`${prefix}_badge`, e.target.value)} placeholder="e.g. 馃敟 New Arrivals" /></div>
                  <div className="space-y-1.5"><Label>Icon (emoji)</Label><Input value={settings[`${prefix}_icon`] || ""} onChange={e => set(`${prefix}_icon`, e.target.value)} placeholder="e.g. 馃彔" /></div>
                </div>
                <div className="space-y-1.5"><Label>Title</Label><Input value={settings[`${prefix}_title`] || ""} onChange={e => set(`${prefix}_title`, e.target.value)} placeholder="Slide heading" /></div>
                <div className="space-y-1.5"><Label>Highlight</Label><Input value={settings[`${prefix}_highlight`] || ""} onChange={e => set(`${prefix}_highlight`, e.target.value)} placeholder="Highlighted phrase" /></div>
                <div className="space-y-1.5"><Label>Subtitle</Label><Textarea value={settings[`${prefix}_subtitle`] || ""} onChange={e => set(`${prefix}_subtitle`, e.target.value)} rows={2} placeholder="Supporting description" /></div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>CTA Button Text</Label><Input value={settings[`${prefix}_cta`] || ""} onChange={e => set(`${prefix}_cta`, e.target.value)} placeholder="e.g. Shop Now" /></div>
                  <div className="space-y-1.5"><Label>CTA Link</Label><Input value={settings[`${prefix}_cta_link`] || ""} onChange={e => set(`${prefix}_cta_link`, e.target.value)} placeholder="e.g. /products" /></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Background Gradient</Label><Input value={settings[`${prefix}_bg`] || ""} onChange={e => set(`${prefix}_bg`, e.target.value)} placeholder="from-gray-900 via-gray-800 to-amber-900" /></div>
                  <div className="space-y-1.5"><Label>Accent Color</Label><Input value={settings[`${prefix}_accent`] || ""} onChange={e => set(`${prefix}_accent`, e.target.value)} placeholder="amber" /></div>
                </div>
                <div className="space-y-1.5"><Label>Background Image URL</Label><Input value={settings[`${prefix}_image`] || ""} onChange={e => set(`${prefix}_image`, e.target.value)} placeholder="https://..." /><p className="text-xs text-gray-400">Optional. An image URL to use as a background overlay for this slide.</p></div>
              </div>
            )
          })}
        </TabsContent>

        <TabsContent value="seo" className="bg-white border rounded-xl p-6 space-y-4">
          <div className="space-y-1.5"><Label>SEO Title (shown in browser tab)</Label><Input value={settings.seo_title || ""} onChange={e => set("seo_title", e.target.value)} placeholder="Ghana Appliances - Quality Electrical Appliances | COD" /><p className="text-xs text-gray-400">Appears in browser tabs and search engine results.</p></div>
          <div className="space-y-1.5"><Label>SEO Description (shown in Google results)</Label><Textarea value={settings.seo_description || ""} onChange={e => set("seo_description", e.target.value)} rows={2} placeholder="Buy TVs, air conditioners, refrigerators and more..." /><p className="text-xs text-gray-400">Meta description shown below the title in search results (150-160 chars recommended).</p></div>
          <div className="space-y-1.5"><Label>Keywords (comma separated)</Label><Input value={settings.seo_keywords || ""} onChange={e => set("seo_keywords", e.target.value)} placeholder="electrical appliances ghana, buy tv accra, ..." /><p className="text-xs text-gray-400">Comma-separated list of SEO keywords.</p></div>
        </TabsContent>

        <TabsContent value="email" className="bg-white border rounded-xl p-6 space-y-4">
          <div className="space-y-1.5">
            <Label>Resend API Key</Label>
            <Input value={settings.resend_api_key || ""} onChange={e => set("resend_api_key", e.target.value)} placeholder="re_..." type="password" />
            <p className="text-xs text-gray-400">Get your free key at <a href="https://resend.com" target="_blank" className="text-amber-600 underline">resend.com</a> (100 emails/day free). Used for order confirmations and contact form.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Meta Pixel ID</Label>
            <Input value={settings.meta_pixel_id || ""} onChange={e => set("meta_pixel_id", e.target.value)} placeholder="e.g. 123456789012345" />
            <p className="text-xs text-gray-400">Facebook Pixel ID for tracking. Events: PageView, ViewContent, AddToCart, InitiateCheckout, Purchase.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Google Analytics ID</Label>
            <Input value={settings.google_analytics_id || ""} onChange={e => set("google_analytics_id", e.target.value)} placeholder="e.g. G-XXXXXXXXXX" />
            <p className="text-xs text-gray-400">Google Analytics 4 Measurement ID.</p>
          </div>
        </TabsContent>

        <TabsContent value="pages" className="bg-white border rounded-xl p-6 space-y-4">
          <p className="text-sm text-gray-500 mb-2">Customize title, description, and keywords for each static page. Leave empty to use defaults.</p>
          {[
            { key: "about", label: "About Us" },
            { key: "contact", label: "Contact" },
            { key: "faq", label: "FAQ" },
            { key: "returns", label: "Returns Policy" },
            { key: "privacy", label: "Privacy Policy" },
            { key: "terms", label: "Terms & Conditions" },
          ].map(page => (
            <div key={page.key} className="border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-amber-700">{page.label} Page</h3>
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input value={settings[`${page.key}_title`] || ""} onChange={e => set(`${page.key}_title`, e.target.value)} placeholder={`${page.label} | Ghana Appliances`} />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea rows={2} value={settings[`${page.key}_description`] || ""} onChange={e => set(`${page.key}_description`, e.target.value)} placeholder={`Meta description for the ${page.label} page`} />
              </div>
              <div className="space-y-1.5">
                <Label>Keywords</Label>
                <Input value={settings[`${page.key}_keywords`] || ""} onChange={e => set(`${page.key}_keywords`, e.target.value)} placeholder={`Keywords for ${page.label} page`} />
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="security" className="bg-white border rounded-xl p-6 space-y-4">
          <div className="space-y-1.5">
            <Label>Admin Password</Label>
            <Input value={settings.admin_password || ""} onChange={e => set("admin_password", e.target.value)} type="password" placeholder="Enter new admin password" />
            <p className="text-xs text-gray-400">Set a new admin login password. Leave empty to keep the current password. This updates the ADMIN_PASSWORD server variable via the database.</p>
          </div>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset All Settings?"
        description="This will replace all settings with their default values. You must click Save to persist the changes. This cannot be undone."
        confirmLabel="Reset to Defaults"
        variant="destructive"
        onConfirm={handleReset}
      />
    </div>
  )
}