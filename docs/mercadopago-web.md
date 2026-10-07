# Conexus Digital — Etapa 4.55

Integración visual con Checkout Pro. Se leyó el contrato real de
`CONEXUS CMS/docs/mercadopago-web-integration.md`. No se modificó CMS,
no se instalaron dependencias y no se crearon pedidos/pagos reales durante la implementación.

## Configuración

Digital conserva `CONEXUS_CMS_URL=http://localhost:3001` server-side.
No necesita Public Key, Access Token, secreto de webhook ni variables nuevas.
La configuración pública se obtiene mediante `GET /api/public/v1/checkout`:
`payment.enabled`, `payment.provider`, `payment.label`, junto con `enabled` y `currency`.
Mercado Pago se ofrece únicamente con e-commerce activo, proveedor `mercadopago`,
pagos habilitados y moneda ARS, según el contrato argentino del CMS.

Las llamadas del navegador usan proxies del mismo origen de Digital. Estos reutilizan
`lib/cms/client.ts` y `CONEXUS_CMS_URL`. No envían cookies de administrador.
Todos los requests/respuestas de pedidos, pagos y estados son `no-store`.
Las páginas de retorno son dinámicas y tienen metadata `noindex`.

## Checkout y creación de pago

1. Se validan los datos y se revalida el carrito como en V4.25.
2. `POST /api/orders` → CMS `POST /api/public/v1/orders`. Se mantiene la clave
   idempotente estable del checkout; no se envían precios, moneda ni stock como autoridad.
3. El CMS devuelve `orderNumber`, `publicStatusToken`, `status`, `total`, `currency`.
4. Se guarda la sesión de pago **antes** de iniciar Mercado Pago. Se verifica que
   sessionStorage funcione antes de crear un pedido con pago habilitado.
5. Se consulta el estado público para no cobrar un pedido pagado, vencido o en revisión.
6. `POST /api/orders/{orderNumber}/payment` → CMS mismo endpoint público, con
   `Authorization: Bearer <publicStatusToken>`, una **segunda UUID** independiente
   para el intento de pago y cuerpo `{}`.
7. Se valida `checkoutUrl` y se llama a `window.location.assign(checkoutUrl)`.
   Se conserva la URL entregada; no se reconstruye ni se abre un popup.

La URL debe ser HTTPS, sin credenciales/puerto alternativo, del dominio argentino
de Mercado Pago permitido en `lib/cms/payment-normalize.ts`, y una ruta `/checkout/`.
Si el CMS incorpora otro dominio legítimo en el futuro, se debe ampliar esta allowlist.

Los botones tienen bloqueo sincrónico contra doble clic y estados de procesamiento.
El CMS sigue siendo la autoridad de idempotencia, reservas, importes y pagos.

## Recuperación y almacenamiento

`lib/payment/session.ts` centraliza `savePaymentSession`, `getPaymentSession`,
`clearPaymentSession` y la detección segura de almacenamiento.
La clave `conexus-payment-session-v1` conserva hasta cinco sesiones de esta pestaña:

- orderNumber y publicStatusToken;
- UUID del intento de pago y marca de reintento rechazado ambiguo;
- snapshot mínimo de slugs/cantidades para limpiar solo lo comprado;
- fecha, marca de carrito ya conciliado y modalidad de pago.

No conserva datos del comprador, email, teléfono, dirección, precios, IDs privados
ni credenciales. El token no aparece en query strings, logs, HTML, localStorage
ni el comprobante auxiliar `conexus-last-order-v1`. No se usa ninguna herramienta de analytics.
La sesión se pierde al cerrar la pestaña; sin token se ofrece contacto y nunca se consulta
solo por el número de pedido. No existe recuperación pública por enumeración.

Si falla Payment después de crear Order, se mantiene el pedido, el carrito y su sesión.
El checkout muestra el número y permite reintentar el **mismo** pedido.
Recargar/volver al checkout recupera esa sesión, en lugar de crear otro Order.
Si no se pudo conservar el token, se mantiene la clave original del Order para
recuperar el mismo checkout idempotente; no se inventa autenticación.

## Reintentos

`lib/payment/client.ts` comparte la consulta y `retryPayment` entre checkout y retornos.
Siempre consulta primero el estado del CMS. No crea Orders.

- Timeout/503/reintento de red: misma UUID Payment.
- REJECTED verificado + Order PENDING_PAYMENT: se permite una nueva UUID explícita,
  manteniendo el mismo Order. Si se pierde la respuesta de este nuevo intento, la marca
  `rejectedRetryPending` conserva esa UUID para el siguiente retry.
