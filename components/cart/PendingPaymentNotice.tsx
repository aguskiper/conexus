import type { OrderReceipt } from "@/lib/cms/checkout-types";
import styles from "./Commerce.module.css";
// Punto de extensión V4.5: pedido creado no equivale a pedido pagado.
export function PendingPaymentNotice({ receipt }: { receipt: OrderReceipt }) {
  return <div className={styles.paymentNotice} data-order-status={receipt.status}><strong>Este pedido todavía no fue pagado.</strong><p>En esta etapa de prueba el pago se confirmará manualmente.</p></div>;
}
