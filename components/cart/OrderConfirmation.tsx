"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart, RECEIPT_KEY } from "./CartProvider";
import { parseOrderReceipt } from "@/lib/cms/checkout-normalize";
import { formatMoney } from "@/lib/cms/money";
import type { OrderReceipt } from "@/lib/cms/checkout-types";
import { PendingPaymentNotice } from "./PendingPaymentNotice";
import styles from "./Commerce.module.css";
export function OrderConfirmation() {
  const { receipt } = useCart();
  const [stored, setStored] = useState<OrderReceipt | null>(null), [ready, setReady] = useState(false);
  useEffect(() => { Promise.resolve().then(() => { try { const saved = sessionStorage.getItem(RECEIPT_KEY); if (saved) setStored(parseOrderReceipt({ data: JSON.parse(saved) })); } catch {} setReady(true); }); }, []);
  const order = receipt || stored;
  if (!ready && !order) return <p role="status">Preparando la confirmación…</p>;
  if (!order) return <div className={styles.empty}><h2>No hay un pedido confirmado en esta sesión.</h2><p>Podés consultar el catálogo para empezar una nueva compra.</p><Link className="button button--primary" href="/productos">Ver productos →</Link></div>;
  return <div className={styles.confirmation}><span className={styles.confirmationMark} aria-hidden="true">✓</span><h1>¡Pedido recibido!</h1><h2>Pedido #{order.orderNumber}</h2><p>Tu pedido fue registrado correctamente.</p><p className={styles.confirmationTotal}>Total confirmado: <strong>{formatMoney(order.total, order.currency)}</strong></p><PendingPaymentNotice receipt={order} /><Link href="/productos" className="button button--primary">Volver a productos →</Link><p className={styles.note}>Este comprobante público se conserva solo en esta pestaña. No contiene tus datos de contacto.</p></div>;
}
