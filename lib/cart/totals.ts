import type { CmsProduct } from "@/lib/cms/product-types";
export function decimalMinor(value: string): bigint | null {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
}
export function minorDecimal(value: bigint): string { return (value / BigInt(100)).toString() + "." + (value % BigInt(100)).toString().padStart(2, "0"); }
export function productAmount(product: CmsProduct): string | null { return product.showPrices ? product.salePrice ?? product.price : null; }
export function lineAmount(product: CmsProduct, amount: number): string | null {
  const price = productAmount(product), minor = price === null ? null : decimalMinor(price);
  return minor === null ? null : minorDecimal(minor * BigInt(amount));
}
export function cartTotal(lines: { product: CmsProduct | null; quantity: number }[], currency: string): string | null {
  let total = BigInt(0);
  for (const line of lines) {
    if (!line.product || line.product.currency !== currency) return null;
    const subtotal = lineAmount(line.product, line.quantity);
    if (subtotal === null) return null;
    total += decimalMinor(subtotal)!;
  }
  return minorDecimal(total);
}
