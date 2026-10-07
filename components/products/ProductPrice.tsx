import { formatMoney } from "@/lib/cms/money";
import type { CmsProduct } from "@/lib/cms/product-types";
import styles from "./Products.module.css";
export function ProductPrice({ product }: { product: CmsProduct }) {
  if (!product.showPrices) return null;
  const regular = formatMoney(product.price, product.currency), sale = formatMoney(product.salePrice, product.currency);
  if (!regular && !sale) return null;
  return <div className={styles.price}>{sale ? <>{regular && <del aria-label="Precio regular">{regular}</del>}<strong aria-label="Precio promocional">{sale}</strong></> : <strong>{regular}</strong>}</div>;
}
export function ProductAvailability({ product }: { product: CmsProduct }) {
  return <span className={product.stock.available ? styles.available : styles.unavailable}>{product.stock.available ? "Disponible" : "Sin stock"}</span>;
}
