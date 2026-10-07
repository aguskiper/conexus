"use client";
import { useState } from "react";
import styles from "./Products.module.css";
export function ProductGallery({ images, name, alt }: { images: string[]; name: string; alt?: string | null }) {
  const [selected, setSelected] = useState(0);
  if (!images.length) return <div className={styles.galleryEmpty} aria-label={"Sin imagen de " + name}><span aria-hidden="true">✦</span></div>;
  const current = Math.min(selected, images.length - 1);
  return <div className={styles.gallery}>
    <div className={styles.mainImage}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={images[current]} alt={alt || name} width={960} height={960} fetchPriority="high" />
    </div>
    {images.length > 1 && <div className={styles.thumbnails} role="group" aria-label={"Galería de " + name}>{images.map((url, index) => <button key={url} type="button" aria-label={"Ver imagen " + (index + 1) + " de " + name} aria-pressed={current === index} onClick={() => setSelected(index)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" width={90} height={90} loading="lazy" />
    </button>)}</div>}
    <p className={styles.galleryCaption} aria-live="polite">Imagen {current + 1} de {images.length}</p>
  </div>;
}
