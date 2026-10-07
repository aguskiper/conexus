import "server-only";
import { CmsError, type CmsPostDetail } from "./types";
import { parseCategories, parsePostDetail, parsePosts } from "./normalize";
import { safePublicUrl } from "./urls";
import { parseProducts, parseProductDetail, parseProductCategories } from "./product-normalize";
import { parseCheckoutSettings, parseOrderReceipt } from "./checkout-normalize";
import { CheckoutError, type OrderRequest } from "./checkout-types";

export async function getCheckoutSettings() {
  return parseCheckoutSettings(await request("/api/public/v1/checkout"));
}
export async function createOrder(payload: OrderRequest, key: string) {
  try {
    const response = await fetch(new URL("/api/public/v1/orders", cmsBaseUrl()), {
      method: "POST", cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(15000),
      headers: { Accept: "application/json", "Content-Type": "application/json", "Idempotency-Key": key },
      body: JSON.stringify(payload),
    });
    const body: unknown = await response.json();
    if (!response.ok) {
      const code = (body as { error?: { code?: unknown } })?.error?.code;
      throw new CheckoutError(typeof code === "string" && /^[A-Z_]{1,80}$/.test(code) ? code : "CMS_UNAVAILABLE", response.status);
    }
    return parseOrderReceipt(body);
  } catch (error) {
    if (error instanceof CheckoutError) throw error;
    throw new CheckoutError("CMS_UNAVAILABLE");
  }
}

export async function getProducts({ page = 1, limit = 12, category, q }: { page?: number; limit?: number; category?: string; q?: string } = {}) {
  const query = new URLSearchParams({ page: String(Number.isSafeInteger(page) && page > 0 ? page : 1), limit: String(Math.max(1, Math.min(50, Math.floor(limit) || 12))) });
  if (category) query.set("category", category);
  if (q) query.set("q", q);
  return parseProducts(await request("/api/public/v1/products", query));
}
export async function getProductBySlug(slug: string) {
  try { return parseProductDetail(await request("/api/public/v1/products/" + encodeURIComponent(slug))); }
  catch (error) { if (error instanceof CmsError && error.status === 404) return null; throw error; }
}
export async function getProductCategories() {
  return parseProductCategories(await request("/api/public/v1/product-categories"));
}

function cmsBaseUrl(): URL {
  const base = safePublicUrl(process.env.CONEXUS_CMS_URL?.replace(/\/$/, ""));
  if (!base) throw new CmsError("configuration");
  return new URL(base);
}
async function request(path: string, query?: URLSearchParams): Promise<unknown> {
  try {
    const url = new URL(path, cmsBaseUrl());
    if (query) url.search = query.toString();
    const response = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" }, signal: AbortSignal.timeout(5000), redirect: "manual" });
    if (!response.ok) throw new CmsError("response", response.status);
    return await response.json();
  } catch (error) {
    if (error instanceof CmsError) throw error;
    throw new CmsError("network");
  }
}
export async function getPosts({ page = 1, limit = 9, category }: { page?: number; limit?: number; category?: string } = {}) {
  const query = new URLSearchParams({ page: String(Number.isSafeInteger(page) && page > 0 ? page : 1), limit: String(Math.max(1, Math.min(50, Math.floor(limit) || 9))) });
  if (category) query.set("category", category);
  return parsePosts(await request("/api/public/v1/posts", query));
}
export async function getPostBySlug(slug: string): Promise<CmsPostDetail | null> {
  try { return parsePostDetail(await request("/api/public/v1/posts/" + encodeURIComponent(slug))); }
  catch (error) { if (error instanceof CmsError && error.status === 404) return null; throw error; }
}
export async function getCategories() {
  return parseCategories(await request("/api/public/v1/categories"));
}
export function logCmsError(context: string, error: unknown) {
  // No registrar URLs, stack traces, cuerpos ni configuración de entorno.
  console.error("[Conexus CMS]", context, error instanceof CmsError ? { kind: error.kind, status: error.status } : { kind: "unknown" });
}
