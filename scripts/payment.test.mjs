import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";

// Ejecuta los módulos reales con HTTP/storage simulados; no crea pedidos ni pagos.
const nativeRequire = createRequire(import.meta.url), modules = new Map(), overrides = new Map();
function load(relative) {
  const filename = path.resolve(relative);
  if (overrides.has(filename)) return overrides.get(filename);
  if (modules.has(filename)) return modules.get(filename).exports;
  const loaded = { exports: {} }; modules.set(filename, loaded);
  const code = ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const requireLocal = name => {
    if (overrides.has(name)) return overrides.get(name);
    if (name === "server-only") return {};
    if (name.endsWith(".css")) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (name.startsWith(".") || name.startsWith("@/")) {
      const base = name.startsWith("@/") ? path.resolve(name.slice(2)) : path.resolve(path.dirname(filename), name);
      return load([base, base + ".ts", base + ".tsx"].find(file => existsSync(file)));
    }
    return nativeRequire(name);
  };
  new Function("require", "module", "exports", code)(requireLocal, loaded, loaded.exports);
  return loaded.exports;
}
function memoryStorage() { const map = new Map(); return { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) }; }
const token = "T".repeat(43), key = "5f0b7c0a-3412-41e0-aace-fd17ff429b50";
const settings = { enabled: true, currency: "ARS", reservationMinutes: 15, methods: [{ method: "pickup", label: "Retiro", instructions: "" }], payment: { enabled: true, provider: "mercadopago", label: "Mercado Pago" } };
const receipt = { orderNumber: "CX-000123", status: "PENDING_PAYMENT", total: "19000.00", currency: "ARS", publicStatusToken: token };
const session = () => ({ orderNumber: receipt.orderNumber, publicStatusToken: token, paymentAttemptKey: key, cart: [{ slug: "producto", quantity: 2 }], createdAt: Date.now(), cartCleared: false, rejectedRetryPending: false, requiresPayment: true });
const pending = { orderNumber: receipt.orderNumber, orderStatus: "PENDING_PAYMENT", paymentStatus: "PENDING" };
const paid = { ...pending, orderStatus: "PAID", paymentStatus: "APPROVED" };
const checkout = { checkoutUrl: "https://www.mercadopago.com.ar/checkout/v1/redirect?order_id=ORDTST123", provider: "mercadopago", expiresAt: "2026-10-07T20:00:00.000Z" };
const product = { name: "Producto", slug: "producto", shortDescription: "Descripción", price: "14000.00", salePrice: "9500.00", currency: "ARS", stock: { managed: true, available: true, availableQuantity: 10 }, showPrices: true, featuredImage: null, category: null, publishedAt: "2026-01-01T12:00:00Z", description: { type: "doc", content: [] }, gallery: [], seo: {} };
async function browser(run) {
  const originals = { fetch: globalThis.fetch, window: globalThis.window, sessionStorage: globalThis.sessionStorage, FormData: globalThis.FormData, requestAnimationFrame: globalThis.requestAnimationFrame };
  const storage = memoryStorage(), redirects = [];
  globalThis.window = { sessionStorage: storage, location: { assign: url => redirects.push(url) } };
  globalThis.sessionStorage = storage;
  try { await run({ storage, redirects }); }
  finally { for (const [name, value] of Object.entries(originals)) { if (value === undefined) delete globalThis[name]; else globalThis[name] = value; } overrides.clear(); modules.clear(); }
}

