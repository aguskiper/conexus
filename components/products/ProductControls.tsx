import Link from "next/link";
import type { CmsCategory } from "@/lib/cms/types";
import { productsUrl } from "@/lib/cms/product-links";
import common from "../blog/Blog.module.css";
import styles from "./Products.module.css";
export function ProductControls({ categories, category, q }: { categories: CmsCategory[]; category?: string; q?: string }) {
  return <><form action="/productos" method="get" role="search" className={styles.search}>
    <label htmlFor="product-search" className={common.srOnly}>Buscar productos</label>
    <input id="product-search" name="q" type="search" placeholder="Buscar productos..." defaultValue={q} maxLength={200} />
    {category && <input type="hidden" name="category" value={category} />}
    <button className="button button--primary" type="submit">Buscar <span aria-hidden="true">→</span></button>
    {q && <Link href={productsUrl({ category })} className={styles.clear}>Limpiar búsqueda</Link>}
  </form><nav className={common.filters} aria-label="Categorías de productos">
    <Link href={productsUrl({ q })} aria-current={!category ? "page" : undefined}>Todos</Link>
    {categories.map(item => <Link key={item.slug} href={productsUrl({ category: item.slug, q })} aria-current={category === item.slug ? "page" : undefined}>{item.name}</Link>)}
  </nav></>;
}
export function ProductPagination({ page, totalPages, category, q }: { page: number; totalPages: number; category?: string; q?: string }) {
  if (totalPages <= 1) return null;
  return <nav className={common.pagination} aria-label="Paginación de productos">
    {page > 1 ? <Link className="button button--secondary" href={productsUrl({ page: page - 1, category, q })}>← Anterior</Link> : <span />}
    <span>Página {page} de {totalPages}</span>
    {page < totalPages ? <Link className="button button--secondary" href={productsUrl({ page: page + 1, category, q })}>Siguiente →</Link> : <span />}
  </nav>;
}
