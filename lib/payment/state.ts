import type { PublicOrderStatus } from "@/lib/cms/payment-types";
export type PaymentView = "confirming" | "paid" | "pending" | "rejected" | "expired" | "review" | "refunded";
export function paymentView(status: PublicOrderStatus): PaymentView {
  const order = status.orderStatus, payment = status.paymentStatus;
  if (order === "REQUIRES_REVIEW" || payment === "REQUIRES_REVIEW") return "review";
  if (order === "REFUNDED" || payment === "REFUNDED") return "refunded";
  if (["CANCELLED", "EXPIRED"].includes(order) || ["CANCELLED", "EXPIRED"].includes(payment || "")) return payment === "APPROVED" ? "review" : "expired";
  if (["PAID", "PROCESSING", "COMPLETED"].includes(order)) return payment === "APPROVED" ? "paid" : "review";
  if (order === "PENDING_PAYMENT" && payment === "REJECTED") return "rejected";
  return "pending";
}
export function canRetryPayment(status: PublicOrderStatus): boolean {
  return status.orderStatus === "PENDING_PAYMENT" && [null, "PENDING", "REJECTED"].includes(status.paymentStatus) && ["pending", "rejected"].includes(paymentView(status));
}
export function terminalPayment(status: PublicOrderStatus) { return ["paid", "rejected", "expired", "review", "refunded"].includes(paymentView(status)); }
export const paymentCopy: Record<PaymentView, { title: string; text: string; mark: string }> = {
  confirming: { title: "Estamos confirmando tu pago…", text: "Consultamos el estado real de tu pedido. El retorno de Mercado Pago no confirma por sí solo el pago.", mark: "↗" },
  paid: { title: "¡Pago confirmado!", text: "Tu pedido fue pagado correctamente.", mark: "✓" },
  pending: { title: "Tu pago está pendiente.", text: "Mercado Pago todavía está procesando el pago. Esta página se actualizará automáticamente cuando recibamos la confirmación.", mark: "◷" },
  rejected: { title: "El pago no pudo ser aprobado.", text: "Tu pedido sigue pendiente. Podés intentar pagar nuevamente usando el mismo pedido.", mark: "↻" },
  expired: { title: "Este pedido venció.", text: "Volvé al carrito para realizar una nueva compra. No iniciaremos otro cobro para este pedido.", mark: "◷" },
  review: { title: "Recibimos tu pago, pero necesitamos verificar el pedido.", text: "Contactá a Conexus para revisar el estado. No vuelvas a pagar: no iniciaremos otro cobro.", mark: "✦" },
  refunded: { title: "El proveedor informa una devolución.", text: "Contactá a Conexus para conocer los detalles. No iniciaremos otro cobro automáticamente.", mark: "↩" },
};