- PAID/APPROVED, APPROVED con Order aún pendiente, REQUIRES_REVIEW,
  REFUNDED, CANCELLED/EXPIRED: no se inicia otro pago.
- Los errores de reserva/Order no pagable muestran una explicación y regreso al carrito.
- 404/token inválido muestra una vía de contacto, sin buscar datos privados.
- 429 respeta Retry-After; los botones quedan temporalmente bloqueados.

El CMS valida definitivamente la reserva y si puede reutilizar un Payment pendiente.
No se fuerza el precio anterior ni se confirma PAID desde Digital.

## Retornos y polling

Las rutas `/pedido/pago/exito`, `/pedido/pago/pendiente` y `/pedido/pago/error`
comparten `PaymentReturnPage`/`PaymentStatusPanel`/`usePaymentStatus`.
Solo leen el parámetro `orderNumber` para encontrar la sesión exacta de esta pestaña.
Ignoran `status=approved`, `payment_id`, `collection_status`, importes y tokens en query.

Inicialmente se informa que se está confirmando el pago (la ruta error conserva un
encabezado de error hasta la primera consulta). Se consulta inmediatamente:
`GET /api/orders/{orderNumber}/status` → CMS con Bearer token.
La respuesta se reduce a `orderNumber`, `orderStatus`, `paymentStatus`.

- Order PAID/PROCESSING/COMPLETED + Payment APPROVED: “¡Pago confirmado!”.
- Pendiente: se espera confirmación, sin declarar rechazo por demora.
- REJECTED con pedido pendiente: retry explícito, no automático.
- REQUIRES_REVIEW: mensaje de revisión y contacto; nunca otro cobro.
- Pedido/Payment vencido o cancelado: volver al carrito; no otro pago de ese pedido.
- REFUNDED: contacto para consultar la devolución.

Polling cada **3 segundos, máximo 45 segundos**, suspendido cuando la pestaña está oculta.
Se detiene ante estado terminal, token inválido, desmontaje o límite de tiempo.
Tiene cancelación, timeout HTTP y una fecha límite también para un request que se estanque.
Respeta Retry-After. Al agotar el plazo ofrece “Consultar nuevamente”, sin polling infinito.

**Diferencia intencional con la documentación:** el CMS recomienda 60–90 segundos;
se usaron 45 segundos porque la solicitud de esta etapa pide aproximadamente 30–45.
Los nombres de endpoints, propiedades, Bearer token y UUID respetan el contrato leído.

## Carrito y fallback

Con Mercado Pago habilitado, crear Order o redirigir **no vacía el carrito**.
Solo la confirmación autoritativa PAID + APPROVED lo concilia.
`lib/payment/cart.ts` resta las cantidades del pedido de su snapshot, preservando
productos/cantidades añadidos después. Si no queda nada, `clearCart()` lo vacía.
Una marca de sesión evita repetir la limpieza al recargar la confirmación.

Si Mercado Pago está apagado, se mantiene el flujo V4.25: Confirmar pedido,
vaciar carrito tras creación exitosa y `/pedido/confirmado` con aviso de pago pendiente.
Si el Order incluye un token, también se conserva en la utilidad central de sessionStorage,
sin iniciar pagos ni impedir el fallback si ese almacenamiento está bloqueado.
El catálogo continúa independiente de la compra. Una sesión MP previa conserva su
consulta de estado aunque el proveedor se apague; no muestra un botón para pagar.

## Diseño y accesibilidad

Se reutilizan CommerceFrame, Commerce.module.css, botones y componentes existentes.
Solo se agregan estilos pequeños de acciones de pago, texto largo y focus.
No se modifican Home, Blog, catálogo, header ni secciones de marca.
Las acciones se apilan en mobile; checkout conserva columnas desktop/tablet/mobile.
Se usa aria-live, estados de botón, foco en encabezado al cambiar el resultado,
labels existentes y estilos compatibles con prefers-reduced-motion.

## Verificación automatizada

`scripts/payment.test.mjs` agrega pruebas con HTTP/sessionStorage simulados:
flujo Order → token → Payment → redirect, cuerpo vacío, doble clic, claves independientes,
timeout/idempotencia, retry rechazado ambiguo, recuperación del pedido, storage bloqueado,
token inválido, validación de checkoutUrl, proxies seguros/no-store, status aprobado falso,
polling acotado/oculto/429/CMS caído, revisión/vencimiento, limpieza del carrito una vez,
preservación de nuevas cantidades y fallback sin proveedor. Se mantienen los tests previos
de Blog, Productos, carrito/checkout y diagnóstico.

