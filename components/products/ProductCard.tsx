import Link from "next/link";
import type { CmsProduct } from "@/lib/cms/product-types";
import { ProductPrice, ProductAvailability } from "./ProductPrice";
import common from "../blog/Blog.module.css";
import styles from "./Products.module.css";
export function ProductCard({ product }: { product: CmsProduct }) {
  return <article className={common.card}><Link className={common.cardLink} href={"/productos/" + encodeURIComponent(product.slug)}>
    <div className={common.cover}><div className={common.windowBar} aria-hidden="true"><i /><i /><i /><span>CONEXUS / CATÁLOGO</span></div>
      {/* Las URLs públicas del CMS se usan sin reconstruir rutas. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {product.featuredImage ? <img className={styles.cardImage} src={product.featuredImage} alt={product.featuredImageAlt || product.name} width={640} height={480} loading="lazy" /> : <div className={common.placeholder} aria-hidden="true"><span>✦</span><b>Conexus<br />Productos.</b></div>}
    </div>
    <div className={common.cardBody}><div className={common.cardMeta}>{product.category && <span>{product.category.name}</span>}</div><h3>{product.name}</h3>
      {product.shortDescription && <p>{product.shortDescription}</p>}<ProductPrice product={product} /><ProductAvailability product={product} />
      <span className={common.read}>Ver producto <span aria-hidden="true">→</span></span>
    </div>
  </Link></article>;
}
