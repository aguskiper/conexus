export const CART_KEY = "conexus-cart-v1";
export const MAX_QUANTITY = 99;
export const MAX_ITEMS = 30;
export interface CartItem { slug: string; quantity: number }
export function validSlug(value: unknown): value is string { return typeof value === "string" && value.length > 0 && value.length <= 160 && /^[a-zA-Z0-9]+(?:[-_][a-zA-Z0-9]+)*$/.test(value); }
export function quantity(value: number, max = MAX_QUANTITY) { return Math.max(1, Math.min(max, Number.isFinite(value) ? Math.floor(value) : 1)); }
export function sanitizeItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  const unique = new Map<string, number>();
  for (const item of value.slice(0, MAX_ITEMS)) {
    if (!item || !validSlug(item.slug) || !Number.isSafeInteger(item.quantity) || item.quantity < 1) continue;
    unique.set(item.slug, quantity((unique.get(item.slug) || 0) + item.quantity));
  }
  return [...unique].map(([slug, quantity]) => ({ slug, quantity }));
}
export function readCart(serialized: string | null): CartItem[] { try { return sanitizeItems(JSON.parse(serialized || "[]")); } catch { return []; } }
export function addCartItem(items: CartItem[], slug: string, amount: number): CartItem[] {
  if (!validSlug(slug) || !Number.isSafeInteger(amount) || amount < 1) return items;
  if (!items.some(item => item.slug === slug) && items.length >= MAX_ITEMS) return items;
  return sanitizeItems([...items, { slug, quantity: amount }]);
}
export function setCartQuantity(items: CartItem[], slug: string, amount: number) { return items.map(item => item.slug === slug ? { ...item, quantity: quantity(amount) } : item); }
