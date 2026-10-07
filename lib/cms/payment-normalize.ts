import { record } from "./normalize";
import { CmsError } from "./types";
import { safePublicUrl } from "./urls";
import { validOrderNumber, type PaymentCheckout, type PublicOrderStatus } from "./payment-types";
export function safeCheckoutUrl(value: unknown): string | null {
  const safe = safePublicUrl(value);
  if (!safe) return null;
  const url = new URL(safe);
  return url.protocol === "https:" && ["www.mercadopago.com.ar", "mercadopago.com.ar", "sandbox.mercadopago.com.ar"].includes(url.hostname) && !url.port && url.pathname.startsWith("/checkout/") ? safe : null;
}
export function parsePaymentCheckout(value: unknown): PaymentCheckout {
  const data = record(record(value).data), checkoutUrl = safeCheckoutUrl(data.checkoutUrl);
  if (!checkoutUrl || data.provider !== "mercadopago" || typeof data.expiresAt !== "string" || !Number.isFinite(Date.parse(data.expiresAt))) throw new CmsError("contract");
  return { checkoutUrl, provider: data.provider, expiresAt: data.expiresAt };
}
export function parsePublicOrderStatus(value: unknown): PublicOrderStatus {
  const data = record(record(value).data);
  const status = (value: unknown) => typeof value === "string" && /^[A-Z_]{1,40}$/.test(value);
  if (!validOrderNumber(data.orderNumber) || !status(data.orderStatus) || (data.paymentStatus !== null && !status(data.paymentStatus))) throw new CmsError("contract");
  return { orderNumber: data.orderNumber, orderStatus: data.orderStatus as string, paymentStatus: data.paymentStatus as string | null };
}
