# Etapa 4.25 — Carrito, checkout y pedidos sin pago

## Alcance y archivos
Se trabajó solamente en Conexus Digital. No se modificó código, esquema, configuración
ni administración de Conexus CMS. Se creó un pedido de prueba mediante su API pública.
No hay SDK de pago, credenciales, carrito remoto, base de datos ni cuentas de clientes.

Modificados:
- app/layout.tsx: proveedor persistente de carrito.
- app/productos/[slug]/page.tsx: compra según configuración pública y disponibilidad.
- components/Header.tsx: acceso al carrito y contador en desktop/mobile.
- lib/cms/client.ts: getCheckoutSettings/createOrder reutilizan la URL central.
- lib/cms/product-types.ts y product-normalize.ts: cantidad pública opcional.

Creados:
- app/(commerce)/layout.tsx, carrito/page.tsx, checkout/page.tsx,
  pedido/confirmado/page.tsx. El grupo no altera las URLs públicas.
- app/api/checkout/route.ts, cart/route.ts, orders/route.ts.
- components/cart/CartProvider.tsx, CartAccess.tsx, QuantityControl.tsx,
  AddToCart.tsx, useValidatedCart.ts, CartPage.tsx, CheckoutPage.tsx,
  OrderSummary.tsx, OrderConfirmation.tsx, PendingPaymentNotice.tsx,
  CommerceFrame.tsx, Commerce.module.css.
- lib/cart/model.ts, totals.ts, order-validation.ts, validated.ts, errors.ts,
  idempotency.ts, session.ts, http.ts.
- lib/cms/checkout-types.ts, checkout-normalize.ts.
- scripts/checkout.test.mjs y este documento.

## Arquitectura/persistencia
CartProvider se monta en el layout raíz y mantiene addItem, removeItem,
updateQuantity, clearCart, items y totalItems.
localStorage conexus-cart-v1 contiene exclusivamente [{slug,quantity}].
Se sanitizan datos leídos, cantidades enteras 1..99 y hasta 30 productos distintos.
No almacena precios, email, teléfono, nombres ni datos de contacto.
Primero se renderiza el estado SSR vacío y después se carga el almacenamiento;
no se leen APIs del navegador durante SSR. Cambios entre pestañas se sincronizan.
Si el navegador bloquea localStorage, el carrito funciona en memoria y se avisa.

Los precios previos se recuerdan solo en memoria para detectar cambios durante
la visita. Después de recargar siempre se muestran importes actuales, pero no
se puede comparar con un precio histórico que no guardamos.
Los cálculos orientativos se realizan con strings/BigInt, nunca Float.
El CMS sigue siendo la única autoridad monetaria y de stock.

## Validación y compra
/api/cart vuelve a consultar productos por slug y GET /api/public/v1/checkout.
No-store, sin snapshots persistentes. Devuelve solo información de UX, no la
descripción completa. Se actualiza al abrir carrito/checkout, cambiar la selección,
volver a la pestaña, reintentar y antes de confirmar un pedido.
Productos retirados, sin stock, moneda incompatible o cantidades públicas
insuficientes impiden continuar. Precio cambiado genera aviso y requiere revisar
el resumen antes del envío.

La API real observada entrega stock {managed,available}, sin unidades.
Se admite availableQuantity opcional si el CMS lo incorpora, pero no se inventan
cantidades. El CMS valida definitivamente stock/reservas.

GET /api/public/v1/checkout entrega enabled, currency, reservationMinutes y
methods [{method,label,instructions}]. Actualmente se implementa únicamente
el método pickup; su nombre e instrucciones nunca se hardcodean.
Si enabled=false desaparecen compra y acceso de header; /checkout muestra
estado amigable. Catálogo y Blog siguen independientes y públicos.
Si falla consultar configuración en la ficha, se omite la compra, no el producto.

## Creación del pedido
Navegador -> POST /api/orders de Digital -> createOrder -> API pública del CMS.
CONEXUS_CMS_URL permanece server-side. No hay credenciales ni URLs internas
en mensajes de error. El proxy valida JSON, tamaño, origen y campos permitidos.
Envía solamente customer {firstName,lastName,email,phone}, items {slug,quantity},
shipping {method:pickup} y notes opcional. Descarta price, salePrice, total,
subtotal, currency, stock e IDs enviados por un cliente manipulado.
El CMS calcula snapshots, reservas, total y PENDING_PAYMENT.
El carrito se vacía exclusivamente tras una respuesta exitosa válida.

