import { parsePaymentCheckout, parsePublicOrderStatus, safeCheckoutUrl } from "@/lib/cms/payment-normalize";
import { validPublicToken } from "@/lib/cms/payment-types";
import { PaymentError } from "./errors";
import { canRetryPayment, paymentView } from "./state";
import { getPaymentSession, savePaymentSession, type PaymentSession } from "./session";
async function responseBody(response: Response): Promise<unknown> {
  const body = await response.json();
  if (!response.ok) {
    const code = (body as { error?: { code?: unknown } })?.error?.code;
    const wait = Number(response.headers.get("Retry-After") || 0);
    throw new PaymentError(typeof code === "string" ? code : "CMS_UNAVAILABLE", Number.isFinite(wait) ? Math.min(90, Math.max(response.status === 429 ? 3 : 0, wait)) : 3);
  }
  return body;
}
export async function fetchOrderStatus(session: Pick<PaymentSession, "orderNumber" | "publicStatusToken">, signal?: AbortSignal) {
  if (!validPublicToken(session.publicStatusToken)) throw new PaymentError("NOT_FOUND");
  const response = await fetch("/api/orders/" + encodeURIComponent(session.orderNumber) + "/status", { cache: "no-store", credentials: "omit", headers: { Authorization: "Bearer " + session.publicStatusToken }, signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(18000)]) : AbortSignal.timeout(18000) });
  const status = parsePublicOrderStatus(await responseBody(response));
  if (status.orderNumber !== session.orderNumber) throw new PaymentError("NOT_FOUND");
  return status;
}
export async function retryPayment(session: PaymentSession, redirect: (url: string) => void = url => window.location.assign(url)) {
  const status = await fetchOrderStatus(session);
  if (!canRetryPayment(status)) return { status, redirected: false };
  const current = getPaymentSession(session.orderNumber) || session;
  let attempt = current;
  if (paymentView(status) === "rejected" && !current.rejectedRetryPending) attempt = { ...current, paymentAttemptKey: crypto.randomUUID(), rejectedRetryPending: true };
  if (!savePaymentSession(attempt)) throw new PaymentError("SESSION_UNAVAILABLE");
  const response = await fetch("/api/orders/" + encodeURIComponent(attempt.orderNumber) + "/payment", {
    method: "POST", cache: "no-store", credentials: "omit", signal: AbortSignal.timeout(18000),
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + attempt.publicStatusToken, "Idempotency-Key": attempt.paymentAttemptKey }, body: "{}",
  });
  const checkout = parsePaymentCheckout(await responseBody(response));
  const checkoutUrl = safeCheckoutUrl(checkout.checkoutUrl);
  if (!checkoutUrl) throw new PaymentError("UNSAFE_CHECKOUT_URL");
  if (!savePaymentSession({ ...attempt, rejectedRetryPending: false })) throw new PaymentError("SESSION_UNAVAILABLE");
  redirect(checkoutUrl);
  return { status, redirected: true };
}
