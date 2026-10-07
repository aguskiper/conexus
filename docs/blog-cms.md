# Blog de Conexus Digital

El contenido vive exclusivamente en CONEXUS CMS. Esta web consume su API pública; no requiere base de datos, Prisma, autenticación ni escritura en el CMS.

## Configuración

Copiar las variables de .env.example a .env.local. Configurar CONEXUS_CMS_URL con el origen del CMS. Desarrollo: Digital en http://localhost:3000 y CMS en http://localhost:3001.
CONEXUS_SITE_URL es opcional y debe ser el origen HTTPS público definitivo de Digital; sin él se omiten los canonicals. No se emiten canonicals locales.

En producción configurar ambas variables en el entorno server-side del hosting y confirmar que el CMS devuelva las URLs públicas definitivas de sus imágenes. No usar variables NEXT_PUBLIC para esta integración.

## API y caché

lib/cms/client.ts centraliza las consultas, timeout de 5 segundos, manejo de 404 y registros sin URLs internas. lib/cms/normalize.ts valida el contrato observado: data y pagination; imagen como featuredImage; contenido como content y SEO como seo.
Las publicaciones provienen solo de endpoints públicos PUBLISHED; un status explícito distinto de PUBLISHED es rechazado.

Todas las consultas usan cache: no-store; /blog y /blog/[slug] son dinámicas, sin ISR ni caché persistente. Los filtros/paginación son enlaces server-side y usan category (slug), page y limit. Las páginas cargan 9 notas, la Home 3. No existe espejo local de publicaciones.
Un cliente que conserve una página abierta debe actualizarla para ver una retirada; no se utiliza polling ni eventos del CMS.

Las últimas notas se insertan entre ConnectionSection y FAQ con Suspense. Si no hay publicaciones o falla el CMS, la sección se omite. El Blog muestra estados amigables y las notas inexistentes usan notFound() y el límite 404 del Blog.

## TipTap e imágenes

lib/cms/tiptap.ts transforma solo los nodos permitidos en React, con contexto de bloque/lista/texto. No usa HTML arbitrario. Soporta H2/H3, listas, citas, saltos de línea y marks bold/italic/link. Descarta atributos y nodos desconocidos; limita profundidad y cantidad de nodos. Los textos se escapan mediante React.
lib/cms/urls.ts rechaza protocolos inseguros, controles, URLs con credenciales y links relativos de protocolo. Los links HTTP(S) abren con noopener noreferrer.

Las imágenes utilizan exactamente featuredImage del CMS en elementos img con dimensiones, alt específico o título, carga diferida en cards y prioridad en la nota. No requieren remotePatterns ni un proxy next/image. La API de media se consume a través de esa URL pública, sin reconstruir la key ni descargar/copiar imágenes.

## Comprobación

npm run build
node node_modules/typescript/bin/tsc --noEmit --incremental false
node --test scripts/cms.test.mjs

Probar también /blog?category=marketing, /blog?page=2 y un slug inexistente contra el CMS real. Las pruebas locales del contrato y renderer usan datos sintéticos exclusivamente en tests; las páginas nunca ofrecen publicaciones de fallback.

Antes de publicar: configurar orígenes HTTPS, validar URLs de media desde el CMS, revisar políticas CSP del hosting (img-src del CMS/CDN) y acceso de salida del servidor al CMS. El Blog no consulta APIs en el navegador; no necesita CORS para esas consultas.
