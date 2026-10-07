import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
const nativeRequire = createRequire(import.meta.url), modules = new Map();
function load(relative) {
  const filename = path.resolve(relative);
  if (modules.has(filename)) return modules.get(filename).exports;
  const loadedModule = { exports: {} };
  modules.set(filename, loadedModule);
  const code = ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const localRequire = name => {
    if (name === "server-only") return {};
    if (name.endsWith(".css")) {
      const styles = new Proxy({}, { get: (_, key) => String(key) });
      return { __esModule: true, default: styles };
    }
    if (name.startsWith(".") || name.startsWith("@/")) {
      const base = name.startsWith("@/") ? path.resolve(name.slice(2)) : path.resolve(path.dirname(filename), name);
      return load([base, base + ".ts", base + ".tsx"].find(file => existsSync(file)));
    }
    return nativeRequire(name);
  };
  new Function("require", "module", "exports", code)(localRequire, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}
const { parseProduct, parseProducts, parseProductDetail } = load("lib/cms/product-normalize.ts");
const { formatMoney } = load("lib/cms/money.ts");
const { productsUrl } = load("lib/cms/product-links.ts");
const client = load("lib/cms/client.ts");
const product = { name: "Producto test", slug: "producto", shortDescription: "Descripción breve", price: "14000.00", salePrice: "13200.00", currency: "ARS", stock: { managed: true, available: true }, featuredImage: "https://media.example.test/main.webp", category: { name: "Categoría", slug: "categoria" }, publishedAt: "2026-01-01T12:00:00Z", gallery: ["https://media.example.test/gallery.webp"], description: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Detalle", marks: [{ type: "bold" }] }] }] }, seo: {} };
const pagination = { page: 1, limit: 12, total: 1, totalPages: 1 };
test("contrato: publicación, disponibilidad y URLs", () => {
  assert.equal(parseProduct(product).stock.available, true);
  assert.equal(parseProduct({ ...product, stock: { managed: true, available: false } }).stock.available, false);
  assert.equal(parseProduct({ ...product, stock: { managed: false, available: false } }).stock.available, true);
  assert.throws(() => parseProduct({ ...product, status: "DRAFT" }));
  assert.equal(parseProductDetail({ data: product }).gallery[0], product.gallery[0]);
  assert.equal(parseProduct({ ...product, featuredImage: "javascript:alert(1)" }).featuredImage, null);
});
test("precios ocultos, promoción y decimales exactos en distintas monedas", () => {
  assert.equal(parseProducts({ data: [product], pagination, showPrices: false }).data[0].price, null);
  assert.equal(parseProduct({ ...product, showPrices: false }).salePrice, null);
  assert.equal(parseProduct({ ...product, price: null, salePrice: null }).price, null);
  assert.match(formatMoney("13200.00", "ARS"), /13\.200,00/);
  for (const currency of ["USD", "MXN", "CRC"]) assert.match(formatMoney("1250.50", currency), /1\.250,50/);
  assert.match(formatMoney("9007199254740993.01", "ARS"), /9\.007\.199\.254\.740\.993,01/);
  assert.match(formatMoney("1.999", "ARS"), /2,00/);
  assert.equal(formatMoney("invalid", "ARS"), null);
  const { ProductPrice } = load("components/products/ProductPrice.tsx");
  const html = renderToStaticMarkup(ProductPrice({ product: parseProduct(product) }));
  assert.ok(html.includes("<del")); assert.ok(html.includes("13.200,00"));
  assert.equal(ProductPrice({ product: parseProduct({ ...product, showPrices: false }) }), null);
});
test("búsqueda, categorías y páginas se preservan en los enlaces", () => {
  assert.equal(productsUrl({ page: 2, category: "alcohol", q: "fernet" }), "/productos?category=alcohol&q=fernet&page=2");
  const { ProductPagination, ProductControls } = load("components/products/ProductControls.tsx");
  const html = renderToStaticMarkup(ProductPagination({ page: 2, totalPages: 4, category: "alcohol", q: "fernet" }));
  assert.ok(html.includes("category=alcohol&amp;q=fernet&amp;page=3"));
  const controls = renderToStaticMarkup(ProductControls({ categories: [product.category], category: "categoria", q: "test" }));
  assert.ok(controls.includes('method="get"')); assert.ok(controls.includes('name="category"')); assert.ok(controls.includes("Buscar productos..."));
});
test("galería semántica y detalle reutilizan renderer TipTap seguro", async () => {
  const { ProductGallery } = load("components/products/ProductGallery.tsx");
  const html = renderToStaticMarkup(createElement(ProductGallery, { images: [product.featuredImage, ...product.gallery], name: product.name }));
  assert.ok(html.includes('aria-pressed="true"')); assert.ok(html.includes('aria-pressed="false"'));
  assert.ok(html.includes("Ver imagen 2")); assert.ok(html.includes('alt="Producto test"'));
  const originalFetch = globalThis.fetch, originalUrl = process.env.CONEXUS_CMS_URL;
  process.env.CONEXUS_CMS_URL = "http://cms.example.test";
  try {
    globalThis.fetch = async () => Response.json({ data: product });
    const detail = await load("app/productos/[slug]/page.tsx").default({ params: Promise.resolve({ slug: product.slug }) });
    const rendered = renderToStaticMarkup(detail);
    assert.ok(rendered.includes("<strong>Detalle</strong>"));
    assert.ok(rendered.includes("Sobre este producto")); assert.ok(rendered.includes("Disponible"));
    assert.ok(!rendered.includes("Comprar")); assert.ok(!rendered.includes("carrito"));
  } finally { globalThis.fetch = originalFetch; if (originalUrl === undefined) delete process.env.CONEXUS_CMS_URL; else process.env.CONEXUS_CMS_URL = originalUrl; }
});
test("requests de productos comparten conexión no-store y contrato público", async () => {
  const originalFetch = globalThis.fetch, originalUrl = process.env.CONEXUS_CMS_URL;
  process.env.CONEXUS_CMS_URL = "http://cms.example.test";
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(options.cache, "no-store");
      assert.equal(url.pathname, "/api/public/v1/products");
      assert.equal(url.searchParams.get("q"), "fernet"); assert.equal(url.searchParams.get("category"), "alcohol");
      assert.equal(url.searchParams.get("limit"), "12"); assert.equal(url.searchParams.get("page"), "2");
      return Response.json({ data: [product], pagination: { ...pagination, page: 2 } });
    };
    assert.equal((await client.getProducts({ page: 2, category: "alcohol", q: "fernet" })).data.length, 1);
    globalThis.fetch = async () => Response.json({ data: [product.category] });
    assert.equal((await client.getProductCategories())[0].slug, "categoria");
    globalThis.fetch = async () => new Response("", { status: 404 });
    assert.equal(await client.getProductBySlug("missing"), null);
  } finally { globalThis.fetch = originalFetch; if (originalUrl === undefined) delete process.env.CONEXUS_CMS_URL; else process.env.CONEXUS_CMS_URL = originalUrl; }
});
test("SEO, 404, vacío y caída del CMS; Home no muestra fallback inventado", async () => {
  const originalFetch = globalThis.fetch, originalUrl = process.env.CONEXUS_CMS_URL;
  process.env.CONEXUS_CMS_URL = "http://cms.example.test";
  const params = Promise.resolve({ slug: product.slug });
  try {
    const detail = load("app/productos/[slug]/page.tsx"), list = load("app/productos/page.tsx").default;
    const { LatestProducts } = load("components/products/LatestProducts.tsx");
    globalThis.fetch = async () => Response.json({ data: { ...product, seo: { title: "SEO producto", description: "SEO descripción" } } });
    assert.equal((await detail.generateMetadata({ params })).title, "SEO producto");
    globalThis.fetch = async () => Response.json({ data: product });
    assert.equal((await detail.generateMetadata({ params })).description, product.shortDescription);
    globalThis.fetch = async () => new Response("", { status: 404 });
    await assert.rejects(detail.default({ params }), error => String(error.digest).includes("404"));
    globalThis.fetch = async url => Response.json(url.pathname.endsWith("product-categories") ? { data: [] } : { data: [], pagination: { ...pagination, total: 0, totalPages: 0 } });
    assert.equal(await LatestProducts(), null);
    assert.ok(renderToStaticMarkup(await list({ searchParams: Promise.resolve({}) })).includes("Todavía no hay productos disponibles."));
    globalThis.fetch = async () => { throw new Error("offline"); };
    assert.equal(await LatestProducts(), null);
    assert.ok(renderToStaticMarkup(await list({ searchParams: Promise.resolve({}) })).includes("El catálogo estará de vuelta pronto."));
    assert.ok(renderToStaticMarkup(await detail.default({ params })).includes("Este producto estará de vuelta pronto."));
  } finally { globalThis.fetch = originalFetch; if (originalUrl === undefined) delete process.env.CONEXUS_CMS_URL; else process.env.CONEXUS_CMS_URL = originalUrl; }
});
