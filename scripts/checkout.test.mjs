import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";
const nativeRequire = createRequire(import.meta.url), modules = new Map(), overrides = new Map();
function load(relative) {
  const filename = path.resolve(relative);
  if (overrides.has(filename)) return overrides.get(filename);
  if (modules.has(filename)) return modules.get(filename).exports;
  const loadedModule = { exports: {} };
  modules.set(filename, loadedModule);
  const code = ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const localRequire = name => {
    if (overrides.has(name)) return overrides.get(name);
    if (name === "server-only") return {};
    if (name.endsWith(".css")) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (name.startsWith(".") || name.startsWith("@/")) {
      const base = name.startsWith("@/") ? path.resolve(name.slice(2)) : path.resolve(path.dirname(filename), name);
      return load([base, base + ".ts", base + ".tsx"].find(file => existsSync(file)));
    }
    return nativeRequire(name);
  };
  new Function("require", "module", "exports", code)(localRequire, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}

const model = load("lib/cart/model.ts"), totals = load("lib/cart/totals.ts");
const { validateOrderRequest } = load("lib/cart/order-validation.ts");
const { parseCheckoutSettings } = load("lib/cms/checkout-normalize.ts");
const { checkoutAttempt, finishAttempt, ATTEMPT_KEY } = load("lib/cart/idempotency.ts");
const { attemptStorage } = load("lib/cart/session.ts");
const product = { name: "Producto", slug: "producto", shortDescription: "Descripción", price: "14000.00", salePrice: "9500.00", currency: "ARS", stock: { managed: true, available: true }, showPrices: true, featuredImage: null, category: null, publishedAt: "2026-01-01T12:00:00Z", description: { type: "doc", content: [] }, gallery: [], seo: {} };
const settings = { enabled: true, currency: "ARS", reservationMinutes: 15, methods: [{ method: "pickup", label: "Retiro configurado", instructions: "Instrucciones del CMS" }] };
const payload = { customer: { firstName: "Prueba", lastName: "Test", email: "test@example.com", phone: "+5492610000000" }, items: [{ slug: "producto", quantity: 2 }], shipping: { method: "pickup" }, notes: "Prueba" };
const receipt = { orderNumber: "CX-000123", status: "PENDING_PAYMENT", total: "19000.00", currency: "ARS" };
function memoryStorage() { const map = new Map(); return { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) }; }
test("carrito: agregar, acumular, actualizar, eliminar y límites razonables", () => {
  let items = model.addCartItem([], "producto", 2);
  items = model.addCartItem(items, "producto", 3);
  assert.deepEqual(items, [{ slug: "producto", quantity: 5 }]);
  assert.equal(model.setCartQuantity(items, "producto", 200)[0].quantity, 99);
  assert.equal(model.setCartQuantity(items, "producto", -1)[0].quantity, 1);
  assert.deepEqual(items.filter(item => item.slug !== "producto"), []);
  assert.deepEqual(model.addCartItem(items, "producto", -5), items);
});
test("persistencia sanitiza localStorage sin conservar precios o datos personales", () => {
  const items = model.readCart(JSON.stringify([{ slug: "producto", quantity: 2, price: "1", email: "evil@example.com" }]));
  assert.deepEqual(items, payload.items);
  assert.deepEqual(model.readCart("{malformed"), []);
  assert.deepEqual(model.readCart(JSON.stringify([{ slug: "../api", quantity: 1 }, { slug: "producto", quantity: 1.2 }])), []);
  assert.equal(items.reduce((n, item) => n + item.quantity, 0), 2);
});
test("totales orientativos usan decimales exactos y promoción vigente", () => {
  assert.equal(totals.lineAmount(product, 2), "19000.00");
  assert.equal(totals.cartTotal([{ product, quantity: 2 }], "ARS"), "19000.00");
  assert.equal(totals.cartTotal([{ product, quantity: 2 }], "USD"), null);
  assert.equal(totals.lineAmount({ ...product, showPrices: false }, 2), null);
});
test("checkout requiere campos y elimina autoridades de precio/stock/IDs", () => {
  assert.deepEqual(validateOrderRequest({ ...payload, price: "0", total: "0", currency: "USD", customer: { ...payload.customer, id: "private" }, items: [{ ...payload.items[0], id: "private", price: "1", stock: 999 }] }), payload);
  for (const data of [{ ...payload, customer: {} }, { ...payload, items: [] }, { ...payload, items: [{ slug: "producto", quantity: 100 }] }, { ...payload, shipping: { method: "delivery" } }]) assert.throws(() => validateOrderRequest(data));
});
test("configuración pública y e-commerce desactivado", () => {
  assert.equal(parseCheckoutSettings({ data: settings }).methods[0].label, "Retiro configurado");
  assert.equal(parseCheckoutSettings({ data: { ...settings, enabled: false } }).enabled, false);
});
test("idempotencia persiste clave/huella, repite operación y renueva después de éxito", async () => {
  const storage = memoryStorage();
  const first = await checkoutAttempt(payload, storage), retry = await checkoutAttempt(payload, storage);
  assert.equal(first.key, retry.key);
  assert.ok(!storage.getItem(ATTEMPT_KEY).includes(payload.customer.email));
  await assert.rejects(checkoutAttempt({ ...payload, notes: "Otra compra" }, storage), /PENDING_ATTEMPT/);
  finishAttempt(storage);
  assert.notEqual((await checkoutAttempt(payload, storage)).key, first.key);
});
test("almacenamiento bloqueado conserva la misma clave durante esta visita", async () => {
  const storage = attemptStorage(() => { throw new Error("blocked"); });
  assert.equal((await checkoutAttempt(payload, storage)).key, (await checkoutAttempt(payload, storage)).key);
  finishAttempt(storage); assert.equal(storage.getItem(ATTEMPT_KEY), null);
});
test("POST de Digital reenvía solo contrato público y la misma clave", async () => {
  const original = globalThis.fetch, base = process.env.CONEXUS_CMS_URL;
  process.env.CONEXUS_CMS_URL = "http://cms.example.test";
  try {
    const { POST } = load("app/api/orders/route.ts");
    let calls = 0;
    globalThis.fetch = async (url, options) => { calls++; assert.equal(url.pathname, "/api/public/v1/orders"); assert.equal(options.headers["Idempotency-Key"], "test-idempotency-key-123"); assert.equal(options.cache, "no-store"); assert.deepEqual(JSON.parse(options.body), payload); return Response.json({ data: receipt }); };
    const request = () => new Request("http://digital.example.test/api/orders", { method: "POST", headers: { "Content-Type": "application/json", Origin: "http://digital.example.test", "Idempotency-Key": "test-idempotency-key-123" }, body: JSON.stringify({ ...payload, total: "0" }) });
    const [a, b] = await Promise.all([POST(request()), POST(request())]);
    assert.deepEqual((await a.json()).data, receipt); assert.deepEqual((await b.json()).data, receipt); assert.equal(calls, 2);
    const crossOrigin = await POST(new Request("http://digital.example.test/api/orders", { method: "POST", headers: { Origin: "https://evil.example.test" } }));
    assert.equal(crossOrigin.status, 403);
  } finally { globalThis.fetch = original; if (base === undefined) delete process.env.CONEXUS_CMS_URL; else process.env.CONEXUS_CMS_URL = base; }
});
test("errores de stock/red no exponen detalles internos", async () => {
  const original = globalThis.fetch, base = process.env.CONEXUS_CMS_URL;
  process.env.CONEXUS_CMS_URL = "http://cms.example.test";
  try {
    const { POST } = load("app/api/orders/route.ts");
    const request = () => new Request("http://digital.example.test/api/orders", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": "test-idempotency-key-123" }, body: JSON.stringify(payload) });
    globalThis.fetch = async () => Response.json({ error: { code: "INSUFFICIENT_STOCK", message: "PRIVATE DATABASE STACK" } }, { status: 409 });
    const stock = await POST(request()); assert.equal(stock.status, 409); assert.deepEqual(await stock.json(), { error: { code: "INSUFFICIENT_STOCK" } });
    globalThis.fetch = async () => { throw new Error("private server"); };
    assert.equal((await POST(request())).status, 503);
  } finally { globalThis.fetch = original; if (base === undefined) delete process.env.CONEXUS_CMS_URL; else process.env.CONEXUS_CMS_URL = base; }
});
test("validación actualiza precio, disponibilidad y publicación sin ocultar catálogo", async () => {
  const original = globalThis.fetch, base = process.env.CONEXUS_CMS_URL;
  process.env.CONEXUS_CMS_URL = "http://cms.example.test";
  try {
    const { POST } = load("app/api/cart/route.ts");
    globalThis.fetch = async url => url.pathname.endsWith("/checkout") ? Response.json({ data: { ...settings, enabled: false } }) : Response.json({ data: { ...product, salePrice: "10000.00", stock: { managed: true, available: false } } });
    const result = await POST(new Request("http://digital.example.test/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: payload.items }) }));
    const body = await result.json();
    assert.equal(body.data.settings.enabled, false); assert.equal(body.data.products[0].product.salePrice, "10000.00"); assert.equal(body.data.products[0].product.stock.available, false);
    globalThis.fetch = async url => url.pathname.endsWith("/checkout") ? Response.json({ data: settings }) : new Response("", { status: 404 });
    const missing = await POST(new Request("http://digital.example.test/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: payload.items }) }));
    assert.equal((await missing.json()).data.products[0].product, null);
    globalThis.fetch = async () => { throw new Error("offline"); };
    assert.equal((await POST(new Request("http://digital.example.test/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: payload.items }) }))).status, 503);
  } finally { globalThis.fetch = original; if (base === undefined) delete process.env.CONEXUS_CMS_URL; else process.env.CONEXUS_CMS_URL = base; }
});
function componentHarness(cart, validation) {
  const slots = []; let index = 0;
  const react = nativeRequire("react");
  overrides.set("react", { ...react, useEffect() {}, useState(initial) { const id = index++; if (!(id in slots)) slots[id] = typeof initial === "function" ? initial() : initial; return [slots[id], value => { slots[id] = typeof value === "function" ? value(slots[id]) : value; }]; }, useRef(initial) { const id = index++; if (!(id in slots)) slots[id] = { current: initial }; return slots[id]; } });
  overrides.set(path.resolve("components/cart/CartProvider.tsx"), { useCart: () => cart });
  overrides.set(path.resolve("components/cart/useValidatedCart.ts"), { useValidatedCart: () => validation });
  const navigation = []; overrides.set("next/navigation", { useRouter: () => ({ push: url => navigation.push(url) }) });
  modules.clear();
  return { render(file, props = {}) { index = 0; return load(file)[Object.keys(load(file)).find(key => key !== "__esModule")](props); }, navigation, clear() { overrides.clear(); modules.clear(); } };
}
function find(node, type) {
  if (!node) return null;
  if (Array.isArray(node)) return node.map(child => find(child, type)).find(Boolean) || null;
  if (node.type === type) return node;
  return node.props ? find(node.props.children, type) : null;
}
async function checkoutScenario(run) {
  const saved = { fetch: globalThis.fetch, FormData: globalThis.FormData, frame: globalThis.requestAnimationFrame, session: globalThis.sessionStorage };
  let cleared = 0, confirmed = null;
  const cart = { ready: true, items: [...payload.items], settings, storageWarning: false, clearCart() { cleared++; }, setReceipt(value) { confirmed = value; } };
  const validation = { products: { producto: product }, loading: false, error: false, changed: [], refresh: async () => ({ settings, products: [{ slug: "producto", product }] }) };
  const harness = componentHarness(cart, validation);
  globalThis.sessionStorage = memoryStorage();
  globalThis.FormData = class { constructor(values) { this.values = values; } get(key) { return this.values[key]; } };
  globalThis.requestAnimationFrame = callback => callback();
  const event = { preventDefault() {}, currentTarget: { ...payload.customer, method: "pickup", notes: payload.notes } };
  try { await run({ cart, validation, harness, event, cleared: () => cleared, confirmed: () => confirmed }); }
  finally { harness.clear(); globalThis.fetch = saved.fetch; globalThis.FormData = saved.FormData; if (saved.frame === undefined) delete globalThis.requestAnimationFrame; else globalThis.requestAnimationFrame = saved.frame; if (saved.session === undefined) delete globalThis.sessionStorage; else globalThis.sessionStorage = saved.session; }
}
test("doble submit crea una sola solicitud y vacía carrito solo tras éxito", async () => checkoutScenario(async ({ harness, event, cleared, confirmed }) => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json({ data: receipt }); };
  const form = find(harness.render("components/cart/CheckoutPage.tsx"), "form");
  await Promise.all([form.props.onSubmit(event), form.props.onSubmit(event)]);
  assert.equal(calls, 1); assert.equal(cleared(), 1); assert.deepEqual(confirmed(), receipt); assert.deepEqual(harness.navigation, ["/pedido/confirmado"]);
}));
test("error de red conserva carrito y retry reutiliza clave y payload congelado", async () => checkoutScenario(async ({ harness, event, cleared }) => {
  const keys = [], bodies = []; let calls = 0;
  globalThis.fetch = async (_, options) => { keys.push(options.headers["Idempotency-Key"]); bodies.push(options.body); if (++calls === 1) throw new Error("network"); return Response.json({ data: receipt }); };
  await find(harness.render("components/cart/CheckoutPage.tsx"), "form").props.onSubmit(event);
  assert.equal(cleared(), 0);
  await find(harness.render("components/cart/CheckoutPage.tsx"), "form").props.onSubmit({ ...event, currentTarget: { ...event.currentTarget, firstName: "NO USAR ESTE CAMBIO" } });
  assert.equal(keys[0], keys[1]); assert.equal(bodies[0], bodies[1]); assert.equal(cleared(), 1);
}));
test("stock insuficiente conserva carrito y actualiza validación", async () => checkoutScenario(async ({ harness, event, cleared, validation }) => {
  let refreshes = 0; const original = validation.refresh;
  validation.refresh = async () => { refreshes++; return original(); };
  globalThis.fetch = async () => Response.json({ error: { code: "INSUFFICIENT_STOCK" } }, { status: 409 });
  await find(harness.render("components/cart/CheckoutPage.tsx"), "form").props.onSubmit(event);
  assert.equal(cleared(), 0); assert.ok(refreshes >= 2);
  assert.equal(globalThis.sessionStorage.getItem(ATTEMPT_KEY), null);
}));
test("precio cambiado antes de enviar exige revisar el resumen, sin POST", async () => checkoutScenario(async ({ harness, event, cleared, validation }) => {
  let calls = 0; globalThis.fetch = async () => { calls++; return Response.json({ data: receipt }); };
  validation.refresh = async () => ({ settings, products: [{ slug: "producto", product: { ...product, salePrice: "10000.00" } }] });
  await find(harness.render("components/cart/CheckoutPage.tsx"), "form").props.onSubmit(event);
  assert.equal(calls, 0); assert.equal(cleared(), 0);
}));
test("carrito vacío, header con contador y compra desactivada/sin stock", () => {
  const cart = { ready: true, items: [], settings, totalItems: 2 };
  const harness = componentHarness(cart, { products: {}, loading: false, error: false, changed: [], refresh: async () => null });
  try {
    assert.ok(renderToStaticMarkup(harness.render("components/cart/CartPage.tsx")).includes("Tu carrito está vacío."));
    assert.ok(renderToStaticMarkup(harness.render("components/cart/CartAccess.tsx")).includes("Carrito: 2 unidades"));
    cart.settings = { ...settings, enabled: false };
    assert.equal(harness.render("components/cart/CartAccess.tsx"), null);
    assert.equal(harness.render("components/cart/AddToCart.tsx", { product }), null);
    cart.settings = settings;
    assert.equal(harness.render("components/cart/AddToCart.tsx", { product: { ...product, stock: { managed: true, available: false } } }), null);
  } finally { harness.clear(); }
});
test("recarga recupera la clave pendiente aunque el catálogo haya cambiado", async () => checkoutScenario(async ({ harness, event, cleared, validation }) => {
  const previous = await checkoutAttempt(payload, globalThis.sessionStorage);
  let refreshes = 0, calls = 0;
  validation.refresh = async () => { refreshes++; throw new Error("No revalidar como compra nueva"); };
  globalThis.fetch = async (_, options) => { calls++; assert.equal(options.headers["Idempotency-Key"], previous.key); return Response.json({ data: receipt }); };
  await find(harness.render("components/cart/CheckoutPage.tsx"), "form").props.onSubmit(event);
  assert.equal(calls, 1); assert.equal(refreshes, 0); assert.equal(cleared(), 1);
}));
test("datos distintos o inválidos nunca olvidan un pedido incierto anterior", async () => checkoutScenario(async ({ harness, event, cleared }) => {
  const previous = await checkoutAttempt(payload, globalThis.sessionStorage);
  let calls = 0; globalThis.fetch = async () => { calls++; return Response.json({ data: receipt }); };
  await find(harness.render("components/cart/CheckoutPage.tsx"), "form").props.onSubmit({ ...event, currentTarget: { ...event.currentTarget, firstName: "Diferente" } });
  assert.equal(JSON.parse(globalThis.sessionStorage.getItem(ATTEMPT_KEY)).key, previous.key);
  await find(harness.render("components/cart/CheckoutPage.tsx"), "form").props.onSubmit({ ...event, currentTarget: { ...event.currentTarget, firstName: "" } });
  assert.equal(JSON.parse(globalThis.sessionStorage.getItem(ATTEMPT_KEY)).key, previous.key);
  assert.equal(calls, 0); assert.equal(cleared(), 0);
}));
test("checkout desactivado no ofrece formulario aunque haya carrito", async () => checkoutScenario(async ({ harness, cart }) => {
  cart.settings = { ...settings, enabled: false };
  const tree = harness.render("components/cart/CheckoutPage.tsx");
  assert.equal(find(tree, "form"), null);
  assert.ok(renderToStaticMarkup(tree).includes("Las compras están deshabilitadas."));
}));
test("ficha continúa como catálogo con configuración de compra desactivada", async () => {
  const original = globalThis.fetch, base = process.env.CONEXUS_CMS_URL;
  process.env.CONEXUS_CMS_URL = "http://cms.example.test";
  try {
    globalThis.fetch = async url => Response.json({ data: url.pathname.endsWith("/checkout") ? { ...settings, enabled: false } : product });
    const page = await load("app/productos/[slug]/page.tsx").default({ params: Promise.resolve({ slug: product.slug }) });
    const html = renderToStaticMarkup(page);
    assert.ok(html.includes("<h1>Producto</h1>")); assert.ok(!html.includes("Agregar al carrito"));
  } finally { globalThis.fetch = original; if (base === undefined) delete process.env.CONEXUS_CMS_URL; else process.env.CONEXUS_CMS_URL = base; }
});
