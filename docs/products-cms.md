# Catálogo público — Etapa 3.5

## Archivos
- app/productos/{layout,page,loading,not-found}.tsx y app/productos/[slug]/page.tsx.
- components/products/{ProductCard,ProductControls,ProductGallery,ProductPrice,LatestProducts}.tsx y Products.module.css.
- lib/cms/{product-types,product-normalize,product-links,money}.ts.
- Extensiones acotadas: lib/cms/client.ts, components/Header.tsx, app/page.tsx.
- scripts/products.test.mjs. La integración de Blog y su renderer no se modificaron.

## Conexión y configuración
Se reutilizan CONEXUS_CMS_URL y el request server-only de lib/cms/client.ts:
getProducts({page,limit,category,q}), getProductBySlug(slug), getProductCategories().
Solo se consultan /api/public/v1/products, /products/[slug] y /product-categories.
No existe base de datos, Prisma, contenido local ni fallback con productos inventados.
CONEXUS_SITE_URL es opcional: origen HTTPS público para canonical, nunca localhost.
Las dos variables ya están documentadas en .env.example.

## Contrato real
Listado: data + pagination {page,limit,total,totalPages}.
Producto: name, slug, shortDescription, price/salePrice como strings decimales,
currency, stock {managed,available}, featuredImage URL, category, publishedAt, updatedAt.
Detalle: description TipTap, gallery como array de URLs y seo {title,description}.
No se publican cantidades ni SKU. Un stock no administrado siempre se muestra Disponible.
Un stock administrado respeta available; Sin stock no oculta un producto publicado.
Si una respuesta incluye status, se rechaza cualquier valor distinto de PUBLISHED.

La respuesta pública observada no incluye una configuración global de precios.
El normalizador respeta price/salePrice nulos u omitidos y showPrices=false
a nivel de producto o envelope. Es necesario confirmar el payload real con la
opción de precios desactivada; no podemos inferir una configuración oculta si
la API sigue devolviendo importes sin un indicador. No se modificó el CMS.

## Listado y ficha
/productos es Server Component: categorías por enlaces, búsqueda GET con q,
12 productos por página. Filtros y paginación conservan categoría y búsqueda.
/productos/[slug] mantiene render server-side. ProductGallery es el único Client
Component nuevo: miniaturas con botones, aria-pressed, focus y selección React.
La imagen principal y galería usan URLs públicas completas, sin reconstruir paths.
Imágenes HTML nativas, dimensiones explícitas y carga diferida en tarjetas/miniaturas;
sin proxy/remotePatterns ni dependencias adicionales. Alt específico o nombre.
En producción debe usarse un CMS HTTPS y URLs de media públicas HTTPS accesibles.

## Dinero y contenido
formatMoney usa strings decimales, BigInt y Intl.NumberFormat es-AR con currency
del CMS (incluye ARS, USD, MXN, CRC). No hace cálculos monetarios con Float.
Una promoción muestra salePrice y price tachado, sin calcular descuentos.
Se reutiliza components/blog/TipTapContent y lib/cms/tiptap.ts para H2/H3,
párrafos, listas, negrita, cursiva, citas y enlaces validados. Sin HTML arbitrario.

## Home, caché y errores
LatestProducts está después de ConnectionSection y antes de Últimas ideas/FAQ.
Solicita page=1&limit=3; omite la sección si está vacía o el CMS no responde.
Grid: 3 columnas desktop, 2 tablet, 1 mobile. Ficha apilada en mobile.
Se reutilizan colores, tipografías, bordes, sombras y tarjetas del Blog.
Hover respeta prefers-reduced-motion.
Fetch no-store, rutas force-dynamic/revalidate=0 y timeout 5 segundos.
No hay caché persistente de productos. Un cambio a DRAFT se refleja en la
siguiente consulta al servidor; una página ya abierta no se actualiza sola.
404 de API usa notFound. Errores técnicos solo se registran server-side;
visitantes reciben estados amigables. SEO usa seo.title/description o name/
shortDescription; canonical requiere CONEXUS_SITE_URL.

## Verificación
npm run build
npx tsc --noEmit --incremental false
node --experimental-strip-types --test scripts/products.test.mjs scripts/cms.test.mjs scripts/diagnostic.test.mjs
Se comprobaron por HTTP catálogo real, categoría Alcohol, búsqueda coca, página
vacía, ambas fichas, SEO, media 200, slug inexistente 404, Blog y Home.
Las pruebas simulan CMS caído, vacío, borrador, precios ocultos, promoción,
monedas y grandes importes, stock, TipTap, galería SSR y paginación.
No se abrió un navegador: la validación visual responsive y la interacción real
de miniaturas quedan para la revisión en Chrome del usuario.

## Futuro V4
Esto es exclusivamente catálogo. No hay Comprar, carrito, checkout ni pagos.
V4 necesitará contratos y validación server-side propios para pedidos, stock,
precios vigentes y pagos. Los precios visibles nunca serán autoridad de cobro.
No implementar esa etapa reutilizando importes ni stock del cliente como fuente
de verdad. Confirmar antes la semántica pública global de visibilidad de precios.
