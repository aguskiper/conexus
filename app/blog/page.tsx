import type { Metadata } from "next";
import Link from "next/link";
import { getCategories, getPosts, logCmsError } from "@/lib/cms/client";
import { productionCanonical } from "@/lib/cms/urls";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogFilters } from "@/components/blog/BlogFilters";
import { BlogPagination } from "@/components/blog/BlogPagination";
import styles from "@/components/blog/Blog.module.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export function generateMetadata(): Metadata {
  const canonical = productionCanonical("/blog");
  return { title: "Blog | Conexus Digital", description: "Diseño, desarrollo y recursos para ayudarte a entender y aprovechar mejor el mundo digital.", ...(canonical ? { alternates: { canonical } } : {}) };
}
export default async function BlogPage({ searchParams }: { searchParams: Promise<{ page?: string; category?: string }> }) {
  const query = await searchParams;
  const page = typeof query.page === "string" && /^\d{1,6}$/.test(query.page) ? Math.max(1, Number(query.page)) : 1;
  const category = typeof query.category === "string" && query.category.length <= 160 ? query.category : undefined;
  const [postsResponse, categoryResponse] = await Promise.allSettled([getPosts({ page, limit: 9, category }), getCategories()]);
  if (postsResponse.status === "rejected") logCmsError("listado", postsResponse.reason);
  if (categoryResponse.status === "rejected") logCmsError("categorías", categoryResponse.reason);
  const posts = postsResponse.status === "fulfilled" ? postsResponse.value : null;
  const categories = categoryResponse.status === "fulfilled" ? categoryResponse.value : [];
  return <section className={styles.page}><div className="container">
    <header className={styles.intro}><p className="kicker"><span />IDEAS QUE CONECTAN</p><h1>Ideas para llevar tu negocio <em>a la web.</em></h1><p>Diseño, desarrollo y recursos para ayudarte a entender y aprovechar mejor el mundo digital.</p><span className={styles.introArt} aria-hidden="true">↗</span></header>
    <BlogFilters categories={categories} selected={category} />
    <h2 className={styles.srOnly}>Notas del Blog</h2>
    {posts?.data.length ? <div className={styles.grid}>{posts.data.map(post => <BlogCard key={post.slug} post={post} />)}</div> : <div className={styles.empty}>
      <span aria-hidden="true">✦</span><h2>{!posts ? "Pronto volvemos con más ideas." : category ? "Todavía no hay notas para esta selección." : posts.pagination.total > 0 ? "No hay notas en esta página." : "Estamos preparando nuevos contenidos."}</h2>
      <p>{!posts ? "No pudimos cargar las notas en este momento. Podés volver a intentarlo en unos minutos." : "Mientras tanto, podés explorar nuestras soluciones para tu negocio."}</p>
      <Link className="button button--secondary" href={posts && (category || page > 1) ? "/blog" : "/#servicios"}>{posts && (category || page > 1) ? "Ver todas las notas →" : "Conocer nuestros servicios →"}</Link>
    </div>}
    {posts && <BlogPagination page={posts.pagination.page} totalPages={posts.pagination.totalPages} category={category} />}
  </div></section>;
}
