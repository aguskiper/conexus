"use client";
import { MAX_QUANTITY } from "@/lib/cart/model";
import styles from "./Commerce.module.css";
export function QuantityControl({ value, onChange, max = MAX_QUANTITY, disabled = false, label = "Cantidad" }: { value: number; onChange: (value: number) => void; max?: number; disabled?: boolean; label?: string }) {
  return <div className={styles.quantity} role="group" aria-label={label}>
    <button type="button" aria-label={"Disminuir " + label.toLowerCase()} disabled={disabled || value <= 1} onClick={() => onChange(value - 1)}>−</button>
    <output aria-live="polite">{value}</output>
    <button type="button" aria-label={"Aumentar " + label.toLowerCase()} disabled={disabled || value >= max} onClick={() => onChange(value + 1)}>+</button>
  </div>;
}
