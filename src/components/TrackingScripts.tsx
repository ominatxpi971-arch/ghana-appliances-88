import { SiteSettings } from "@/lib/types"
import { getSettings } from "@/lib/db"

export default async function TrackingScripts() {
  let settings: SiteSettings | null
  try { settings = await getSettings() } catch { return null }
  const pixelId = settings?.meta_pixel_id
  const gaId = settings?.google_analytics_id

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
    </>
  )
}
