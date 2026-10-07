export function checkoutMessage(code: string): string {
  if (/STOCK|UNAVAILABLE|NOT_FOUND/.test(code)) return "Uno o más productos ya no tienen stock suficiente. Revisá tu carrito para continuar.";
  if (/DISABLED|NOT_ENABLED/.test(code)) return "Las compras están deshabilitadas en este momento. Podés seguir explorando el catálogo.";
  if (/IDEMPOTENCY/.test(code)) return "No pudimos confirmar esta solicitud. Reintentá con los mismos datos; no inicies otra compra mientras esté pendiente.";
  if (code === "INVALID_CHECKOUT") return "Revisá los datos de contacto, las cantidades y la opción de entrega.";
  if (/CURRENCY|PRICE/.test(code)) return "El catálogo fue actualizado. Revisá tu carrito antes de continuar.";
  return "No pudimos confirmar la respuesta. Reintentá este mismo pedido para comprobar si fue registrado; no se creará otro por reintentar.";
}
