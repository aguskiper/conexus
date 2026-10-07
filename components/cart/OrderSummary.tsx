"use client";
import type { CmsProduct } from "@/lib/cms/product-types";
import type { CartItem } from "@/lib/cart/model";
import { cartTotal, lineAmount } from "@/lib/cart/totals";
import { formatMoney } from "@/lib/cms/money";
import styles from "./Commerce.module.css";
export function OrderSummary({ items, products, currency }: { items: CartItem[]; products: Record<string, CmsProduct | null>; currency: string }) {
  const total = cartTotal(items.map(item => ({ product: products[item.slug] || null, quantity: item.quantity })), currency);
  return <aside className={styles.summary} aria-labelledby="order-summary-title"><p className="kicker"><span />TU PEDIDO</p><h2 id="order-summary-title">Resumen</h2>
    <ul>{items.map(item => <li key={item.slug}><span>{products[item.slug]?.name || item.slug}<small>Cantidad: {item.quantity}</small></span><strong>{products[item.slug] ? formatMoney(lineAmount(products[item.slug]!, item.quantity), currency) || "A confirmar" : "No disponible"}</strong></li>)}</ul>
    <dl><div><dt>Subtotal</dt><dd>{formatMoney(total, currency) || "A confirmar"}</dd></div><div><dt>Envío / retiro</dt><dd>Gratis</dd></div><div className={styles.total}><dt>Total orientativo</dt><dd>{formatMoney(total, currency) || "A confirmar"}</dd></div></dl>
    <p className={styles.note}>El CMS verifica precios y disponibilidad al registrar el pedido. Todavía no se realiza ningún pago.</p>
  </aside>;
}
