import { record } from "@/lib/cms/normalize";
import { parseProduct } from "@/lib/cms/product-normalize";
import { parseCheckoutSettings } from "@/lib/cms/checkout-normalize";
import { validSlug } from "./model";
export function parseValidatedCart(value: unknown) {
  const data = record(record(value).data);
  if (!Array.isArray(data.products)) throw new Error("Invalid cart response");
  return { settings: parseCheckoutSettings({ data: data.settings }), products: data.products.map(value => {
    const item = record(value);
    if (!validSlug(item.slug)) throw new Error("Invalid product response");
    return { slug: item.slug, product: item.product === null ? null : parseProduct(item.product) };
  }) };
}
