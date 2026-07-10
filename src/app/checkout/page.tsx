"use client"

import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import {
  ShoppingCart, ChevronLeft, Truck, ShieldCheck, CheckCircle,
  Phone, Mail, MapPin, Navigation, AlertCircle, Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/shop/auth-context";
import { useCartContext } from "@/components/shop/cart-context";
import { MetaPixel, TikTokPixel, generatePixelEventId } from "@/lib/pixel"
import { useAnalytics } from "@/hooks/use-analytics";
import { toast } from "sonner";

/** Effective unit price for a cart item (variant price if set, otherwise product price). */
function itemUnitPrice(item: ReturnType<typeof useCartContext>["items"][number]): number {
  if (item.variant?.price_ghs && item.variant.price_ghs > 0) return item.variant.price_ghs
  return item.product.price_ghs
}


import { getMetaCookie, sendCapiClientEvent, generateEventId } from "@/lib/capi-client";


export default function CheckoutPage() {
  const { trackEvent } = useAnalytics()
  const { items, total, itemCount, clearCart } = useCartContext();
  const { user } = useAuth();

  // --- All state hooks (MUST be before any early returns) ---
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", country: "Ghana",
    city: "", address: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const hasFiredCheckout = useRef(false);

  const deliveryFee = 0
  const finalTotal = total - couponDiscount + deliveryFee;

  // Track InitiateCheckout — fires once when valid cart data loads
  useEffect(() => {
    if (itemCount > 0 && finalTotal > 0 && !hasFiredCheckout.current) {
      hasFiredCheckout.current = true;
      const eventID = generateEventId("InitiateCheckout")
      trackEvent("checkout")
      try {
        MetaPixel.initiateCheckout({
          content_ids: items.map(i => i.product.id),
          contents: items.map(i => ({ id: i.product.id, quantity: i.quantity })),
          content_type: "product",
          num_items: itemCount,
          value: finalTotal,
          currency: "GHS",
          eventID,
        });
        sendCapiClientEvent("InitiateCheckout", {
          eventId: eventID,
          eventSourceUrl: typeof window !== "undefined" ? window.location.href : "",
          contentIds: items.map(i => i.product.id),
          contents: items.map(i => ({ id: i.product.id, quantity: i.quantity })),
          numItems: itemCount,
          value: finalTotal,
        });
        try {
          TikTokPixel.initiateCheckout({
            contents: items.map(i => ({ content_id: i.product.id, content_name: i.product.name, quantity: i.quantity, price: itemUnitPrice(i) })),
            value: finalTotal,
            currency: "GHS",
          });
        } catch (_) {} 
      } catch (_) {
        // silently ignore pixel errors
      }
    }
  }, [itemCount, finalTotal, items, couponDiscount]);



  // --- Helpers ---
  const setField = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => { const n = { ...e }; delete n[k]; return n; });
  };

  const applyCoupon = async () => {
    try {
      const res = await fetch("/api/coupons");
      const coupons = await res.json();
      const c = coupons.find((co: any) => co.code === couponCode.toUpperCase() && co.active);
      if (!c) { toast.error("Invalid coupon code"); return; }
      if (c.minOrder && total < c.minOrder) {
        toast.error("Minimum order: GH₵" + c.minOrder.toLocaleString());
        return;
      }
      const d = c.type === "percent" ? Math.round(total * c.discount / 100) : c.discount;
      setCouponDiscount(d);
      setCouponApplied(c.code);
      toast.success("Saved GH₵" + d.toLocaleString() + "!");
    } catch { toast.error("Failed to apply coupon"); }
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.country.trim()) e.country = "Required";
    if (!form.city.trim()) e.city = "Required";
    if (!form.address.trim()) e.address = "Required";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (submitting || success) return;
    e.preventDefault();
    if (!validate()) { toast.error("Please fill all required fields"); return; }

    setSubmitting(true);
    try {
      const fullName = form.firstName + " " + form.lastName;
      const addressParts = [
        form.address.trim()
      ];
      if (form.city.trim()) addressParts.push(form.city.trim());
      if (form.country.trim()) addressParts.push(form.country.trim());
      const fullAddress = addressParts.join(", ");

      const payload = {
        customer: {
          name: fullName,
          phone: form.phone,
          email: form.email || undefined,
          city: form.city,
          address: fullAddress,
          region: form.country,
          notes: undefined,
          deliveryTime: "any",
        },
        items: items.map(i => ({ productId: i.product.id, quantity: i.quantity, variantId: i.variant_id || undefined, variantName: i.variant?.name || undefined, variantSku: i.variant?.sku || undefined })),
        couponCode: couponApplied,
        fbp: getMetaCookie("_fbp"),
        fbc: getMetaCookie("_fbc"),
        userId: user?.id || null,
        eventSourceUrl: typeof window !== "undefined" ? window.location.href : "",
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Order failed");

      const data = await res.json();
      setOrderId(String(data.id));
      setSuccess(true);
      clearCart();

      // Meta Pixel - Purchase (use the server eventId for dedup)
      const purchaseEventID = data.eventId || generatePixelEventId("Purchase")
      try {
        MetaPixel.purchase({
          content_ids: items.map(i => i.product.id),
          contents: items.map(i => ({ id: i.product.id, quantity: i.quantity })),
          num_items: itemCount,
          value: finalTotal,
          currency: "GHS",
          order_id: String(data.id),
          eventID: purchaseEventID,
        });
        try {
          TikTokPixel.purchase({
            contents: items.map(i => ({ content_id: i.product.id, content_name: i.product.name, quantity: i.quantity, price: itemUnitPrice(i) })),
            value: finalTotal,
            currency: "GHS",
            order_id: String(data.id),
          });
        } catch (_) {} 
      } catch (_) {
        // silently ignore pixel errors
      }

      // Track conversion
      trackEvent("purchase", String(data.id))
    } catch {
      toast.error("Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Render: Success ---
  if (success) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-md">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Order Placed Successfully!</h1>
        <p className="text-gray-500 mb-2">Order #{orderId}</p>
        <p className="text-gray-500 mb-6">We will call you shortly to confirm your order.</p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
          <p className="font-semibold text-amber-900 text-sm mb-2 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" /> What happens next?
          </p>
          <ol className="text-xs text-amber-700 space-y-1 list-decimal list-inside">
            <li>We call to confirm your order</li>
            <li>We prepare your items</li>
            <li>Delivery to your address</li>
            <li>You inspect the items and pay cash</li>
          </ol>
        </div>
        <Link href="/" className="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 h-10 px-6">
          Back to Home
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-md">
        <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-gray-500 mb-6">Add some products before checking out.</p>
        <Link href="/products" className="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 h-10 px-4">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/cart" className="inline-flex items-center text-sm text-gray-500 hover:text-amber-600 mb-4">
        <ChevronLeft className="h-4 w-4 mr-1" /> Back to Cart
      </Link>
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-6 min-w-0">
        {/* Checkout Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <div className="bg-white border rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Phone className="h-5 w-5 text-amber-500" /> Personal Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>First Name *</Label>
                <Input placeholder="John" value={form.firstName}
                  onChange={e => setField("firstName", e.target.value)}
                  className={errors.firstName ? "border-red-500" : ""} />
                {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Last Name *</Label>
                <Input placeholder="Doe" value={form.lastName}
                  onChange={e => setField("lastName", e.target.value)}
                  className={errors.lastName ? "border-red-500" : ""} />
                {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Phone Number *</Label>
                <Input placeholder="+233 50 123 4567" value={form.phone}
                  onChange={e => setField("phone", e.target.value)}
                  className={errors.phone ? "border-red-500" : ""} />
                {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input placeholder="john@example.com" value={form.email}
                  onChange={e => setField("email", e.target.value)}
                  className={errors.email ? "border-red-500" : ""} />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-white border rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Navigation className="h-5 w-5 text-amber-500" /> Delivery Address
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Country *</Label>
                <Input value="Ghana" disabled />
              </div>
              <div className="space-y-1.5">
                <Label>City *</Label>
                <Input placeholder="Accra" value={form.city}
                  onChange={e => setField("city", e.target.value)}
                  className={errors.city ? "border-red-500" : ""} />
                {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Detailed Address *</Label>
              <Textarea placeholder="House No. 12, 5th Avenue, East Legon..." value={form.address}
                onChange={e => setField("address", e.target.value)} rows={3}
                className={errors.address ? "border-red-500" : ""} />
              {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
            </div>
          </div>

          {/* Coupon */}
          <div className="bg-white border rounded-xl p-4 space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-1">
              <Tag className="h-4 w-4" /> Coupon Code
            </h3>
            <div className="flex gap-2">
              <Input placeholder="Enter code" value={couponCode}
                onChange={e => setCouponCode(e.target.value)}
                disabled={!!couponApplied} />
              <Button type="button" variant="outline" onClick={applyCoupon}
                disabled={!!couponApplied}>
                {couponApplied ? couponApplied : "Apply"}
              </Button>
            </div>
            {couponApplied && (
              <p className="text-xs text-green-600">-{formatPrice(couponDiscount)} discount applied</p>
            )}
          </div>

          {/* COD Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <Truck className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-900">Cash on Delivery</p>
              <p className="text-sm text-amber-700">
                Pay {formatPrice(finalTotal)} when your order is delivered.
              </p>
            </div>
          </div>

          {/* Submit */}
          <Button type="submit" disabled={submitting}
            className="w-full bg-amber-500 hover:bg-amber-600" size="lg">
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Placing Order...
              </span>
            ) : (
              "Place Order - " + formatPrice(finalTotal)
            )}
          </Button>
        </form>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white border rounded-xl p-6 sticky top-24">
            <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
            <div className="space-y-3">
              {items.map(item => {
                const price = itemUnitPrice(item)
                return (
                <div key={`${item.product.id}-${item.variant_id || "no-variant"}`} className="flex justify-between text-sm">
                  <span className="truncate flex-1 mr-2">
                    {item.product.name}{item.variant ? ` (${item.variant.name})` : ""} x {item.quantity}
                  </span>
                  <span className="font-medium">
                    {formatPrice(price * item.quantity)}
                  </span>
                </div>
                )
              })}
            </div>
            <Separator className="my-3" />
            <div className="flex justify-between text-sm">
              <span>Subtotal</span><span>{formatPrice(total)}</span>
            </div>
            {couponApplied && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span><span>-{formatPrice(couponDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-500">
              <span>Delivery</span><span>{deliveryFee === 0 ? "Free" : formatPrice(deliveryFee)}</span>
            </div>
            <Separator className="my-3" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-amber-600">{formatPrice(finalTotal)}</span>
            </div>
            <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Secure COD order
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
            <h3 className="font-semibold text-blue-900 text-sm mb-2 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> What happens next?
            </h3>
            <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
              <li>We call to confirm your order</li>
              <li>We prepare your items</li>
              <li>Delivery to your address</li>
              <li>You inspect the items and pay cash</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}