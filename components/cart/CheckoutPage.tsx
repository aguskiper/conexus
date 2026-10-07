"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import { useValidatedCart } from "./useValidatedCart";
import { OrderSummary } from "./OrderSummary";
import { checkoutAttempt, finishAttempt, pendingAttempt } from "@/lib/cart/idempotency";
import { checkoutMessage } from "@/lib/cart/errors";
import { validateOrderRequest } from "@/lib/cart/order-validation";
import { productAmount } from "@/lib/cart/totals";
import type { OrderRequest } from "@/lib/cms/checkout-types";
import { parseOrderReceipt } from "@/lib/cms/checkout-normalize";
import { record } from "@/lib/cms/normalize";
import { CheckoutError } from "@/lib/cms/checkout-types";
import { attemptStorage } from "@/lib/cart/session";
import styles from "./Commerce.module.css";
export function CheckoutPage() {
  const cart = useCart(), validation = useValidatedCart(), router = useRouter();
  const [processing, setProcessing] = useState(false), [uncertain, setUncertain] = useState(false), [error, setError] = useState("");
  const busy = useRef(false), submitted = useRef<{ payload: OrderRequest; key: string } | null>(null);
  const storage = useRef(attemptStorage(() => sessionStorage));
  const [recovery, setRecovery] = useState(false);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) setRecovery(Boolean(pendingAttempt(storage.current))); });
    return () => { active = false; };
  }, []);
  const errorRef = useRef<HTMLDivElement>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true; setProcessing(true); setError("");
    let code = "CMS_UNAVAILABLE", definitive = false, sent = false;
    try {
      let attempt = submitted.current;
      if (!uncertain) {
        const data = new FormData(event.currentTarget);
        const payload = validateOrderRequest({ customer: { firstName: data.get("firstName"), lastName: data.get("lastName"), email: data.get("email"), phone: data.get("phone") }, items: cart.items, shipping: { method: data.get("method") }, notes: data.get("notes") });
        // Un pedido incierto anterior debe recuperarse, no revalidarse como compra nueva.
        // Su reserva o un cambio de precio no pueden hacer que olvidemos la clave.
        if (pendingAttempt(storage.current)) {
          const persisted = await checkoutAttempt(payload, storage.current);
          attempt = { payload, key: persisted.key };
        } else {
        const fresh = await validation.refresh();
        if (!fresh) throw new Error("unavailable");
        if (!fresh.settings.enabled || !fresh.settings.methods.some(method => method.method === payload.shipping.method)) { code = "ECOMMERCE_DISABLED"; definitive = true; throw new Error("disabled"); }
        for (const item of payload.items) {
          const product = fresh.products.find(product => product.slug === item.slug)?.product;
          if (!product || !product.stock.available || (product.stock.managed && product.stock.availableQuantity !== undefined && item.quantity > product.stock.availableQuantity)) { code = "INSUFFICIENT_STOCK"; definitive = true; throw new Error("stock"); }
          if (product.currency !== fresh.settings.currency) { code = "CURRENCY_CHANGED"; definitive = true; throw new Error("currency"); }
          const previous = validation.products[item.slug];
          if (previous && productAmount(previous) !== productAmount(product)) { code = "PRICE_CHANGED"; definitive = true; throw new Error("price"); }
        }
        const persisted = await checkoutAttempt(payload, storage.current);
        attempt = { payload, key: persisted.key };
        }
        submitted.current = attempt;
      }
      if (!attempt) throw new Error("attempt");
      sent = true;
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": attempt.key }, body: JSON.stringify(attempt.payload) });
      const body = record(await response.json());
      if (!response.ok) {
        const responseError = body.error ? record(body.error) : {};
        code = typeof responseError.code === "string" ? responseError.code : "CMS_UNAVAILABLE";
        definitive = response.status >= 400 && response.status < 500 && response.status !== 408 && response.status !== 429 && !/IDEMPOTENCY|IN_PROGRESS/.test(code);
        throw new Error("order");
      }
      const receipt = parseOrderReceipt(body);
      cart.setReceipt(receipt); cart.clearCart();
      finishAttempt(storage.current);
      submitted.current = null;
      router.push("/pedido/confirmado");
    } catch (caught) {
      if (caught instanceof CheckoutError) { code = caught.code; definitive = true; }
      if (caught instanceof Error && caught.message === "PENDING_ATTEMPT") {
        setError("Hay una solicitud anterior pendiente de confirmar. Ingresá exactamente los mismos datos para reintentar, sin generar otro pedido."); setUncertain(false);
      } else {
        setError(checkoutMessage(code));
        if (definitive) { if (sent) { finishAttempt(storage.current); setRecovery(false); } submitted.current = null; setUncertain(false); void validation.refresh(); }
        else setUncertain(Boolean(submitted.current));
      }
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally { busy.current = false; setProcessing(false); }
  }
  if (!cart.ready || (validation.loading && !Object.keys(validation.products).length)) return <p className={styles.status} role="status">Verificando tu pedido…</p>;
  if (!cart.items.length) return <div className={styles.empty}><h2>Tu carrito está vacío.</h2><Link href="/productos" className="button button--primary">Ver productos →</Link></div>;
  if (cart.settings?.enabled === false) return <div className={styles.empty}><h2>Las compras están deshabilitadas.</h2><p>Podés seguir explorando nuestros productos como catálogo.</p><Link href="/productos" className="button button--primary">Ver productos →</Link></div>;
  const methods = cart.settings?.methods.filter(method => method.method === "pickup") || [];
  const invalid = cart.items.some(item => {
    const product = validation.products[item.slug];
    return !product?.stock.available || (product.stock.managed && product.stock.availableQuantity !== undefined && item.quantity > product.stock.availableQuantity);
  });
  return <><Link href="/carrito" className={styles.textLink}>← Revisar carrito</Link><div className={styles.checkoutGrid}><form onSubmit={submit} className={styles.form}>
    <div ref={errorRef} tabIndex={-1} id="checkout-error" className={styles.error} role={error ? "alert" : undefined}>{error}</div>
    {validation.error && <p role="alert">No pudimos verificar los productos. <button type="button" className={styles.textButton} onClick={() => void validation.refresh()}>Reintentar</button></p>}
    {validation.changed.length > 0 && <p className={styles.priceNotice}>El precio de uno o más productos fue actualizado. El resumen muestra los importes vigentes.</p>}
    {invalid && !validation.error && <p>Hay productos no disponibles. <Link href="/carrito" className={styles.textLink}>Revisar carrito</Link></p>}
    {!methods.length && !validation.error && <p>No hay un método de retiro habilitado en este momento.</p>}
    <fieldset disabled={processing || uncertain}><legend>Tus datos</legend><div className={styles.fields}>
      <label>Nombre *<input name="firstName" autoComplete="given-name" required maxLength={80} aria-describedby={error ? "checkout-error" : undefined} /></label>
      <label>Apellido *<input name="lastName" autoComplete="family-name" required maxLength={80} aria-describedby={error ? "checkout-error" : undefined} /></label>
      <label>Email *<input name="email" type="email" autoComplete="email" required maxLength={254} aria-describedby={error ? "checkout-error" : undefined} /></label>
      <label>Teléfono *<input name="phone" type="tel" autoComplete="tel" required minLength={6} maxLength={40} pattern="[+0-9][0-9 ]{5,39}" placeholder="+5492611234567" title="Usá números, espacios y un + inicial opcional." aria-describedby={error ? "checkout-error" : undefined} /></label>
    </div></fieldset>
    <fieldset disabled={processing || uncertain}><legend>Entrega</legend>{methods.map(method => <label className={styles.delivery} key={method.method}><span><input type="radio" name="method" value={method.method} required defaultChecked={methods.length === 1} />{method.label}</span><small>{method.instructions}</small></label>)}</fieldset>
    <label>Notas del pedido <span className={styles.note}>(opcional)</span><textarea name="notes" maxLength={1000} rows={3} disabled={processing || uncertain} /></label>
    {uncertain && <p className={styles.note}>Conservamos esta misma solicitud. Reintentá sin cambiar los datos para evitar pedidos duplicados.</p>}
    {recovery && !uncertain && <p className={styles.note}>Hay una solicitud pendiente de confirmar. Ingresá exactamente los mismos datos y notas para recuperarla sin crear otro pedido.</p>}
    <button className="button button--primary" type="submit" disabled={processing || (!uncertain && !recovery && (validation.error || validation.loading || invalid || !methods.length))}>{processing ? "Procesando pedido…" : uncertain || recovery ? "Reintentar el mismo pedido" : "Confirmar pedido"} {!processing && <span aria-hidden="true">→</span>}</button>
    <p className={styles.note}>Este paso registra tu pedido. No se realiza ningún pago.</p>
  </form><OrderSummary items={cart.items} products={validation.products} currency={cart.settings?.currency || ""} /></div></>;
}
