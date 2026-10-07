import { createOrder, logCmsError } from "@/lib/cms/client";
import { CheckoutError } from "@/lib/cms/checkout-types";
import { validateOrderRequest, validIdempotencyKey } from "@/lib/cart/order-validation";
import { noStoreHeaders, sameOrigin, readJsonLimited } from "@/lib/cart/http";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: { code: "INVALID_ORIGIN" } }, { status: 403, headers: noStoreHeaders });
  try {
    const key = request.headers.get("Idempotency-Key");
    if (!validIdempotencyKey(key) || Number(request.headers.get("content-length")) > 20000) throw new CheckoutError("INVALID_CHECKOUT", 400);
    let body: unknown;
    try { body = await readJsonLimited(request, 20000); } catch { throw new CheckoutError("INVALID_CHECKOUT", 400); }
    const payload = validateOrderRequest(body);
    const receipt = await createOrder(payload, key);
    return Response.json({ data: receipt }, { status: 201, headers: noStoreHeaders });
  } catch (error) {
    logCmsError("creación de pedido", error);
    return Response.json({ error: { code: error instanceof CheckoutError ? error.code : "CMS_UNAVAILABLE" } }, { status: error instanceof CheckoutError ? error.status : 503, headers: noStoreHeaders });
  }
}
