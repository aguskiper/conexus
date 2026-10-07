import type { CartItem } from "@/lib/cart/model";
import { getPaymentSession, savePaymentSession, type PaymentSession } from "./session";
import { paymentView } from "./state";
import type { PublicOrderStatus } from "@/lib/cms/payment-types";
const settled = new WeakSet<PaymentSession>();
export function settlePaidCart(status: PublicOrderStatus, session: PaymentSession, cart: {
  ready: boolean; items: CartItem[]; clearCart: () => void;
  removeItem: (slug: string) => void; updateQuantity: (slug: string, quantity: number) => void;
}): boolean {
  if (!cart.ready || status.orderNumber !== session.orderNumber || paymentView(status) !== "paid") return false;
  const saved = getPaymentSession(session.orderNumber) || session;
  if (saved.cartCleared || settled.has(session)) return false;
  const remaining = cart.items.map(item => ({ ...item, quantity: item.quantity - (saved.cart.find(ordered => ordered.slug === item.slug)?.quantity || 0) })).filter(item => item.quantity > 0);
  if (!remaining.length) cart.clearCart();
  else for (const item of cart.items) {
    const keep = remaining.find(value => value.slug === item.slug);
    if (!keep) cart.removeItem(item.slug); else if (keep.quantity !== item.quantity) cart.updateQuantity(item.slug, keep.quantity);
  }
  const completed = { ...saved, cartCleared: true };
  savePaymentSession(completed);
  settled.add(session);
  return true;
}
