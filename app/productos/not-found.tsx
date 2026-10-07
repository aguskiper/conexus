import Link from "next/link";
import styles from "@/components/blog/Blog.module.css";
export default function ProductNotFound() {
  return <section className={styles.page}><div className={`container ${styles.empty}`}><span aria-hidden="true">✦</span><h1>No encontramos este producto.</h1><p>Puede que ya no esté disponible. Explorá el catálogo para conocer los productos publicados.</p><Link href="/productos" className="button button--secondary">Volver al catálogo →</Link></div></section>;
}
