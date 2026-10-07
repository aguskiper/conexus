import { featureOptions, goalOptions, stageOptions, websiteOptions } from "@/lib/diagnostic/config";
import { toggleDiagnosticFeature } from "@/lib/diagnostic/recommend";
import type { DiagnosticAnswers } from "@/lib/diagnostic/types";
import { DiagnosticOption } from "./DiagnosticOption";
import styles from "./Diagnostic.module.css";

export function DiagnosticQuestion({ step, answers, onChange }: { step: number; answers: DiagnosticAnswers; onChange: (answers: DiagnosticAnswers) => void }) {
  const options = step === 0 ? goalOptions : step === 1 ? websiteOptions : step === 2 ? featureOptions : stageOptions;
  return (
    <>
      <fieldset className={styles.fieldset}>
        <legend className={styles.srOnly}>{step === 2 ? "Seleccioná una o más funcionalidades" : "Seleccioná una opción"}</legend>
        <div className={styles.options}>
          {options.map(option => (
            <DiagnosticOption key={option.value} name={`diagnostic-step-${step}`} {...option} multiple={step === 2}
              selected={step === 0 ? answers.goal === option.value : step === 1 ? answers.website === option.value : step === 2 ? answers.features.includes(option.value as typeof answers.features[number]) : answers.stage === option.value}
              onSelect={() => {
                if (step === 0) onChange({ ...answers, goal: option.value as DiagnosticAnswers["goal"] });
                else if (step === 1) onChange({ ...answers, website: option.value as DiagnosticAnswers["website"] });
                else if (step === 2) onChange({ ...answers, features: toggleDiagnosticFeature(answers.features, option.value as typeof answers.features[number]) });
                else onChange({ ...answers, stage: option.value as DiagnosticAnswers["stage"] });
              }}
            />
          ))}
        </div>
      </fieldset>
      {step === 1 && answers.website && answers.website !== "first" && (
        <label className={styles.field} htmlFor="diagnostic-url">¿Cuál es tu página actual? <span>(opcional)</span>
          <input id="diagnostic-url" type="url" inputMode="url" autoComplete="url" placeholder="https://tuempresa.com" maxLength={2048} value={answers.currentUrl} onChange={event => onChange({ ...answers, currentUrl: event.target.value })} />
        </label>
      )}
    </>
  );
}
