import { initiateOrderPayment, logCmsError } from "@/lib/cms/client";
import { CheckoutError } from "@/lib/cms/checkout-types";
import { record } from "@/lib/cms/normalize";
import { noStoreHeaders, readJsonLimited, sameOrigin } from "@/lib/cart/http";
import { paymentAccess, paymentFailure } from "@/lib/payment/proxy";
export const dynamic = "force-dynamic";
export async function POST(request: Request, { params }: { params: Promise<{ orderNumber: string }> }) {
  if (!sameOrigin(request)) return Response.json({ error: { code: "INVALID_ORIGIN" } }, { status: 403, headers: noStoreHeaders });
  try {
    const { orderNumber } = await params, token = paymentAccess(request, orderNumber);
    const key = request.headers.get("Idempotency-Key");
    if (!key || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(key)) throw new CheckoutError("INVALID_CHECKOUT", 400);
    const body = record(await readJsonLimited(request, 2000));
    if (Object.keys(body).length) throw new CheckoutError("INVALID_CHECKOUT", 400);
    const payment = await initiateOrderPayment(orderNumber, token, key);
    return Response.json({ data: payment }, { headers: noStoreHeaders });
  } catch (error) { logCmsError("iniciar pago", error); return paymentFailure(error); }
}
