import type { RefObject } from "react";
import { Button } from "../Button";
import { DiagnosticArt } from "./DiagnosticArt";
import styles from "./Diagnostic.module.css";

// Activar nuevamente cuando vuelva el camino de contacto directo.
const showDirectContact = false;

export function DiagnosticInitial({ onStart, startButtonRef }: { onStart: () => void; startButtonRef: RefObject<HTMLButtonElement | null> }) {
  return (
    <div className={`${styles.initial} ${styles.transition} ${showDirectContact ? "" : styles.diagnosticOnly}`}>
      {showDirectContact && (
      <div className={styles.initialPath}>
        <p className="kicker"><span />HABLEMOS</p>
        <h2 className={styles.initialTitle}>¿Creamos algo <em>juntos?</em></h2>
        <p className={styles.initialCopy}>Contanos qué necesitás y veamos cómo podemos llevarlo a la web.</p>
        <Button href="mailto:hola@conexus.digital" variant="coral">Empezar un proyecto <span aria-hidden="true">→</span></Button>
        <small className={styles.personal}>Respondemos personalmente. Sin formularios eternos.</small>
        <div className={styles.contactArt} aria-hidden="true">
          <div className="cta-mini-mascot"><i /><i /><span /></div>
          <div className="cta-nodes"><i /><span /><i /></div>
          <span className="cta-star">✦</span>
        </div>
      </div>
      )}
      <div className={styles.initialPath}>
        <p className="kicker"><span />TU DIAGNÓSTICO WEB</p>
        <h2 className={styles.initialTitle}>¿Qué web necesita <em>tu negocio?</em></h2>
        <p className={styles.initialCopy}>Respondé unas preguntas y descubrí qué solución puede adaptarse mejor a tu proyecto.</p>
        <button ref={startButtonRef} type="button" className="button button--primary" onClick={onStart}>Empezar diagnóstico <span aria-hidden="true">→</span></button>
        <span className={styles.time}><i aria-hidden="true">◷</i>Menos de 1 minuto</span>
        <DiagnosticArt />
      </div>
    </div>
  );
}
