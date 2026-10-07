import Link from "next/link";
import { getPosts, logCmsError } from "@/lib/cms/client";
import { BlogCard } from "./BlogCard";
import styles from "./Blog.module.css";

export async function LatestBlog() {
  let data;
  try {
    data = (await getPosts({ page: 1, limit: 3 })).data;
  } catch (error) { logCmsError("últimas notas", error); return null; }
  if (!data.length) return null;
  return <section className={styles.latest} aria-labelledby="latest-blog-title"><div className="container">
      <div className={styles.latestHeading}><div><p className="kicker"><span />DESDE EL BLOG</p><h2 id="latest-blog-title">Últimas <em>ideas.</em></h2><p>Ideas, recursos y conceptos para entender mejor el mundo web.</p></div><Link className="button button--secondary" href="/blog">Ver todas las notas <span aria-hidden="true">→</span></Link></div>
      <div className={styles.grid}>{data.map(post => <BlogCard key={post.slug} post={post} />)}</div>
    </div></section>;
}
