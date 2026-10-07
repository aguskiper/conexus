import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, logCmsError } from "@/lib/cms/client";
import { productionCanonical, metadataImage } from "@/lib/cms/urls";
import { ProductGallery } from "@/components/products/ProductGallery";
import { ProductPrice, ProductAvailability } from "@/components/products/ProductPrice";
import { TipTapContent } from "@/components/blog/TipTapContent";
import common from "@/components/blog/Blog.module.css";
import styles from "@/components/products/Products.module.css";
export const dynamic = "force-dynamic";
export const revalidate = 0;
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getProductBySlug(slug);
    if (!product) return { title: "Producto no encontrado | Conexus Digital", robots: { index: false } };
    const canonical = productionCanonical("/productos/" + encodeURIComponent(product.slug));
    const image = metadataImage(product.featuredImage);
    return { title: product.seo.title || product.name, description: product.seo.description || product.shortDescription,
      ...(canonical ? { alternates: { canonical } } : {}),
      openGraph: { title: product.seo.title || product.name, description: product.seo.description || product.shortDescription, ...(image ? { images: [{ url: image, alt: product.featuredImageAlt || product.name }] } : {}) } };
  } catch (error) { logCmsError("metadata de producto", error); return { title: "Productos | Conexus Digital", robots: { index: false } }; }
}
export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  let product;
  try { product = await getProductBySlug(slug); }
  catch (error) { logCmsError("producto", error); }
  if (product === undefined) return <section className={common.page}><div className={`container ${common.empty}`}><h1>Este producto estará de vuelta pronto.</h1><p>No pudimos cargarlo en este momento. Volvé a intentarlo en unos minutos.</p><Link href="/productos" className="button button--secondary">← Volver al catálogo</Link></div></section>;
  if (!product) notFound();
  const images = [...new Set([product.featuredImage, ...product.gallery].filter((url): url is string => Boolean(url)))];
  return <article className={common.article}><div className="container">
    <Link className={common.back} href="/productos">← Todos los productos</Link>
    <div className={styles.detail}><ProductGallery key={product.slug} images={images} name={product.name} alt={product.featuredImageAlt} />
      <header className={styles.summary}><div className={common.cardMeta}>{product.category && <span>{product.category.name}</span>}</div><h1>{product.name}</h1>
        {product.shortDescription && <p>{product.shortDescription}</p>}<ProductPrice product={product} /><ProductAvailability product={product} />
      </header>
    </div>
    <section className={styles.description} aria-labelledby="product-description"><h2 id="product-description">Sobre este producto</h2><TipTapContent content={product.description} /></section>
  </div></article>;
}
