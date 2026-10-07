import Link from "next/link";
import styles from "@/components/blog/Blog.module.css";
export default function BlogNotFound() {
  return <section className={styles.page}><div className={`container ${styles.empty}`}><span aria-hidden="true">?</span><h1>No encontramos esta nota.</h1><p>Puede que ya no esté disponible. Encontrá más ideas en nuestro blog.</p><Link className="button button--primary" href="/blog">Volver al blog →</Link></div></section>;
}
