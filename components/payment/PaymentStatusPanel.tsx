"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { OrderReceipt } from "@/lib/cms/checkout-types";
import type { PaymentSession } from "@/lib/payment/session";
import { clearPaymentSession, getPaymentSession } from "@/lib/payment/session";
import { retryPayment } from "@/lib/payment/client";
import { canRetryPayment, paymentCopy, paymentView, terminalPayment } from "@/lib/payment/state";
import { PaymentError } from "@/lib/payment/errors";
import { paymentErrorMessage } from "@/lib/payment/errors";
import { formatMoney } from "@/lib/cms/money";
import { usePaymentStatus } from "./usePaymentStatus";
import styles from "@/components/cart/Commerce.module.css";
export type PaymentReturn = "exito" | "pendiente" | "error" | "recovery";
export function PaymentStatusPanel({ orderNumber, mode = "recovery", receipt, sessionOverride, initialError, headingLevel = 1 }: {
  orderNumber?: string; mode?: PaymentReturn; receipt?: OrderReceipt; sessionOverride?: PaymentSession; initialError?: string; headingLevel?: 1 | 2;
}) {
  const payment = usePaymentStatus(orderNumber, sessionOverride);
  const [processing, setProcessing] = useState(false);
  const [bootstrapError, setBootstrapError] = useState(initialError || "");
  const busy = useRef(false), heading = useRef<HTMLHeadingElement>(null);
  const actualView = payment.status ? paymentView(payment.status) : "confirming";
  const missing = payment.ready && !payment.session;
  const accessError = missing || ["NOT_FOUND", "TOKEN_UNAVAILABLE"].includes(payment.error);
  const code = payment.error || bootstrapError;
  // Un rechazo explícito del CMS al iniciar pago también bloquea otro cobro,
  // incluso si el estado de Order todavía no refleja la expiración/revisión.
  const view = ["paid", "review", "expired", "refunded"].includes(actualView) ? actualView
    : code === "PAYMENT_REQUIRES_REVIEW" ? "review"
    : ["ORDER_NOT_PAYABLE", "RESERVATION_INVALID"].includes(code) ? "expired" : actualView;
  const copy = paymentCopy[view];
  const title = accessError ? "Necesitamos recuperar tu pedido." : mode === "error" && !payment.status ? "No pudimos completar el pago." : copy.title;
  const Heading = headingLevel === 1 ? "h1" : "h2";
  useEffect(() => { if (payment.ready) heading.current?.focus({ preventScroll: true }); }, [view, accessError, payment.ready]);
  async function retry() {
    if (busy.current || !allowRetry || !payment.session || !payment.status || payment.cooldown > Date.now()) return;
    busy.current = true; setProcessing(true);
    setBootstrapError("");
    try {
      const result = await retryPayment(getPaymentSession(payment.session.orderNumber) || payment.session);
      payment.setStatus(result.status);
      if (!result.redirected && !terminalPayment(result.status)) payment.refresh();
    } catch (error) {
      if (error instanceof PaymentError && ["PAYMENT_REQUIRES_REVIEW", "ORDER_NOT_PAYABLE", "RESERVATION_INVALID", "PAYMENTS_UNAVAILABLE"].includes(error.code)) setBootstrapError(error.code);
      payment.failure(error);
    }
    finally { busy.current = false; setProcessing(false); }
  }
  const allowRetry = payment.paymentsEnabled && !accessError && payment.status && canRetryPayment(payment.status) && !["review", "expired", "refunded", "paid"].includes(view) && code !== "PAYMENTS_UNAVAILABLE" && (view === "rejected" || mode === "error" || mode === "recovery" || payment.timedOut);
  const number = receipt?.orderNumber || payment.session?.orderNumber || orderNumber;
  return <div className={styles.confirmation}>
    <span className={styles.confirmationMark} aria-hidden="true">{copy.mark}</span>
    <div aria-live="polite" aria-atomic="true"><Heading ref={heading} tabIndex={-1} className={styles.paymentHeading}>{title}</Heading>
      {number && <p className={styles.paymentNumber}>Pedido #{number}</p>}
      {mode === "recovery" && bootstrapError && view !== "paid" && <p>Tu pedido fue creado, pero no pudimos iniciar Mercado Pago.</p>}
      <p>{accessError ? "No tenemos el token seguro de este pedido en esta pestaña. Contactá a Conexus para continuar; no buscaremos información usando solo el número." : copy.text}</p>
      {view === "paid" && number && <p>Tu pedido {number} fue pagado correctamente.</p>}
      {code && !accessError && view !== "paid" && <p className={styles.error}>{paymentErrorMessage(code)}</p>}
      {payment.timedOut && view === "pending" && <p>El pago todavía se está procesando. Podés volver a consultar en unos instantes.</p>}
      {payment.cooldown > 0 && <p>Esperá unos instantes para respetar el límite de consultas del servicio.</p>}
    </div>
    {receipt && <p className={styles.confirmationTotal}>Total del pedido: <strong>{formatMoney(receipt.total, receipt.currency)}</strong></p>}
    <div className={styles.paymentActions}>
      {allowRetry && <button type="button" className="button button--primary" disabled={processing || payment.cooldown > 0} onClick={() => void retry()}>{processing ? "Preparando pago…" : view === "rejected" || mode === "error" ? "Intentar pagar nuevamente" : "Reintentar pago"}</button>}
      {!accessError && view !== "paid" && <button type="button" className="button button--secondary" disabled={processing || payment.cooldown > 0} onClick={() => { if (!["PAYMENT_REQUIRES_REVIEW", "ORDER_NOT_PAYABLE", "RESERVATION_INVALID"].includes(bootstrapError)) setBootstrapError(""); payment.refresh(); }}>Consultar nuevamente</button>}
      {view === "expired" && <Link className="button button--primary" href="/carrito" onClick={() => clearPaymentSession(payment.session?.orderNumber)}>Volver al carrito →</Link>}
      {(accessError || view === "review" || view === "refunded") && <Link className="button button--primary" href="/#contacto">Contactar a Conexus →</Link>}
      <Link className="button button--secondary" href="/productos">Volver a productos →</Link>
    </div>
    <p className={styles.note}>El estado del pago se verifica exclusivamente con Conexus CMS. Nunca confirmamos un pago por los parámetros de retorno.</p>
  </div>;
}
