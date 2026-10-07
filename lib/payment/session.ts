import { sanitizeItems, type CartItem } from "@/lib/cart/model";
import { validOrderNumber, validPublicToken } from "@/lib/cms/payment-types";
export const PAYMENT_SESSION_KEY = "conexus-payment-session-v1";
export interface PaymentSession {
  orderNumber: string; publicStatusToken: string; paymentAttemptKey: string;
  cart: CartItem[]; createdAt: number; cartCleared: boolean; rejectedRetryPending: boolean; requiresPayment: boolean;
}
function storage(): Storage | null { try { return typeof window !== "undefined" ? window.sessionStorage : null; } catch { return null; } }
export function canStorePaymentSession(): boolean {
  const target = storage();
  if (!target) return false;
  try { const key = "conexus-payment-storage-check"; target.setItem(key, "1"); target.removeItem(key); return true; } catch { return false; }
}
function sessions(): PaymentSession[] {
  try {
    const value: unknown = JSON.parse(storage()?.getItem(PAYMENT_SESSION_KEY) || "[]");
    if (!Array.isArray(value)) return [];
    return value.filter(item => item && validOrderNumber(item.orderNumber) && validPublicToken(item.publicStatusToken) && typeof item.paymentAttemptKey === "string" && /^[a-f0-9-]{36}$/i.test(item.paymentAttemptKey) && Number.isFinite(item.createdAt))
      .slice(-5).map(item => ({ orderNumber: item.orderNumber, publicStatusToken: item.publicStatusToken, paymentAttemptKey: item.paymentAttemptKey,
        cart: sanitizeItems(item.cart), createdAt: item.createdAt, cartCleared: item.cartCleared === true, rejectedRetryPending: item.rejectedRetryPending === true, requiresPayment: item.requiresPayment === true }));
  } catch { return []; }
}
export function getPaymentSession(orderNumber?: string): PaymentSession | null {
  const values = sessions();
  return orderNumber !== undefined ? values.find(item => item.orderNumber === orderNumber) || null : values.at(-1) || null;
}
export function savePaymentSession(session: PaymentSession): boolean {
  const target = storage();
  if (!target || !validOrderNumber(session.orderNumber) || !validPublicToken(session.publicStatusToken)) return false;
  try {
    const value = { orderNumber: session.orderNumber, publicStatusToken: session.publicStatusToken, paymentAttemptKey: session.paymentAttemptKey,
      cart: sanitizeItems(session.cart), createdAt: session.createdAt, cartCleared: session.cartCleared, rejectedRetryPending: session.rejectedRetryPending, requiresPayment: session.requiresPayment };
    target.setItem(PAYMENT_SESSION_KEY, JSON.stringify([...sessions().filter(item => item.orderNumber !== session.orderNumber), value].sort((a, b) => a.createdAt - b.createdAt).slice(-5)));
    return getPaymentSession(session.orderNumber)?.paymentAttemptKey === session.paymentAttemptKey;
  } catch { return false; }
}
export function clearPaymentSession(orderNumber?: string): boolean {
  try { const target = storage(); if (!target) return false; if (!orderNumber) target.removeItem(PAYMENT_SESSION_KEY);
    else target.setItem(PAYMENT_SESSION_KEY, JSON.stringify(sessions().filter(item => item.orderNumber !== orderNumber))); return true;
  } catch { return false; }
}
