import { getCheckoutSettings, getProductBySlug, logCmsError } from "@/lib/cms/client";
import { MAX_ITEMS, sanitizeItems } from "@/lib/cart/model";
import { noStoreHeaders, sameOrigin, readJsonLimited } from "@/lib/cart/http";
import { CheckoutError } from "@/lib/cms/checkout-types";
import { record } from "@/lib/cms/normalize";
import { parseProduct } from "@/lib/cms/product-normalize";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: { code: "INVALID_ORIGIN" } }, { status: 403, headers: noStoreHeaders });
  try {
    if (Number(request.headers.get("content-length")) > 12000) throw new Error("invalid");
    const body = record(await readJsonLimited(request, 12000));
    if (!Array.isArray(body.items) || body.items.length > MAX_ITEMS) return Response.json({ error: { code: "INVALID_CART" } }, { status: 400, headers: noStoreHeaders });
    const items = sanitizeItems(body.items);
    const [settings, products] = await Promise.all([getCheckoutSettings(), Promise.all(items.map(async item => {
      const product = await getProductBySlug(item.slug);
      return { slug: item.slug, product: product ? parseProduct(product) : null };
    }))]);
    return Response.json({ data: { settings, products } }, { headers: noStoreHeaders });
  } catch (error) { logCmsError("validación de carrito", error); return Response.json({ error: { code: error instanceof CheckoutError ? "INVALID_CART" : "CMS_UNAVAILABLE" } }, { status: error instanceof CheckoutError ? 400 : 503, headers: noStoreHeaders }); }
}
