export class PaymentError extends Error {
  constructor(public readonly code: string, public readonly retryAfter = 0) { super("Payment request failed"); }
}
export function paymentErrorMessage(code: string): string {
  if (code === "NOT_FOUND" || code === "TOKEN_UNAVAILABLE") return "No pudimos recuperar el acceso seguro a este pedido. Contactá a Conexus; el número de pedido por sí solo no permite consultarlo.";
  if (code === "SESSION_UNAVAILABLE") return "Necesitamos sessionStorage habilitado en esta pestaña para recuperar tu pedido al volver de Mercado Pago. Habilitalo y reintentá el pago.";
  if (code === "PAYMENT_REQUIRES_REVIEW") return "Recibimos tu pago, pero necesitamos verificar el pedido. No vuelvas a pagar.";
  if (code === "RESERVATION_INVALID" || code === "ORDER_NOT_PAYABLE") return "Este pedido no admite un nuevo pago. Consultá su estado antes de continuar.";
  if (code === "PAYMENT_ATTEMPT_CLOSED") return "Este intento terminó. Consultá el estado del pedido para saber si podés reintentar.";
  if (code === "PAYMENTS_UNAVAILABLE") return "Mercado Pago está deshabilitado o no está disponible. Tu pedido sigue registrado; podés consultar su estado.";
  if (code === "RATE_LIMITED") return "Estamos recibiendo muchas consultas. Esperá unos instantes antes de reintentar.";
  if (code === "UNSAFE_CHECKOUT_URL") return "No recibimos un enlace de pago válido. Conservamos tu pedido para que puedas reintentar.";
  return "No pudimos comunicarnos con el servicio de pagos. Tu pedido se conserva; reintentá usando el mismo pedido.";
}