## Idempotencia y errores
Una operación lógica usa crypto.randomUUID y una huella SHA-256 del payload
normalizado. En sessionStorage se guardan solo clave/huella, nunca el formulario.
El payload personal se conserva en memoria mientras está pendiente.
La clave se reenvía intacta en Idempotency-Key al CMS.
Doble submit se bloquea con ref inmediata y botón deshabilitado.
Ante fallo de red/timeout/5xx/429 se congela la solicitud y se reintenta con
la misma clave y payload. No se asume que una falta de respuesta equivale a
pedido no creado. Los errores de stock/validación definitivos permiten corregir
y comenzar un nuevo intento. Una compra posterior exitosa usa otra clave.

Si se recarga durante una respuesta incierta, habrá que volver a introducir
exactamente los mismos datos, selección y notas para recuperar la misma operación.
Un payload distinto se bloquea mientras exista una huella pendiente.
La recuperación de esa solicitud reutiliza la clave antes de validar una compra
nueva: una reserva propia o un cambio de precio no pueden provocar duplicados.
Si sessionStorage está bloqueado, clave/huella usan un fallback en memoria;
no sobreviven a recarga en ese caso. No se crean automáticamente claves nuevas
al reintentar dentro de la misma visita.

## Confirmación y V4.5
/pedido/confirmado no expone datos del comprador en query params.
Solo muestra orderNumber, estado PENDING_PAYMENT y total/currency del CMS.
El comprobante público se conserva en contexto y sessionStorage por pestaña.
No se marca PAID. PendingPaymentNotice es el punto de extensión visual para
V4.5, después de crear el pedido y antes del pago.
Mercado Pago necesitará un contrato server-side de pago ligado al pedido,
confirmación autoritativa mediante webhook y estados adicionales. Nunca usar
el total del carrito ni un redirect del navegador para declarar un pedido pagado.

## Verificación
Build, TypeScript, ESLint y pruebas de Blog/productos/diagnóstico/checkout.
Pruebas nuevas: carrito/limites/persistencia saneada, totales, campos requeridos,
payload permitido, configuración, idempotencia, almacenamiento bloqueado,
proxy/origen, stock/red, actualización/publicación, doble submit, retry congelado,
éxito/limpieza, cambios de precio, vacío, contador y compra deshabilitada.
Son pruebas de lógica/componentes/HTTP; no sustituyen una prueba visual en Chrome.
No se abrió navegador, vista previa ni Computer Use.

Prueba real:
- 2 unidades de fernet-750ml con datos ficticios y nota explícita de prueba.
- Respuesta 201: CX-000001, PENDING_PAYMENT, total 19000.00 ARS.
- Se repitió en paralelo dos veces desde /api/orders con la misma clave:
  ambas respuestas conservaron CX-000001 y el mismo total.
- No se crearon pedidos adicionales para ensayar fallos.
- Home, Blog, ficha, carrito, checkout y confirmación respondieron HTTP 200.
- Filtros, búsqueda, SEO, imágenes y 404 continúan verificados por pruebas/HTTP.

La reserva pública dura 15 minutos según configuración actual.
No se pudo comprobar stock físico 10 -> reserva disponible 8 -> cancelar 10
ni PAID -> físico 8 porque la API pública no expone unidades/reservas físicas.
No se canceló ni marcó PAID ningún pedido desde el CMS.

## Prueba manual pendiente
Abrí http://localhost:3000/productos en Chrome:
producto -> agregar -> carrito -> checkout -> completar datos -> confirmar.
Anotá CX-XXXXXX y buscá exactamente ese número en el panel del CMS.
Revisá desktop/tablet/mobile, recarga del carrito, miniaturas, teclado y errores.
Desde el CMS comprobá manualmente stock/reservas, cancelación y PAID; un pedido
de prueba puede expirar antes por el plazo configurado.
Apagá e-commerce desde CMS y recargá: catálogo/Blog permanecen, compra desaparece.
No se cambió esa configuración durante estas pruebas.

## Entorno y producción
No se requieren variables nuevas. CONEXUS_CMS_URL y CONEXUS_SITE_URL conservan
su configuración existente. En producción: CMS HTTPS accesible desde servidor,
media pública HTTPS, revisar límites/antibot del checkout público y expiración
de reservas. Todas las rutas comerciales llevan robots noindex.
