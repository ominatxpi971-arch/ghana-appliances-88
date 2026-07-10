import { NextRequest, NextResponse } from "next/server";
import { getSettings } from "@/lib/db";
import { sendCapiAddToCart, sendCapiInitiateCheckout, sendCapiViewContent, sendCapiSearch, sendCapiContact } from "@/lib/capi";

function getClientIP(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown";
}

const VALID_EVENTS = ["AddToCart", "InitiateCheckout", "ViewContent", "Search", "Contact"] as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, email, phone, value, currency, contentIds, contentName, contentCategory, contents, numItems, fbp, fbc, eventSourceUrl, eventId, searchString } = body;

    if (!event || !VALID_EVENTS.includes(event)) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }

    const settings = await getSettings();
    if (!settings?.meta_pixel_id || !settings?.meta_pixel_access_token) {
      return NextResponse.json({ skipped: "No pixel config" }, { status: 200 });
    }

    const clientIP = getClientIP(request);
    const ua = request.headers.get("user-agent") || "";

    let result = false;
    switch (event) {
      case "AddToCart":
        result = await sendCapiAddToCart({
          pixelId: settings.meta_pixel_id,
          accessToken: settings.meta_pixel_access_token,
          eventId: eventId || `${event}_${Date.now()}`,
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
        break;
      case "InitiateCheckout":
        result = await sendCapiInitiateCheckout({
          pixelId: settings.meta_pixel_id,
          accessToken: settings.meta_pixel_access_token,
          eventId: eventId || `${event}_${Date.now()}`,
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
        break;
      case "ViewContent":
        result = await sendCapiViewContent({
          pixelId: settings.meta_pixel_id,
          accessToken: settings.meta_pixel_access_token,
          eventId: eventId || `${event}_${Date.now()}`,
          eventSourceUrl: eventSourceUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/products`,
          fbp,
          fbc,
          clientIp: clientIP,
          clientUserAgent: ua,
          contentIds,
          contentName,
          contentCategory,
          value,
          currency: currency || "GHS",
        });
        break;
      case "Search":
        result = await sendCapiSearch({
          pixelId: settings.meta_pixel_id,
          accessToken: settings.meta_pixel_access_token,
          eventId: eventId || `${event}_${Date.now()}`,
          eventSourceUrl: eventSourceUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/products`,
          fbp,
          fbc,
          clientIp: clientIP,
          clientUserAgent: ua,
          searchString,
        });
        break;
      case "Contact":
        result = await sendCapiContact({
          pixelId: settings.meta_pixel_id,
          accessToken: settings.meta_pixel_access_token,
          eventId: eventId || `${event}_${Date.now()}`,
          eventSourceUrl: eventSourceUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/contact`,
          customerEmail: email,
          customerPhone: phone,
          clientIp: clientIP,
          clientUserAgent: ua,
          fbp,
          fbc,
        });
        break;
    }

    return NextResponse.json({ success: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}