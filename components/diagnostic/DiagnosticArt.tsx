import styles from "./Diagnostic.module.css";

export function DiagnosticArt({ resolved = false }: { resolved?: boolean }) {
  return (
    <div className={styles.art} aria-hidden="true">
      <div className={styles.artHalo} />
      <svg viewBox="0 0 320 220" className={styles.artWires}><path d="M55 60Q130 30 160 105T280 145M55 170Q85 120 160 105T263 42" /><circle cx="55" cy="60" r="10" /><circle cx="55" cy="170" r="10" /><circle cx="280" cy="145" r="10" /><circle cx="263" cy="42" r="10" /></svg>
      <div className={styles.artWindow}>
        <div className={styles.artBar}><i /><i /><i /><span>conexus / tu web</span></div>
        <div className={styles.artBody}><div><b /><b /><span /><span /><small>{resolved ? "TU PRÓXIMO PASO" : "CONECTAMOS IDEAS"}</small></div><div className={styles.artFace}><i /><i /><span /></div></div>
      </div>
      <span className={styles.artCursor}>↖</span>
      <span className={styles.artBadge}>{resolved ? "✓" : "?"}</span>
      <span className={styles.artSpark}>✦</span>
    </div>
  );
}
