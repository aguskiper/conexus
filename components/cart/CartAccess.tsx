"use client";
import Link from "next/link";
import { useCart } from "./CartProvider";
import styles from "./Commerce.module.css";
export function CartAccess({ onNavigate }: { onNavigate?: () => void }) {
  const { settings, totalItems, ready } = useCart();
  if (!settings?.enabled) return null;
  return <Link href="/carrito" className={styles.access} onClick={onNavigate} aria-label={`Carrito: ${ready ? totalItems : 0} unidades`}><span aria-hidden="true">▱</span><span>Carrito</span><b>{ready ? totalItems : 0}</b></Link>;
}
