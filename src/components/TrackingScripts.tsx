import { SiteSettings } from "@/lib/types"
import { getSettings } from "@/lib/db"

export default async function TrackingScripts() {
  let settings: SiteSettings | null
  try { settings = await getSettings() } catch { return null }
  const pixelId = settings?.meta_pixel_id
  const gaId = settings?.google_analytics_id
  const tiktokId = settings?.tiktok_pixel_id

  return (
    <>
      {pixelId && (<>
        {/* Expose pixel ID for client-side components */}
        <script dangerouslySetInnerHTML={{ __html: `window.__META_PIXEL_ID="${pixelId}";` }} />
        {/* Meta Pixel base code */}
        <script dangerouslySetInnerHTML={{ __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");fbq("init","${pixelId}");fbq("track","PageView");` }} />
        <noscript><img height="1" width="1" style={{display:"none"}} src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`} alt="" /></noscript>
      </>)}
      {gaId && (<>
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
        <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","${gaId}");` }} />
      </>)}

      {tiktokId && (<>
        {/* TikTok Pixel base code */}
        <script dangerouslySetInnerHTML={{ __html: `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.sdkOptions&&n.sdkOptions.tiktokAnalyticsOptions||{};ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=o||{};o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(o,e)};ttq.load("${tiktokId}");ttq.page()}(window,document,"ttq");` }} />
      </>)}
    </>
  )
}
