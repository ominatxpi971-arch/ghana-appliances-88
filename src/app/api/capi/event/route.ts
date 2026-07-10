import { NextRequest, NextResponse } from "next/server";
import { getSettings } from "@/lib/db";
import { sendCapiAddToCart, sendCapiInitiateCheckout } from "@/lib/capi";

function getClientIP(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, email, phone, value, currency, contentIds, contentName, contents, numItems, fbp, fbc, eventSourceUrl } = body;

    if (!event || !["AddToCart", "InitiateCheckout"].includes(event)) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }

    const settings = await getSettings();
    if (!settings?.meta_pixel_id || !settings?.meta_pixel_access_token) {
      return NextResponse.json({ skipped: "No pixel config" }, { status: 200 });
    }

    const clientIP = getClientIP(request);
    const ua = request.headers.get("user-agent") || "";

    let result = false;
    if (event === "AddToCart") {
      result = await sendCapiAddToCart({
        pixelId: settings.meta_pixel_id,
        accessToken: settings.meta_pixel_access_token,
        eventSourceUrl: eventSourceUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/cart`,
        customerEmail: email,
        customerPhone: phone,
        clientIp: clientIP,
        clientUserAgent: ua,
        fbp,
        fbc,
        value,
        currency: currency || "GHS",
        contentIds,
        contentName,
        numItems,
      });
    } else if (event === "InitiateCheckout") {
      result = await sendCapiInitiateCheckout({
        pixelId: settings.meta_pixel_id,
        accessToken: settings.meta_pixel_access_token,
        eventSourceUrl: eventSourceUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/checkout`,
        customerEmail: email,
        customerPhone: phone,
        clientIp: clientIP,
        clientUserAgent: ua,
        fbp,
        fbc,
        value,
        currency: currency || "GHS",
        contentIds,
        contents,
        numItems,
      });
    }

    return NextResponse.json({ success: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
