import { record } from "./normalize";
import { CmsError } from "./types";
import type { CheckoutSettings, OrderReceipt } from "./checkout-types";
import { validPublicToken } from "./payment-types";
export function parseCheckoutSettings(value: unknown): CheckoutSettings {
  const data = record(record(value).data);
  if (typeof data.enabled !== "boolean" || typeof data.currency !== "string" || !Array.isArray(data.methods)) throw new CmsError("contract");
  const payment = data.payment === undefined ? null : record(data.payment);
  if (payment && typeof payment.enabled !== "boolean") throw new CmsError("contract");
  return { enabled: data.enabled, currency: data.currency, reservationMinutes: typeof data.reservationMinutes === "number" ? data.reservationMinutes : 0,
    methods: data.methods.map(value => { const method = record(value); if (typeof method.method !== "string" || typeof method.label !== "string") throw new CmsError("contract");
      return { method: method.method, label: method.label, instructions: typeof method.instructions === "string" ? method.instructions : "" }; }),
    ...(payment ? { payment: { enabled: payment.enabled === true, provider: typeof payment.provider === "string" ? payment.provider : null, label: typeof payment.label === "string" ? payment.label : "" } } : {}) };
}
export function parseOrderReceipt(value: unknown): OrderReceipt {
  const data = record(record(value).data);
  if (typeof data.orderNumber !== "string" || !/^CX-[A-Z0-9-]{1,40}$/.test(data.orderNumber) || data.status !== "PENDING_PAYMENT" || typeof data.total !== "string" || !/^\d+(?:\.\d+)?$/.test(data.total) || typeof data.currency !== "string" || !/^[A-Z]{3}$/.test(data.currency)) throw new CmsError("contract");
  if (data.publicStatusToken !== undefined && !validPublicToken(data.publicStatusToken)) throw new CmsError("contract");
  return { orderNumber: data.orderNumber, status: data.status, total: data.total, currency: data.currency,
    ...(validPublicToken(data.publicStatusToken) ? { publicStatusToken: data.publicStatusToken } : {}) };
}
