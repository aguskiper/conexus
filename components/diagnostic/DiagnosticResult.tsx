import * as config from "@/lib/diagnostic/config";
import type { DiagnosticAnswers, DiagnosticRecommendation } from "@/lib/diagnostic/types";
import { buildDiagnosticWhatsAppUrl } from "@/lib/diagnostic/whatsapp";
import { DiagnosticArt } from "./DiagnosticArt";
import styles from "./Diagnostic.module.css";

export function DiagnosticResult({ answers, recommendation }: { answers: DiagnosticAnswers; recommendation: DiagnosticRecommendation }) {
  const result = config.results[recommendation.kind];
  const whatsappUrl = buildDiagnosticWhatsAppUrl(answers, recommendation, config);
  return (
    <div className={styles.result}>
      <div>
        <p className="kicker"><span />{result.label}</p>
        <h2 id="diagnostic-title" tabIndex={-1} data-diagnostic-heading>{result.title}</h2>
        <p className={styles.resultText}>{result.text}</p>
        {result.benefits.length > 0 && <ul className={styles.resultBenefits}>{result.benefits.map(benefit => <li key={benefit}><span aria-hidden="true">✓</span>{benefit}</li>)}</ul>}
        <a className="button button--primary" href={whatsappUrl} target="_blank" rel="noopener noreferrer">{result.cta}<span aria-hidden="true">→</span><span className={styles.srOnly}> por WhatsApp (abre una nueva pestaña)</span></a>
        <p className={styles.localNote}>Se abrirá WhatsApp con tus respuestas, datos de contacto y recomendación. Podés revisar el mensaje antes de enviarlo.</p>
      </div>
      <DiagnosticArt resolved />
    </div>
  );
}