Comandos:

```text
node --test scripts/checkout.test.mjs scripts/cms.test.mjs scripts/products.test.mjs scripts/diagnostic.test.mjs scripts/payment.test.mjs
npx tsc --noEmit --incremental false
npm run lint
npm run build
```

Resultado: 84 tests correctos (28 nuevos de pagos + 56 anteriores), TypeScript,
ESLint y build correctos. Verificación HTTP de solo lectura: Home, Blog, Productos,
Carrito, Checkout, confirmación y los tres retornos responden 200, aun con CMS caído.
En el retorno de éxito con `status=approved`, el HTML inicial no declara pago confirmado.

No se ejecutó una compra ni un pago real. El CMS en localhost:3001 no estaba disponible
durante esta implementación. El funcionamiento del proveedor, webhook y cambio de stock
debe verificarse con la compra TEST manual siguiente. Responsive se comprobó por estructura
y reglas CSS; no se abrió navegador ni se realizó una inspección visual automatizada.

## Primera compra TEST manual

1. Iniciar CMS en puerto 3001 y Digital en 3000 (`npm run dev`).
   Verificar que Digital tenga CONEXUS_CMS_URL y que CMS autorice su origen público.
2. En CMS, confirmar e-commerce y Mercado Pago TEST activos, moneda ARS y retiro habilitado.
   No usar credenciales de producción. No son necesarias credenciales de MP en Digital.
3. Confirmar en CMS las URLs de retorno: origen de Digital + `/pedido/pago/exito`,
   `/pedido/pago/pendiente`, `/pedido/pago/error`.
4. Para webhook, usar el endpoint público HTTPS/túnel TEST del CMS ya preparado para V4.5.
   El proveedor no puede enviar notificaciones a localhost privado. No modificar el frontend
   para recibir/verificar webhooks. Si la prueba usa un origen/túnel diferente para Digital,
   comenzar y volver al mismo origen y pestaña para conservar sessionStorage.
5. Abrir en Chrome `http://localhost:3000/productos`, abrir Fernet, agregar cantidad 2.
6. Abrir carrito, finalizar compra y completar datos TEST. Presionar “Pagar con Mercado Pago”.
7. Digital registra CX-XXXXXX e inicia Payment; debe redirigir a Checkout Pro en esa pestaña.
   Completar el pago con comprador/medio de pago TEST según la configuración de CMS.
8. Volver a Digital: esperar “¡Pago confirmado!” solo tras PAID + APPROVED del CMS.
   Verificar que el carrito comprado quede vacío.
9. En `http://localhost:3001/admin/orders`, buscar ese mismo número, verificar un único
   Order y Payment, estado PAID, eventos/webhook y reducción física de stock en 2 unidades.
10. Probar también pendiente/rechazado/fallo al iniciar Payment: carrito conservado,
    retry mismo CX, expiración sin otro cobro y REQUIRES_REVIEW sin retry.
11. Deshabilitar Mercado Pago desde CMS y probar el fallback sin pago automático.

La web no da por pagado un pedido únicamente porque se vuelva a la URL de éxito.

## Archivos de esta etapa

Modificados: `components/cart/CartProvider.tsx`, `CheckoutPage.tsx`, `OrderConfirmation.tsx`,
`OrderSummary.tsx`, `Commerce.module.css`; `lib/cms/client.ts`, `checkout-types.ts`,
`checkout-normalize.ts`.

Nuevos: `lib/cms/payment-types.ts`, `payment-normalize.ts`;
`lib/payment/{session,client,proxy,errors,state,poll,cart}.ts`;
`components/payment/{usePaymentStatus,PaymentStatusPanel,PaymentReturnPage}.tsx` (el hook es `.ts`);
`app/api/orders/[orderNumber]/{payment,status}/route.ts`;
`app/(commerce)/pedido/pago/{exito,pendiente,error}/page.tsx`;
`scripts/payment.test.mjs`; este documento.

Para producción, cambiar únicamente CONEXUS_CMS_URL y las URLs/orígenes públicos correspondientes
del CMS, verificar HTTPS/webhook TEST→producción en CMS, y mantener las credenciales fuera de Digital.
