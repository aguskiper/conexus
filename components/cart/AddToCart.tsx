"use client";
import { useState } from "react";
import Link from "next/link";
import type { CmsProduct } from "@/lib/cms/product-types";
import { MAX_QUANTITY } from "@/lib/cart/model";
import { productAmount } from "@/lib/cart/totals";
import { useCart } from "./CartProvider";
import { QuantityControl } from "./QuantityControl";
import styles from "./Commerce.module.css";
export function AddToCart({ product }: { product: CmsProduct }) {
  const { addItem, ready, items, settings, observePrice } = useCart();
  const [amount, setAmount] = useState(1), [message, setMessage] = useState("");
  if (settings?.enabled === false || !product.stock.available) return null;
  const existing = items.find(item => item.slug === product.slug)?.quantity || 0;
  const limit = Math.min(MAX_QUANTITY, product.stock.managed ? product.stock.availableQuantity ?? MAX_QUANTITY : MAX_QUANTITY);
  const max = Math.max(0, limit - existing);
  function add() {
    if (!ready || max < 1) return;
    const accepted = addItem(product.slug, Math.min(amount, max));
    if (accepted) observePrice(product.slug, product.currency + ":" + productAmount(product));
    setMessage(accepted ? "Producto agregado al carrito." : "Tu carrito alcanzó el máximo de productos. Revisalo para continuar.");
  }
  return <div className={styles.add}><p>Cantidad</p><QuantityControl value={Math.min(amount, Math.max(1, max))} onChange={setAmount} max={max} disabled={!ready || max < 1} />
    <button className="button button--primary" type="button" onClick={add} disabled={!ready || max < 1}>Agregar al carrito <span aria-hidden="true">→</span></button>
    {max < 1 && <p>Alcanzaste la cantidad disponible o el límite por producto.</p>}
    <p className={styles.feedback} role="status">{message}</p>{message && <Link className={styles.textLink} href="/carrito">Ver carrito →</Link>}
  </div>;
}
