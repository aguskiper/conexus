import { CheckoutError } from "@/lib/cms/checkout-types";
import { validOrderNumber, validPublicToken } from "@/lib/cms/payment-types";
import { noStoreHeaders } from "@/lib/cart/http";
export function paymentAccess(request: Request, orderNumber: string) {
  const header = request.headers.get("Authorization"), token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!validOrderNumber(orderNumber) || !validPublicToken(token)) throw new CheckoutError("NOT_FOUND", 404);
  return token;
}
export function paymentFailure(error: unknown) {
  const status = error instanceof CheckoutError ? error.status : 503;
  const retryAfter = error instanceof CheckoutError ? error.retryAfter : undefined;
  return Response.json({ error: { code: error instanceof CheckoutError ? error.code : "CMS_UNAVAILABLE" } }, {
    status, headers: { ...noStoreHeaders, ...(retryAfter ? { "Retry-After": String(retryAfter) } : {}) },
  });
}
