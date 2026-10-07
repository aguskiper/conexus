export interface PaymentCheckout { checkoutUrl: string; provider: "mercadopago"; expiresAt: string }
export interface PublicOrderStatus { orderNumber: string; orderStatus: string; paymentStatus: string | null }
export function validOrderNumber(value: unknown): value is string {
  return typeof value === "string" && /^CX-[A-Z0-9-]{1,40}$/.test(value);
}
export function validPublicToken(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);
}
export function mercadoPagoEnabled(settings: import("./checkout-types").CheckoutSettings | null | undefined) {
  return Boolean(settings?.enabled && settings.currency === "ARS" && settings.payment?.enabled && settings.payment.provider === "mercadopago");
}
