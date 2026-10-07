import Link from "next/link";
import type { CmsCategory } from "@/lib/cms/types";
import { blogUrl } from "@/lib/cms/blog-links";
import styles from "./Blog.module.css";

export function BlogFilters({ categories, selected }: { categories: CmsCategory[]; selected?: string }) {
  return <nav className={styles.filters} aria-label="Filtrar notas por categoría">
    <Link href="/blog" aria-current={!selected ? "page" : undefined}>Todas</Link>
    {categories.map(category => <Link key={category.slug} href={blogUrl(1, category.slug)} aria-current={selected === category.slug ? "page" : undefined}>{category.name}</Link>)}
  </nav>;
}
