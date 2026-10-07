import { CheckoutError, type OrderRequest } from "@/lib/cms/checkout-types";
import { MAX_ITEMS, MAX_QUANTITY, validSlug } from "./model";
export function validateOrderRequest(value: unknown): OrderRequest {
  if (!value || typeof value !== "object") throw new CheckoutError("INVALID_CHECKOUT", 400);
  const data = value as Record<string, unknown>, customer = data.customer as Record<string, unknown> | undefined;
  const field = (key: string, max: number) => { const value = customer?.[key]; if (typeof value !== "string" || !value.trim() || value.trim().length > max) throw new CheckoutError("INVALID_CHECKOUT", 400); return value.trim(); };
  const firstName = field("firstName", 80), lastName = field("lastName", 80), email = field("email", 254), phone = field("phone", 40);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^[+\d][\d\s().-]{5,39}$/.test(phone)) throw new CheckoutError("INVALID_CHECKOUT", 400);
  if (!Array.isArray(data.items) || !data.items.length || data.items.length > MAX_ITEMS) throw new CheckoutError("INVALID_CHECKOUT", 400);
  const seen = new Set<string>();
  const items = data.items.map(item => {
    if (!item || !validSlug(item.slug) || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QUANTITY || seen.has(item.slug)) throw new CheckoutError("INVALID_CHECKOUT", 400);
    seen.add(item.slug); return { slug: item.slug as string, quantity: item.quantity as number };
  });
  const method = (data.shipping as Record<string, unknown> | undefined)?.method;
  if (method !== "pickup") throw new CheckoutError("INVALID_CHECKOUT", 400);
  if (data.notes !== undefined && (typeof data.notes !== "string" || data.notes.length > 1000)) throw new CheckoutError("INVALID_CHECKOUT", 400);
  return { customer: { firstName, lastName, email, phone }, items, shipping: { method }, ...(typeof data.notes === "string" && data.notes.trim() ? { notes: data.notes.trim() } : {}) };
}
export function validIdempotencyKey(key: string | null): key is string { return Boolean(key && /^[A-Za-z0-9_-]{16,128}$/.test(key)); }
