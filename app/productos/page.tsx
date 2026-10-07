import type { Metadata } from "next";
import Link from "next/link";
import { getProducts, getProductCategories, logCmsError } from "@/lib/cms/client";
import { productionCanonical } from "@/lib/cms/urls";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductControls, ProductPagination } from "@/components/products/ProductControls";
import styles from "@/components/blog/Blog.module.css";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export function generateMetadata(): Metadata {
  const canonical = productionCanonical("/productos");
  return { title: "Productos | Conexus Digital", description: "Explorá nuestro catálogo de productos, sus características y disponibilidad.", ...(canonical ? { alternates: { canonical } } : {}) };
}
export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ page?: string; category?: string; q?: string }> }) {
  const query = await searchParams;
  const page = typeof query.page === "string" && /^\d{1,6}$/.test(query.page) ? Math.max(1, Number(query.page)) : 1;
  const category = typeof query.category === "string" && query.category.length <= 160 ? query.category : undefined;
  const q = typeof query.q === "string" ? query.q.trim().slice(0, 200) : undefined;
  const [productResponse, categoryResponse] = await Promise.allSettled([getProducts({ page, limit: 12, category, q }), getProductCategories()]);
  if (productResponse.status === "rejected") logCmsError("catálogo", productResponse.reason);
  if (categoryResponse.status === "rejected") logCmsError("categorías de productos", categoryResponse.reason);
  const products = productResponse.status === "fulfilled" ? productResponse.value : null;
  const categories = categoryResponse.status === "fulfilled" ? categoryResponse.value : [];
  return <section className={styles.page}><div className="container">
    <header className={styles.intro}><p className="kicker"><span />EXPLORÁ EL CATÁLOGO</p><h1>Productos<em> que conectan.</em></h1><p>Conocé nuestros productos, sus características y disponibilidad.</p><span className={styles.introArt} aria-hidden="true">✦</span></header>
    <ProductControls categories={categories} category={category} q={q} />
    <h2 className={styles.srOnly}>Productos del catálogo</h2>
    {products?.data.length ? <div className={styles.grid}>{products.data.map(product => <ProductCard key={product.slug} product={product} />)}</div> : <div className={styles.empty}>
      <span aria-hidden="true">✦</span><h2>{!products ? "El catálogo estará de vuelta pronto." : category || q ? "No encontramos productos para esta selección." : products.pagination.total > 0 ? "No hay productos en esta página." : "Todavía no hay productos disponibles."}</h2>
      <p>{!products ? "No pudimos cargar los productos en este momento. Volvé a intentarlo en unos minutos." : "Podés explorar el catálogo completo o volver más adelante."}</p>
      {(category || q || page > 1) && <Link className="button button--secondary" href="/productos">Ver todos los productos →</Link>}
    </div>}
    {products && <ProductPagination page={products.pagination.page} totalPages={products.pagination.totalPages} category={category} q={q} />}
  </div></section>;
}
