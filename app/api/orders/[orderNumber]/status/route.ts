import { getPublicOrderStatus, logCmsError } from "@/lib/cms/client";
import { noStoreHeaders } from "@/lib/cart/http";
import { paymentAccess, paymentFailure } from "@/lib/payment/proxy";
export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: Promise<{ orderNumber: string }> }) {
  try {
    const { orderNumber } = await params, token = paymentAccess(request, orderNumber);
    return Response.json({ data: await getPublicOrderStatus(orderNumber, token) }, { headers: noStoreHeaders });
  } catch (error) { logCmsError("estado público de pago", error); return paymentFailure(error); }
}
