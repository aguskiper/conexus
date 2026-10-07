import styles from "./Diagnostic.module.css";

const labels = ["Objetivo", "Tu web", "Funciones", "Etapa", "Contacto"];

export function DiagnosticProgress({ step, complete }: { step: number; complete: boolean }) {
  return (
    <div className={styles.progress}>
      <p className={styles.stepLabel}>{complete ? "Diagnóstico completo" : `Paso ${step + 1} de 5`}</p>
      <ol aria-label="Progreso del diagnóstico" className={styles.nodes}>
        {labels.map((label, index) => (
          <li key={label} className={`${styles.node} ${index < step || complete ? styles.nodeDone : ""} ${index === step && !complete ? styles.nodeCurrent : ""}`} aria-current={index === step && !complete ? "step" : undefined}>
            <span className={styles.nodeDot} aria-hidden="true">{index < step || complete ? "✓" : index + 1}</span>
            <span className={styles.nodeLabel}>{label}<span className={styles.srOnly}>{index < step || complete ? ", completado" : index === step ? ", paso actual" : ", pendiente"}</span></span>
          </li>
        ))}
      </ol>
    </div>
  );
}
