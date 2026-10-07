import styles from "./Diagnostic.module.css";

export function DiagnosticOption({ name, value, label, symbol, selected, multiple = false, onSelect }: {
  name: string; value: string; label: string; symbol: string; selected: boolean; multiple?: boolean; onSelect: () => void;
}) {
  return (
    <label className={`${styles.option} ${selected ? styles.optionSelected : ""}`}>
      <input type={multiple ? "checkbox" : "radio"} name={name} value={value} checked={selected} onChange={onSelect} />
      <span className={styles.optionSymbol} aria-hidden="true">{symbol}</span>
      <span>{label}</span>
      <span className={styles.optionCheck} aria-hidden="true">{selected ? "✓" : "+"}</span>
    </label>
  );
}
