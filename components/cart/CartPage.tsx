"use client";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { useValidatedCart } from "./useValidatedCart";
import { QuantityControl } from "./QuantityControl";
import { MAX_QUANTITY } from "@/lib/cart/model";
import { productAmount, lineAmount, cartTotal } from "@/lib/cart/totals";
import { formatMoney } from "@/lib/cms/money";
import styles from "./Commerce.module.css";
export function CartPage() {
  const cart = useCart(), validation = useValidatedCart();
  if (!cart.ready) return <p className={styles.status} role="status">Preparando tu carrito…</p>;
  if (!cart.items.length) return <div className={styles.empty}><span aria-hidden="true">▱</span><h2>Tu carrito está vacío.</h2><Link className="button button--primary" href="/productos">Ver productos →</Link></div>;
  const invalid = cart.items.some(item => { const product = validation.products[item.slug]; return !product || !product.stock.available || (product.stock.managed && product.stock.availableQuantity !== undefined && item.quantity > product.stock.availableQuantity); });
  const currency = cart.settings?.currency || "";
  const mixedCurrency = cart.items.some(item => validation.products[item.slug] && validation.products[item.slug]?.currency !== currency);
  const total = cartTotal(cart.items.map(item => ({ product: validation.products[item.slug] || null, quantity: item.quantity })), currency);
  const canContinue = !validation.loading && !validation.error && !invalid && !mixedCurrency && cart.settings?.enabled && cart.settings.methods.some(method => method.method === "pickup");
  return <><div className={styles.messageArea} aria-live="polite">
    {validation.loading && <p role="status">Actualizando precios y disponibilidad…</p>}
    {validation.error && <p role="alert">No pudimos verificar el carrito. No se modificó su contenido. <button type="button" className={styles.textButton} onClick={() => void validation.refresh()}>Reintentar</button></p>}
    {cart.storageWarning && <p>No podemos guardar el carrito en este navegador. Se conservará durante esta visita.</p>}
    {cart.settings?.enabled === false && <p>Las compras están deshabilitadas. Podés seguir explorando el catálogo.</p>}
    {invalid && !validation.loading && !validation.error && <p>Uno o más productos no están disponibles o exceden el stock público. Ajustá las cantidades o eliminá esos productos para continuar.</p>}
    {mixedCurrency && !validation.loading && <p>Hay productos con moneda distinta a la configuración de checkout. Revisá el carrito antes de continuar.</p>}
  </div><div className={styles.cartList}>{cart.items.map(item => {
    const product = validation.products[item.slug], max = Math.min(MAX_QUANTITY, product?.stock.managed ? product.stock.availableQuantity ?? MAX_QUANTITY : MAX_QUANTITY);
    return <article className={styles.cartLine} key={item.slug}>
      <div className={styles.lineImage}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {product?.featuredImage ? <img src={product.featuredImage} alt={product.featuredImageAlt || product.name} width={120} height={120} /> : <span aria-hidden="true">✦</span>}
      </div><div className={styles.lineInfo}><h2>{product ? <Link href={"/productos/" + encodeURIComponent(item.slug)}>{product.name}</Link> : item.slug}</h2>
        <p>{product ? formatMoney(productAmount(product), product.currency) || "Precio a confirmar" : validation.loading ? "Verificando producto…" : "Producto no disponible"}</p>
        {product && !product.stock.available && <p>Sin stock</p>}
        {validation.changed.includes(item.slug) && <p className={styles.priceNotice}>El precio de este producto fue actualizado.</p>}
        <button type="button" className={styles.textButton} onClick={() => cart.removeItem(item.slug)} aria-label={"Eliminar " + (product?.name || item.slug)}>Eliminar</button>
      </div><QuantityControl label={"Cantidad de " + (product?.name || item.slug)} value={item.quantity} onChange={amount => cart.updateQuantity(item.slug, amount)} max={max} disabled={validation.loading || !product?.stock.available} />
      <strong className={styles.lineSubtotal}>{product ? formatMoney(lineAmount(product, item.quantity), product.currency) || "A confirmar" : "—"}</strong>
    </article>;
  })}</div><div className={styles.cartEnd}><Link className={styles.textLink} href="/productos">← Seguir explorando</Link><div><p>Subtotal orientativo <strong>{formatMoney(total, currency) || "A confirmar"}</strong></p>
    <p className={styles.note}>Precio y stock definitivos validados por el CMS.</p>{canContinue ? <Link className="button button--primary" href="/checkout">Finalizar compra →</Link> : <button className="button button--primary" disabled>Finalizar compra →</button>}</div></div></>;
}
