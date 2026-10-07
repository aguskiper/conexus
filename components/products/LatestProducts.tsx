import Link from "next/link";
import { getProducts, logCmsError } from "@/lib/cms/client";
import { ProductCard } from "./ProductCard";
import common from "../blog/Blog.module.css";
import styles from "./Products.module.css";
export async function LatestProducts() {
  let products;
  try { products = await getProducts({ page: 1, limit: 3 }); }
  catch (error) { logCmsError("productos recientes", error); return null; }
  if (!products.data.length) return null;
  return <section className={styles.latest} aria-labelledby="latest-products-title"><div className="container">
    <div className={common.latestHeading}><div><p className="kicker"><span />CATÁLOGO</p><h2 id="latest-products-title">Productos<em> que conectan.</em></h2><p>Explorá las últimas incorporaciones a nuestro catálogo.</p></div><Link className="button button--secondary" href="/productos">Ver todos los productos →</Link></div>
    <div className={common.grid}>{products.data.map(product => <ProductCard key={product.slug} product={product} />)}</div>
  </div></section>;
}
