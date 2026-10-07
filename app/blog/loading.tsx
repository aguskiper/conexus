import styles from "@/components/blog/Blog.module.css";
export default function BlogLoading() {
  return <section className={styles.page}><div className="container"><p role="status" className={styles.loading}>Conectando ideas…</p></div></section>;
}