test("contrato V4.5: configuración pública, ARS y fallback V4.25", () => {
  const { parseCheckoutSettings, parseOrderReceipt } = load("lib/cms/checkout-normalize.ts");
  const { mercadoPagoEnabled } = load("lib/cms/payment-types.ts");
  assert.deepEqual(parseCheckoutSettings({ data: settings }), settings);
  assert.equal(mercadoPagoEnabled(settings), true);
  for (const off of [null, { ...settings, enabled: false }, { ...settings, currency: "USD" }, { ...settings, payment: { ...settings.payment, enabled: false } }, { ...settings, payment: undefined }]) assert.equal(mercadoPagoEnabled(off), false);
  assert.equal(parseOrderReceipt({ data: receipt }).publicStatusToken, token);
  assert.throws(() => parseOrderReceipt({ data: { ...receipt, publicStatusToken: "invalid" } }));
});
test("checkoutUrl segura: HTTPS y host exacto del proveedor, sin reconstruir URL", () => {
  const { safeCheckoutUrl, parsePaymentCheckout } = load("lib/cms/payment-normalize.ts");
  assert.equal(parsePaymentCheckout({ data: checkout }).checkoutUrl, checkout.checkoutUrl);
  for (const url of ["javascript:alert(1)", "http://www.mercadopago.com.ar/checkout/a", "https://www.mercadopago.com.ar.evil.test/checkout/a", "https://evil.test/checkout/a", "https://www.mercadopago.com.ar:444/checkout/a", "https://user:secret@www.mercadopago.com.ar/checkout/a"]) assert.equal(safeCheckoutUrl(url), null);
});
test("payment session conserva token solo en sessionStorage y descarta PII/precios", async () => browser(({ storage }) => {
  const { savePaymentSession, getPaymentSession, clearPaymentSession, PAYMENT_SESSION_KEY } = load("lib/payment/session.ts");
  assert.equal(savePaymentSession({ ...session(), email: "PRIVATE", accessToken: "SECRET", cart: [{ slug: "producto", quantity: 2, price: "1" }] }), true);
  const raw = storage.getItem(PAYMENT_SESSION_KEY);
  assert.ok(raw.includes(token)); assert.ok(!raw.includes("PRIVATE")); assert.ok(!raw.includes("SECRET")); assert.ok(!raw.includes("price"));
  assert.deepEqual(getPaymentSession().cart, [{ slug: "producto", quantity: 2 }]);
  assert.equal(getPaymentSession("CX-OTHER"), null);
  assert.equal(getPaymentSession(""), null);
  clearPaymentSession(receipt.orderNumber); assert.equal(getPaymentSession(), null);
  storage.setItem(PAYMENT_SESSION_KEY, "malformed"); assert.equal(getPaymentSession(), null);
}));
test("storage bloqueado no se reemplaza por localStorage ni pierde protección", async () => browser(() => {
  Object.defineProperty(globalThis.window, "sessionStorage", { get() { throw new Error("blocked"); } });
  const { savePaymentSession, getPaymentSession, canStorePaymentSession } = load("lib/payment/session.ts");
  assert.equal(canStorePaymentSession(), false); assert.equal(savePaymentSession(session()), false); assert.equal(getPaymentSession(), null);
}));
test("retry consulta estado real, usa Bearer/UUID, cuerpo vacío y redirect checkoutUrl", async () => browser(async ({ redirects }) => {
  const { savePaymentSession } = load("lib/payment/session.ts"), { retryPayment } = load("lib/payment/client.ts");
  savePaymentSession(session()); const calls = [];
  globalThis.fetch = async (url, options) => { calls.push({ url, options }); return Response.json({ data: url.endsWith("/status") ? pending : checkout }); };
  assert.equal((await retryPayment(session())).redirected, true);
  assert.equal(calls.length, 2); assert.ok(calls.every(call => !call.url.includes(token)));
  assert.equal(calls[0].options.headers.Authorization, "Bearer " + token);
  assert.equal(calls[1].options.headers["Idempotency-Key"], key);
  assert.deepEqual(JSON.parse(calls[1].options.body), {});
  assert.deepEqual(redirects, [checkout.checkoutUrl]);
}));
test("timeout/503 reusa la misma clave Payment y el mismo Order", async () => browser(async () => {
  const { savePaymentSession, getPaymentSession } = load("lib/payment/session.ts"), { retryPayment } = load("lib/payment/client.ts");
  savePaymentSession(session()); const keys = []; let count = 0;
  globalThis.fetch = async (url, options) => {
    if (url.endsWith("/status")) return Response.json({ data: pending });
    keys.push(options.headers["Idempotency-Key"]); if (++count === 1) throw new Error("network timeout");
    return Response.json({ error: { code: "PROVIDER_UNAVAILABLE", message: "PRIVATE" } }, { status: 503 });
  };
  await assert.rejects(retryPayment(session())); await assert.rejects(retryPayment(getPaymentSession()));
  assert.deepEqual(keys, [key, key]); assert.equal(getPaymentSession().orderNumber, receipt.orderNumber);
}));
test("rechazo verificado permite intento nuevo, pero retry ambiguo no vuelve a rotar UUID", async () => browser(async () => {
  const { savePaymentSession, getPaymentSession } = load("lib/payment/session.ts"), { retryPayment } = load("lib/payment/client.ts");
  savePaymentSession(session()); const keys = [];
  globalThis.fetch = async (url, options) => {
    if (url.endsWith("/status")) return Response.json({ data: { ...pending, paymentStatus: "REJECTED" } });
    keys.push(options.headers["Idempotency-Key"]); throw new Error("response lost");
  };
  await assert.rejects(retryPayment(session())); await assert.rejects(retryPayment(getPaymentSession()));
  assert.notEqual(keys[0], key); assert.equal(keys[0], keys[1]); assert.equal(getPaymentSession().rejectedRetryPending, true);
}));
test("PAID, revisión, expiración y aprobación en proceso nunca inician otro cobro", async () => browser(async () => {
  const { savePaymentSession } = load("lib/payment/session.ts"), { retryPayment } = load("lib/payment/client.ts");
  savePaymentSession(session());
  for (const status of [paid, { ...pending, orderStatus: "REQUIRES_REVIEW" }, { ...pending, paymentStatus: "REQUIRES_REVIEW" }, { ...pending, orderStatus: "EXPIRED" }, { ...pending, paymentStatus: "CANCELLED" }, { ...pending, paymentStatus: "APPROVED" }]) {
    let calls = 0; globalThis.fetch = async url => { calls++; assert.ok(url.endsWith("/status")); return Response.json({ data: status }); };
    assert.equal((await retryPayment(session())).redirected, false); assert.equal(calls, 1);
  }
}));
test("token inválido y 404 no se consultan por número, no redirigen ni crean Payment", async () => browser(async ({ redirects }) => {
  const { retryPayment } = load("lib/payment/client.ts"); let calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json({ error: { code: "NOT_FOUND" } }, { status: 404 }); };
  await assert.rejects(retryPayment({ ...session(), publicStatusToken: "invalid" }), error => error.code === "NOT_FOUND"); assert.equal(calls, 0);
  await assert.rejects(retryPayment(session()), error => error.code === "NOT_FOUND"); assert.equal(calls, 1); assert.equal(redirects.length, 0);
}));
test("códigos de error públicos tienen mensajes amigables sin datos internos", () => {
  const { paymentErrorMessage } = load("lib/payment/errors.ts");
  for (const code of ["NOT_FOUND", "RESERVATION_INVALID", "ORDER_NOT_PAYABLE", "PAYMENTS_UNAVAILABLE", "PROVIDER_UNAVAILABLE", "PAYMENT_ATTEMPT_CLOSED", "PAYMENT_REQUIRES_REVIEW", "RATE_LIMITED", "UNKNOWN_PRIVATE_STACK"]) {
    const message = paymentErrorMessage(code); assert.ok(message.length > 15); assert.ok(!message.includes(code)); assert.ok(!message.includes("localhost"));
  }
});
test("proxy Payment respeta contrato real: body {}, Bearer, UUID y no-store", async () => {
  const original = globalThis.fetch, base = process.env.CONEXUS_CMS_URL;
  process.env.CONEXUS_CMS_URL = "http://cms.example.test";
  try {
    const { POST } = load("app/api/orders/[orderNumber]/payment/route.ts"); const calls = [];
    globalThis.fetch = async (url, options) => { calls.push({ url, options }); return Response.json({ data: checkout }); };
    const request = body => new Request("http://digital.test/api/orders/CX-000123/payment", { method: "POST", headers: { Authorization: "Bearer " + token, "Idempotency-Key": key, "Content-Type": "application/json", Origin: "http://digital.test" }, body: JSON.stringify(body) });
    const context = { params: Promise.resolve({ orderNumber: receipt.orderNumber }) };
    const result = await POST(request({}), context); assert.equal(result.status, 200);
    assert.equal(result.headers.get("Cache-Control"), "no-store"); assert.deepEqual((await result.json()).data, checkout);
    assert.equal(calls[0].url.pathname, "/api/public/v1/orders/CX-000123/payment"); assert.equal(calls[0].options.headers.Authorization, "Bearer " + token);
    assert.equal(calls[0].options.headers["Idempotency-Key"], key); assert.equal(calls[0].options.body, "{}"); assert.equal(calls[0].options.credentials, "omit");
    assert.equal((await POST(request({ amount: "1", currency: "ARS" }), context)).status, 400); assert.equal(calls.length, 1);
    const foreign = new Request("http://digital.test/api/orders/CX-000123/payment", { method: "POST", headers: { Origin: "https://evil.test" } }); assert.equal((await POST(foreign, context)).status, 403);
  } finally { globalThis.fetch = original; if (base === undefined) delete process.env.CONEXUS_CMS_URL; else process.env.CONEXUS_CMS_URL = base; }
});
test("proxy status usa token en header, descarta PII y parámetros approved", async () => {
  const original = globalThis.fetch, base = process.env.CONEXUS_CMS_URL; process.env.CONEXUS_CMS_URL = "http://cms.example.test";
  try {
    const { GET } = load("app/api/orders/[orderNumber]/status/route.ts"); let calls = 0;
    globalThis.fetch = async (url, options) => { calls++; assert.equal(url.search, ""); assert.equal(options.cache, "no-store"); return Response.json({ data: { ...pending, customer: { email: "PRIVATE" }, total: "0", id: "SECRET" } }); };
    const context = { params: Promise.resolve({ orderNumber: receipt.orderNumber }) };
    const result = await GET(new Request("http://digital.test/api/orders/CX-000123/status?status=approved", { headers: { Authorization: "Bearer " + token } }), context);
    assert.deepEqual((await result.json()).data, pending); assert.equal(calls, 1);
    assert.equal((await GET(new Request("http://digital.test/api/orders/CX-000123/status?token=" + token), context)).status, 404); assert.equal(calls, 1);
    globalThis.fetch = async () => Response.json({ error: { code: "RATE_LIMITED", message: "PRIVATE" } }, { status: 429, headers: { "Retry-After": "9" } });
    const limited = await GET(new Request("http://digital.test/api/orders/CX-000123/status", { headers: { Authorization: "Bearer " + token } }), context);
    assert.equal(limited.status, 429); assert.equal(limited.headers.get("Retry-After"), "9"); assert.deepEqual(await limited.json(), { error: { code: "RATE_LIMITED" } });
    globalThis.fetch = async () => { throw new Error("SECRET STACK"); };
    assert.equal((await GET(new Request("http://digital.test/api/orders/CX-000123/status", { headers: { Authorization: "Bearer " + token } }), context)).status, 503);
  } finally { globalThis.fetch = original; if (base === undefined) delete process.env.CONEXUS_CMS_URL; else process.env.CONEXUS_CMS_URL = base; }
});
async function polling(sequence, extras = {}) {
  const { pollPayment } = load("lib/payment/poll.ts");
  let now = 0, calls = 0, timeouts = 0; const statuses = [], errors = [], delays = [], controller = new AbortController();
  await pollPayment({ signal: controller.signal, now: () => now, wait: async delay => { delays.push(delay); now += delay; },
    fetchStatus: async () => { const value = sequence[Math.min(calls++, sequence.length - 1)]; if (value instanceof Error) throw value; return value; },
    onStatus: value => statuses.push(value), onError: value => errors.push(value), onTimeout: () => timeouts++, ...extras });
  return { calls, now, timeouts, statuses, errors, delays };
}
test("polling confirma PAID consultando CMS y se detiene en terminal", async () => {
  const result = await polling([pending, paid]); assert.equal(result.calls, 2); assert.deepEqual(result.delays, [3000]); assert.equal(result.timeouts, 0); assert.deepEqual(result.statuses.at(-1), paid);
});
test("polling pendiente es acotado a 45 segundos, nunca declara pago o rechazo", async () => {
  const result = await polling([pending]); assert.equal(result.now, 45000); assert.equal(result.calls, 15); assert.equal(result.timeouts, 1); assert.ok(result.statuses.every(value => value.orderStatus === "PENDING_PAYMENT"));
});
test("polling respeta Retry-After, oculta pestaña y no insiste con token inválido", async () => {
  const { PaymentError } = load("lib/payment/errors.ts");
  const limited = await polling([new PaymentError("RATE_LIMITED", 9), paid]); assert.equal(limited.delays[0], 9000);
  const hidden = await polling([paid], { visible: () => false }); assert.equal(hidden.calls, 0); assert.equal(hidden.timeouts, 1);
  const invalid = await polling([new PaymentError("NOT_FOUND")]); assert.equal(invalid.calls, 1); assert.equal(invalid.timeouts, 0);
  const controller = new AbortController(); controller.abort(); assert.equal((await polling([paid], { signal: controller.signal })).calls, 0);
});
test("polling CMS caído muestra error controlado y finaliza", async () => {
  const result = await polling([new Error("PRIVATE STACK")]); assert.equal(result.timeouts, 1); assert.ok(result.errors.every(value => value.code === "CMS_UNAVAILABLE"));
});
test("carrito solo se vacía con PAID + APPROVED, nunca pending/rejected/review/redirect", async () => browser(() => {
  const { savePaymentSession, getPaymentSession } = load("lib/payment/session.ts"), { settlePaidCart } = load("lib/payment/cart.ts");
  const value = session(); savePaymentSession(value); let cleared = 0;
  const cart = { ready: true, items: value.cart, clearCart: () => cleared++, removeItem() {}, updateQuantity() {} };
  for (const status of [pending, { ...pending, paymentStatus: "APPROVED" }, { ...pending, paymentStatus: "REJECTED" }, { ...paid, orderStatus: "REQUIRES_REVIEW" }, { ...paid, orderNumber: "CX-OTHER" }]) assert.equal(settlePaidCart(status, value, cart), false);
  assert.equal(cleared, 0); assert.equal(settlePaidCart(paid, value, cart), true); assert.equal(cleared, 1);
  assert.equal(settlePaidCart(paid, value, cart), false); assert.equal(settlePaidCart(paid, getPaymentSession(), cart), false); assert.equal(cleared, 1);
}));
test("confirmar pedido previo conserva nuevos productos/agregados y no limpia dos veces", async () => browser(() => {
  const { savePaymentSession } = load("lib/payment/session.ts"), { settlePaidCart } = load("lib/payment/cart.ts");
  const value = session(); savePaymentSession(value); const changed = [], removed = [];
  const cart = { ready: true, items: [{ slug: "producto", quantity: 3 }, { slug: "nuevo", quantity: 1 }], clearCart() { assert.fail("No borrar productos nuevos"); }, removeItem: slug => removed.push(slug), updateQuantity: (slug, quantity) => changed.push({ slug, quantity }) };
  assert.equal(settlePaidCart(paid, value, cart), true); assert.deepEqual(changed, [{ slug: "producto", quantity: 1 }]); assert.deepEqual(removed, []);
}));
function harness(cart, validation) {
  const slots = []; let index = 0; const react = nativeRequire("react");
  overrides.set("react", { ...react, useEffect() {}, useState(initial) { const id = index++; if (!(id in slots)) slots[id] = typeof initial === "function" ? initial() : initial; return [slots[id], value => { slots[id] = typeof value === "function" ? value(slots[id]) : value; }]; }, useRef(initial) { const id = index++; if (!(id in slots)) slots[id] = { current: initial }; return slots[id]; } });
  overrides.set(path.resolve("components/cart/CartProvider.tsx"), { useCart: () => cart });
  overrides.set(path.resolve("components/cart/useValidatedCart.ts"), { useValidatedCart: () => validation });
  const navigation = []; overrides.set("next/navigation", { useRouter: () => ({ push: url => navigation.push(url) }) }); modules.clear();
  return { render(file, props = {}) { index = 0; const loaded = load(file); return loaded[Object.keys(loaded).find(key => key !== "__esModule")](props); }, navigation };
}
function find(node, predicate) {
  if (!node) return null;
  if (Array.isArray(node)) return node.map(child => find(child, predicate)).find(Boolean) || null;
  if (predicate(node)) return node;
  return node.props ? find(node.props.children, predicate) : null;
}
async function checkoutScenario(run, paymentEnabled = true) {
  await browser(async context => {
    const config = { ...settings, payment: { ...settings.payment, enabled: paymentEnabled } }; let cleared = 0, confirmed = null;
    const cart = { ready: true, items: [{ slug: "producto", quantity: 2 }], settings: config, clearCart() { cleared++; }, setReceipt(value) { confirmed = value; } };
    const validation = { products: { producto: product }, loading: false, error: false, changed: [], refresh: async () => ({ settings: config, products: [{ slug: "producto", product }] }) };
    const component = harness(cart, validation);
    globalThis.FormData = class { constructor(values) { this.values = values; } get(key) { return this.values[key]; } };
    globalThis.requestAnimationFrame = callback => callback();
    const event = { preventDefault() {}, currentTarget: { firstName: "Test", lastName: "User", email: "test@example.com", phone: "+5492610000000", method: "pickup", notes: "" } };
    await run({ ...context, cart, validation, component, event, cleared: () => cleared, confirmed: () => confirmed });
  });
}
test("checkout: Order → token → Payment → redirect; doble clic no duplica Order", async () => checkoutScenario(async ({ component, event, redirects, cleared, confirmed, storage }) => {
  const calls = [];
  globalThis.fetch = async (url, options) => { calls.push({ url, options }); return Response.json({ data: url === "/api/orders" ? receipt : url.endsWith("/status") ? pending : checkout }); };
  const tree = component.render("components/cart/CheckoutPage.tsx"); assert.ok(find(tree, node => node.type === "button" && node.props.type === "submit").props.children.includes("Pagar con Mercado Pago"));
  const form = find(tree, node => node.type === "form"); await Promise.all([form.props.onSubmit(event), form.props.onSubmit(event)]);
  assert.equal(calls.filter(call => call.url === "/api/orders").length, 1);
  assert.deepEqual(calls.map(call => call.url), ["/api/orders", "/api/orders/CX-000123/status", "/api/orders/CX-000123/payment"]);
  assert.notEqual(calls[0].options.headers["Idempotency-Key"], calls[2].options.headers["Idempotency-Key"]);
  const body = JSON.parse(calls[0].options.body); assert.ok(!("amount" in body)); assert.ok(!("currency" in body)); assert.ok(!("total" in body));
  assert.equal(confirmed().publicStatusToken, token); assert.equal(cleared(), 0); assert.deepEqual(redirects, [checkout.checkoutUrl]); assert.ok(storage.getItem("conexus-payment-session-v1").includes(token));
}));
test("Payment falla: se conserva Order/cart y recovery no vuelve a crear Order", async () => checkoutScenario(async ({ component, event, cleared, confirmed, storage }) => {
  let orders = 0; globalThis.fetch = async url => { if (url === "/api/orders") { orders++; return Response.json({ data: receipt }); } return url.endsWith("/status") ? Response.json({ data: pending }) : Response.json({ error: { code: "PROVIDER_UNAVAILABLE" } }, { status: 503 }); };
  await find(component.render("components/cart/CheckoutPage.tsx"), node => node.type === "form").props.onSubmit(event);
  assert.equal(orders, 1); assert.equal(cleared(), 0); assert.equal(confirmed().orderNumber, receipt.orderNumber);
  const tree = component.render("components/cart/CheckoutPage.tsx"); assert.equal(find(tree, node => node.type === "form"), null);
  assert.equal(tree.props.orderNumber, receipt.orderNumber); assert.equal(tree.props.initialError, "PROVIDER_UNAVAILABLE");
  assert.ok(storage.getItem("conexus-payment-session-v1")); assert.equal(storage.getItem("conexus-checkout-attempt-v1"), null);
}));
test("token ausente conserva Order/cart, sin iniciar pago o inventar autenticación", async () => checkoutScenario(async ({ component, event, cleared, storage }) => {
  let calls = 0; globalThis.fetch = async url => { calls++; assert.equal(url, "/api/orders"); return Response.json({ data: { orderNumber: receipt.orderNumber, status: receipt.status, total: receipt.total, currency: receipt.currency } }); };
  await find(component.render("components/cart/CheckoutPage.tsx"), node => node.type === "form").props.onSubmit(event);
  const tree = component.render("components/cart/CheckoutPage.tsx"); assert.equal(tree.props.initialError, "TOKEN_UNAVAILABLE"); assert.equal(calls, 1); assert.equal(cleared(), 0); assert.ok(storage.getItem("conexus-checkout-attempt-v1"));
}));
test("sessionStorage bloqueado evita crear pedido MP sin token recuperable", async () => checkoutScenario(async ({ component, event, cleared }) => {
  Object.defineProperty(globalThis.window, "sessionStorage", { get() { throw new Error("blocked"); } });
  let calls = 0; globalThis.fetch = async () => { calls++; assert.fail("No crear Order"); };
  await find(component.render("components/cart/CheckoutPage.tsx"), node => node.type === "form").props.onSubmit(event); assert.equal(calls, 0); assert.equal(cleared(), 0);
}));
test("Mercado Pago apagado mantiene Confirmar pedido y confirmación V4.25", async () => checkoutScenario(async ({ component, event, cleared, redirects }) => {
  let calls = 0; globalThis.fetch = async url => { calls++; assert.equal(url, "/api/orders"); return Response.json({ data: receipt }); };
  const tree = component.render("components/cart/CheckoutPage.tsx"); assert.ok(find(tree, node => node.type === "button" && node.props.type === "submit").props.children.includes("Confirmar pedido"));
  await find(tree, node => node.type === "form").props.onSubmit(event);
  assert.equal(calls, 1); assert.equal(cleared(), 1); assert.deepEqual(component.navigation, ["/pedido/confirmado"]); assert.equal(redirects.length, 0);
}, false));
test("retornos success/pending/error leen solo orderNumber, nunca approved ni token query", async () => {
  for (const mode of ["exito", "pendiente", "error"]) {
    const page = load("app/(commerce)/pedido/pago/" + mode + "/page.tsx");
    const element = await page.default({ searchParams: Promise.resolve({ orderNumber: receipt.orderNumber, status: "approved", token, payment_id: "PRIVATE" }) });
    assert.deepEqual(element.props, { mode, orderNumber: receipt.orderNumber }); assert.equal(page.metadata.robots.index, false);
    const invalid = await page.default({ searchParams: Promise.resolve({ orderNumber: "", status: "approved" }) });
    assert.equal(invalid.props.orderNumber, "");
  }
});
test("checkout recupera PaymentSession antes de otro submit y no crea otro Order", async () => checkoutScenario(async ({ component, event, storage, cleared }) => {
  storage.setItem("conexus-payment-session-v1", JSON.stringify([session()]));
  globalThis.fetch = async () => { assert.fail("No recrear el pedido de esta sesión"); };
  await find(component.render("components/cart/CheckoutPage.tsx"), node => node.type === "form").props.onSubmit(event);
  assert.equal(component.render("components/cart/CheckoutPage.tsx").props.orderNumber, receipt.orderNumber); assert.equal(cleared(), 0);
}));
test("errores de inicio revisión/reserva/Order no pagable bloquean retry aunque Order siga pending", async () => browser(() => {
  for (const code of ["PAYMENT_REQUIRES_REVIEW", "ORDER_NOT_PAYABLE", "RESERVATION_INVALID", "PAYMENTS_UNAVAILABLE"]) {
    const component = harness({ settings }, {});
    overrides.set(path.resolve("components/payment/usePaymentStatus.ts"), { usePaymentStatus: () => ({ ready: true, session: session(), status: pending, error: "", timedOut: false, cooldown: 0, paymentsEnabled: true, refresh() {}, setStatus() {}, failure() {} }) });
    const tree = component.render("components/payment/PaymentStatusPanel.tsx", { mode: "recovery", orderNumber: receipt.orderNumber, initialError: code });
    assert.equal(find(tree, node => node.type === "button" && node.props.className === "button button--primary"), null);
  }
}));
test("UI review/expired no ofrece retry; rejected sí; proveedor apagado lo oculta", async () => browser(() => {
  const cart = { settings, ready: true, items: session().cart }; const component = harness(cart, {});
  const state = { ready: true, session: session(), status: pending, error: "", timedOut: false, cooldown: 0, paymentsEnabled: true, refresh() {}, setStatus() {}, failure() {} };
  overrides.set(path.resolve("components/payment/usePaymentStatus.ts"), { usePaymentStatus: () => state });
  const render = () => component.render("components/payment/PaymentStatusPanel.tsx", { mode: "error", orderNumber: receipt.orderNumber });
  const retry = tree => find(tree, node => node.type === "button" && node.props.className === "button button--primary");
  state.status = { ...pending, paymentStatus: "REJECTED" }; assert.ok(retry(render()));
  state.paymentsEnabled = false; assert.equal(retry(render()), null); state.paymentsEnabled = true;
  state.status = { ...pending, paymentStatus: "REQUIRES_REVIEW" }; const review = render(); assert.equal(retry(review), null); assert.ok(renderToStaticMarkup(review).includes("necesitamos verificar"));
  state.status = { ...pending, orderStatus: "EXPIRED" }; const expired = render(); assert.equal(retry(expired), null); assert.ok(renderToStaticMarkup(expired).includes("Volver al carrito"));
  state.error = "NOT_FOUND"; assert.equal(retry(render()), null); assert.ok(renderToStaticMarkup(render()).includes("token seguro"));
}));
test("UI aria-live/focus y responsive reutilizan estilos existentes sin SDK/secretos", () => {
  const panel = readFileSync("components/payment/PaymentStatusPanel.tsx", "utf8"), css = readFileSync("components/cart/Commerce.module.css", "utf8");
  assert.ok(panel.includes('aria-live="polite"')); assert.ok(panel.includes("preventScroll: true")); assert.ok(panel.includes("tabIndex={-1}"));
  assert.ok(css.includes(".paymentActions")); assert.ok(css.includes("@media")); assert.ok(css.includes("prefers-reduced-motion"));
  for (const file of ["lib/payment/client.ts", "components/cart/CheckoutPage.tsx", "components/payment/PaymentStatusPanel.tsx"]) {
    const source = readFileSync(file, "utf8"); assert.ok(!source.includes("MERCADOPAGO_ACCESS_TOKEN")); assert.ok(!source.includes("collection_status")); assert.ok(!source.includes("status=approved"));
  }
});
