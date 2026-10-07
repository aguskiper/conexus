import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";

// Ejecuta TypeScript/TSX en memoria, sin artefactos ni dependencias adicionales.
const nativeRequire = createRequire(import.meta.url);
const modules = new Map();
function load(relative) {
  const filename = path.resolve(relative);
  if (modules.has(filename)) return modules.get(filename).exports;
  const loadedModule = { exports: {} };
  modules.set(filename, loadedModule);
  const code = ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const localRequire = name => {
    if (name === "server-only") return {};
    if (name.endsWith(".css")) return new Proxy({}, { get: (_, key) => key === "__esModule" ? false : String(key) });
    if (name.startsWith(".") || name.startsWith("@/")) {
      const base = name.startsWith("@/") ? path.resolve(name.slice(2)) : path.resolve(path.dirname(filename), name);
      const resolved = [base, base + ".ts", base + ".tsx"].find(file => existsSync(file));
      if (!resolved) throw new Error("Missing test module: " + name);
      return load(resolved);
    }
    return nativeRequire(name);
  };
  new Function("require", "module", "exports", code)(localRequire, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}
const { safeLinkHref, safePublicUrl, productionCanonical, metadataImage } = load("lib/cms/urls.ts");
const { parsePosts, parsePostDetail } = load("lib/cms/normalize.ts");
const { renderTipTap } = load("lib/cms/tiptap.ts");
const { getPosts, getPostBySlug, getCategories } = load("lib/cms/client.ts");
const { blogUrl } = load("lib/cms/blog-links.ts");
const post = { title: "Título de prueba", slug: "prueba", excerpt: "Extracto", featuredImage: "https://media.example.test/cover.webp", category: { name: "Diseño", slug: "diseno" }, publishedAt: "2026-01-01T12:00:00Z", content: { type: "doc", content: [] }, seo: {} };

test("links seguros y esquemas peligrosos", () => {
  for (const href of ["javascript:alert(1)", "data:text/html,malicioso", "//host.test", "java\nscript:alert(1)", "/\\host.test", "https://user:secret@host.test"]) assert.equal(safeLinkHref(href), null);
  for (const href of ["/blog", "#contenido", "?page=2", "https://example.test/", "mailto:hola@example.test", "tel:+5492614603581"]) assert.equal(safeLinkHref(href), href);
  assert.equal(safePublicUrl("javascript:alert(1)"), null);
});
test("normaliza contrato real, rechaza borradores y conserva URLs de imagen", () => {
  const parsed = parsePosts({ data: [post], pagination: { page: 1, limit: 9, total: 1, totalPages: 1 } });
  assert.equal(parsed.data[0].featuredImage, post.featuredImage);
  assert.equal(parsePostDetail({ data: post }).seo.title, null);
  assert.throws(() => parsePosts({ data: [{ ...post, status: "DRAFT" }], pagination: parsed.pagination }));
  assert.throws(() => parsePosts({ data: [post], pagination: { page: -1 } }));
});
test("renderer soporta H2/H3, listas, citas, breaks y marks", () => {
  const text = value => ({ type: "text", text: value });
  const paragraph = { type: "paragraph", content: [text("Texto")] };
  const html = renderToStaticMarkup(renderTipTap({ type: "doc", content: [
    { type: "heading", attrs: { level: 2 }, content: [text("Dos")] },
    { type: "heading", attrs: { level: 3 }, content: [text("Tres")] },
    { type: "paragraph", content: [{ ...text("<script>alert(1)</script>"), marks: [{ type: "bold" }, { type: "italic" }, { type: "link", attrs: { href: "https://example.test", onclick: "malicioso" } }] }, { type: "hardBreak" }] },
    { type: "bulletList", content: [{ type: "listItem", content: [paragraph] }] },
    { type: "orderedList", attrs: { start: 2 }, content: [{ type: "listItem", content: [paragraph] }] },
    { type: "blockquote", content: [paragraph] },
    { type: "heading", attrs: { level: 1 }, content: [text("Ignorar")] },
    { type: "unknown", content: [text("Ignorar")] },
  ] }));
  for (const tag of ["<h2>", "<h3>", "<p>", "<ul>", '<ol start="2">', "<li>", "<blockquote>", "<br", "<strong>", "<em>", 'rel="noopener noreferrer"']) assert.ok(html.includes(tag), tag);
  assert.ok(html.includes("&lt;script&gt;")); assert.ok(!html.includes("<script>")); assert.ok(!html.includes("onclick")); assert.ok(!html.includes("Ignorar"));
});
test("renderer ignora enlaces inseguros y estructuras inválidas", () => {
  const html = renderToStaticMarkup(renderTipTap({ type: "doc", content: [
    { type: "paragraph", content: [{ type: "text", text: "Seguro", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }, { type: "heading", attrs: { level: 2 }, content: [] }] },
  ] }));
  assert.equal(html, "<p>Seguro</p>");
  assert.equal(renderToStaticMarkup(renderTipTap(null)), "");
});
test("canonical e imágenes metadata evitan localhost en producción", () => {
  const site = process.env.CONEXUS_SITE_URL, environment = process.env.NODE_ENV;
  try {
    process.env.CONEXUS_SITE_URL = "http://localhost:3000";
    assert.equal(productionCanonical("/blog"), undefined);
    process.env.CONEXUS_SITE_URL = "https://digital.example.test";
    assert.equal(productionCanonical("/blog/prueba"), "https://digital.example.test/blog/prueba");
    process.env.NODE_ENV = "production";
    assert.equal(metadataImage("http://localhost:3001/image.png"), undefined);
  } finally {
    if (site === undefined) delete process.env.CONEXUS_SITE_URL; else process.env.CONEXUS_SITE_URL = site;
    if (environment === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = environment;
  }
});
test("filtro y paginación preservan categoría", () => {
  assert.equal(blogUrl(1, "diseno"), "/blog?category=diseno");
  assert.equal(blogUrl(2, "diseno"), "/blog?category=diseno&page=2");
});
test("paginación renderiza navegación accesible sin cargar todas las notas", () => {
  const { BlogPagination } = load("components/blog/BlogPagination.tsx");
  const html = renderToStaticMarkup(BlogPagination({ page: 2, totalPages: 4, category: "diseno" }));
  assert.ok(html.includes("Página 2 de 4"));
  assert.ok(html.includes('href="/blog?category=diseno"'));
  assert.ok(html.includes('href="/blog?category=diseno&amp;page=3"'));
  assert.equal(BlogPagination({ page: 1, totalPages: 1 }), null);
});
test("listado vacío, Home sin notas y CMS caído no rompen las páginas", async () => {
  const originalFetch = globalThis.fetch, originalUrl = process.env.CONEXUS_CMS_URL;
  process.env.CONEXUS_CMS_URL = "http://cms.example.test";
  try {
    globalThis.fetch = async url => Response.json(url.pathname.endsWith("/categories") ? { data: [] } : { data: [], pagination: { page: 1, limit: 9, total: 0, totalPages: 0 } });
    const { LatestBlog } = load("components/blog/LatestBlog.tsx");
    const BlogPage = load("app/blog/page.tsx").default;
    assert.equal(await LatestBlog(), null);
    assert.ok(renderToStaticMarkup(await BlogPage({ searchParams: Promise.resolve({}) })).includes("Estamos preparando nuevos contenidos."));
    globalThis.fetch = async () => { throw new Error("offline"); };
    assert.ok(renderToStaticMarkup(await BlogPage({ searchParams: Promise.resolve({}) })).includes("Pronto volvemos con más ideas."));
    const BlogPost = load("app/blog/[slug]/page.tsx").default;
    assert.ok(renderToStaticMarkup(await BlogPost({ params: Promise.resolve({ slug: "prueba" }) })).includes("Esta idea estará de vuelta pronto."));
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.CONEXUS_CMS_URL; else process.env.CONEXUS_CMS_URL = originalUrl;
  }
});
test("SEO del CMS, fallback y notFound de una publicación retirada", async () => {
  const originalFetch = globalThis.fetch, originalUrl = process.env.CONEXUS_CMS_URL;
  process.env.CONEXUS_CMS_URL = "http://cms.example.test";
  try {
    const { generateMetadata, default: BlogPost } = load("app/blog/[slug]/page.tsx");
    const params = Promise.resolve({ slug: "prueba" });
    globalThis.fetch = async () => Response.json({ data: { ...post, seo: { title: "SEO del CMS", description: "Descripción SEO" } } });
    const metadata = await generateMetadata({ params });
    assert.equal(metadata.title, "SEO del CMS");
    assert.equal(metadata.description, "Descripción SEO");
    globalThis.fetch = async () => Response.json({ data: post });
    const fallback = await generateMetadata({ params });
    assert.equal(fallback.title, post.title);
    assert.equal(fallback.description, post.excerpt);
    globalThis.fetch = async () => new Response("", { status: 404 });
    await assert.rejects(BlogPost({ params }), error => String(error.digest).includes("404"));
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.CONEXUS_CMS_URL; else process.env.CONEXUS_CMS_URL = originalUrl;
  }
});
test("requests centralizados sin caché; categorías, detalle y 404", async () => {
  const originalFetch = globalThis.fetch, originalUrl = process.env.CONEXUS_CMS_URL;
  process.env.CONEXUS_CMS_URL = "http://cms.example.test";
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(options.cache, "no-store"); assert.ok(options.signal);
      assert.equal(url.searchParams.get("category"), "diseno");
      assert.equal(url.searchParams.get("page"), "2"); assert.equal(url.searchParams.get("limit"), "9");
      return Response.json({ data: [], pagination: { page: 2, limit: 9, total: 0, totalPages: 0 } });
    };
    assert.equal((await getPosts({ page: 2, limit: 9, category: "diseno" })).data.length, 0);
    globalThis.fetch = async () => Response.json({ data: [{ name: "Diseño", slug: "diseno" }] });
    assert.equal((await getCategories())[0].slug, "diseno");
    globalThis.fetch = async () => Response.json({ data: post });
    assert.equal((await getPostBySlug("prueba")).title, post.title);
    globalThis.fetch = async () => new Response("", { status: 404 });
    assert.equal(await getPostBySlug("no-existe"), null);
    globalThis.fetch = async () => { throw new Error("fallo de conexión"); };
    await assert.rejects(getPosts());
    const { LatestBlog } = load("components/blog/LatestBlog.tsx");
    assert.equal(await LatestBlog(), null);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.CONEXUS_CMS_URL; else process.env.CONEXUS_CMS_URL = originalUrl;
  }
});
