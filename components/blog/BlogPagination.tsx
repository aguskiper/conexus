import Link from "next/link";
import { blogUrl } from "@/lib/cms/blog-links";
import styles from "./Blog.module.css";

export function BlogPagination({ page, totalPages, category }: { page: number; totalPages: number; category?: string }) {
  if (totalPages < 2) return null;
  return <nav className={styles.pagination} aria-label="Paginación del blog">
    {page > 1 ? <Link className="button button--secondary" href={blogUrl(page - 1, category)}>← Anterior</Link> : <span />}
    <span>Página {page} de {totalPages}</span>
    {page < totalPages ? <Link className="button button--secondary" href={blogUrl(page + 1, category)}>Siguiente →</Link> : <span />}
  </nav>;
}
