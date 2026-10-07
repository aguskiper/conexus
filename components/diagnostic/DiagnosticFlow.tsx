import { questionTitles } from "@/lib/diagnostic/config";
import { recommendDiagnostic } from "@/lib/diagnostic/recommend";
import type { DiagnosticAnswers } from "@/lib/diagnostic/types";
import { createDiagnosticAnswers } from "@/lib/diagnostic/types";
import { Logo } from "../Logo";
import { DiagnosticProgress } from "./DiagnosticProgress";
import { DiagnosticQuestion } from "./DiagnosticQuestion";
import { DiagnosticContactForm } from "./DiagnosticContactForm";
import { DiagnosticResult } from "./DiagnosticResult";
import styles from "./Diagnostic.module.css";

export function DiagnosticFlow({ answers, onChange, step, onStepChange, complete, onCompleteChange, onExit }: {
  answers: DiagnosticAnswers; onChange: (answers: DiagnosticAnswers) => void;
  step: number; onStepChange: (step: number) => void;
  complete: boolean; onCompleteChange: (complete: boolean) => void; onExit: () => void;
}) {
  const canContinue = step === 0 ? Boolean(answers.goal) : step === 1 ? Boolean(answers.website) : step === 2 ? answers.features.length > 0 : step === 3 ? Boolean(answers.stage) : true;
  return (
    <div className={`${styles.flow} ${styles.transition}`}>
      <div className={styles.flowHeader}>
        <Logo /><span className={styles.flowTag}>TU DIAGNÓSTICO WEB</span>
        <button type="button" className={styles.back} onClick={onExit}>{complete ? "← Volver al inicio" : "← Volver"}<span className={styles.srOnly}> a las opciones de contacto</span></button>
      </div>
      <DiagnosticProgress step={step} complete={complete} />
      <div key={complete ? "result" : step} className={styles.transition}>
        {complete ? (
          <>
            <DiagnosticResult answers={answers} recommendation={recommendDiagnostic(answers)} />
            <div className={styles.resultActions}>
              <button type="button" className={styles.back} onClick={() => { onCompleteChange(false); onStepChange(4); }}>← Revisar mis respuestas</button>
              <button type="button" className={styles.back} onClick={() => { onChange(createDiagnosticAnswers()); onStepChange(0); onCompleteChange(false); }}>↻ Hacer otro diagnóstico</button>
            </div>
          </>
        ) : (
          <form onSubmit={event => { event.preventDefault(); if (!canContinue) return; if (step === 4) onCompleteChange(true); else onStepChange(step + 1); }}>
            <h2 id="diagnostic-title" tabIndex={-1} data-diagnostic-heading className={styles.questionTitle}>{questionTitles[step]}</h2>
            <p className={styles.questionHint}>{step === 2 ? "Podés elegir más de una opción." : step === 4 ? "Tu recomendación se muestra al finalizar." : "Elegí la opción que mejor representa tu proyecto."}</p>
            {step < 4 ? <DiagnosticQuestion step={step} answers={answers} onChange={onChange} /> : <DiagnosticContactForm contact={answers.contact} onChange={contact => onChange({ ...answers, contact })} />}
            <div className={styles.navigation}>
              {step > 0 ? <button type="button" className={styles.back} onClick={() => onStepChange(step - 1)}>← Volver<span className={styles.srOnly}> a la pregunta anterior</span></button> : <span className={styles.questionHint}>Sin compromiso.</span>}
              <button type="submit" className="button button--primary" disabled={!canContinue}>{step === 4 ? "Ver mi recomendación" : "Continuar"}<span aria-hidden="true">→</span></button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
