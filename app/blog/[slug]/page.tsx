import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, logCmsError } from "@/lib/cms/client";
import { productionCanonical, metadataImage } from "@/lib/cms/urls";
import { publishedDate } from "@/lib/cms/blog-links";
import { TipTapContent } from "@/components/blog/TipTapContent";
import styles from "@/components/blog/Blog.module.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await getPostBySlug(slug);
    if (!post) return { title: "Nota no encontrada | Conexus Digital", robots: { index: false } };
    const canonical = productionCanonical("/blog/" + encodeURIComponent(post.slug));
    const image = metadataImage(post.featuredImage);
    return { title: post.seo.title || post.title, description: post.seo.description || post.excerpt,
      ...(canonical ? { alternates: { canonical } } : {}),
      openGraph: { type: "article", title: post.seo.title || post.title, description: post.seo.description || post.excerpt, publishedTime: post.publishedAt, ...(image ? { images: [{ url: image, alt: post.featuredImageAlt || post.title }] } : {}) } };
  } catch (error) { logCmsError("metadata", error); return { title: "Blog | Conexus Digital", robots: { index: false } }; }
}
export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  let post;
  try { post = await getPostBySlug(slug); }
  catch (error) {
    logCmsError("nota", error);
    return <section className={styles.page}><div className={`container ${styles.empty}`}><span aria-hidden="true">✦</span><h1>Esta idea estará de vuelta pronto.</h1><p>No pudimos cargar la nota en este momento. Volvé a intentarlo en unos minutos.</p><Link className="button button--secondary" href="/blog">← Volver al blog</Link></div></section>;
  }
  if (!post) notFound();
  return <article className={styles.article}><div className="container">
    <Link className={styles.back} href="/blog">← Todas las notas</Link>
    <header className={styles.articleHeading}>
      <div className={styles.cardMeta}>{post.category && <span>{post.category.name}</span>}<time dateTime={post.publishedAt}>{publishedDate(post.publishedAt)}</time></div>
      <h1>{post.title}</h1>{post.excerpt && <p>{post.excerpt}</p>}
    </header>
    {post.featuredImage && <div className={styles.articleCover}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={post.featuredImage} alt={post.featuredImageAlt || post.title} width={1200} height={750} fetchPriority="high" />
    </div>}
    <TipTapContent content={post.content} />
    <div className={styles.articleEnd}><p>¿Llevamos estas ideas a tu negocio?</p><Link className="button button--primary" href="/#contacto">Descubrir qué web necesito →</Link></div>
  </div></article>;
}
