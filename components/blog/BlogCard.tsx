import Link from "next/link";
import type { CmsPost } from "@/lib/cms/types";
import { publishedDate } from "@/lib/cms/blog-links";
import styles from "./Blog.module.css";

export function BlogCard({ post }: { post: CmsPost }) {
  return (
    <article className={styles.card}>
      <Link href={`/blog/${encodeURIComponent(post.slug)}`} className={styles.cardLink}>
        <div className={styles.cover}>
          <div className={styles.windowBar} aria-hidden="true"><i /><i /><i /><span>conexus / ideas</span></div>
          {post.featuredImage ? (
            // URL pública entregada por el CMS: sin proxy ni rutas reconstruidas.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.featuredImage} alt={post.featuredImageAlt || post.title} width={960} height={600} loading="lazy" decoding="async" />
          ) : <div className={styles.placeholder} aria-hidden="true"><span>↗</span><b>Ideas que<br />conectan.</b><i>✦</i></div>}
        </div>
        <div className={styles.cardBody}>
          <div className={styles.cardMeta}>{post.category && <span>{post.category.name}</span>}<time dateTime={post.publishedAt}>{publishedDate(post.publishedAt)}</time></div>
          <h3>{post.title}</h3>
          {post.excerpt && <p>{post.excerpt}</p>}
          <span className={styles.read}>Leer nota <span aria-hidden="true">→</span><span className={styles.srOnly}>: {post.title}</span></span>
        </div>
      </Link>
    </article>
  );
}
