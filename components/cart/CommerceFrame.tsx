"use client";
import type { ReactNode } from "react";
import styles from "./Commerce.module.css";
export function CommerceFrame({ title, kicker, description, children }: { title?: string; kicker?: string; description?: string; children: ReactNode }) {
  return <section className={styles.page}><div className="container">{title && <header className={styles.intro}><p className="kicker"><span />{kicker}</p><h1>{title}</h1><p>{description}</p></header>}{children}</div></section>;
}
