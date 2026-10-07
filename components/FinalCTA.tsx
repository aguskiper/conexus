"use client";

import { useEffect, useRef, useState } from "react";
import { createDiagnosticAnswers } from "@/lib/diagnostic/types";
import { DiagnosticInitial } from "./diagnostic/DiagnosticInitial";
import { DiagnosticFlow } from "./diagnostic/DiagnosticFlow";
import styles from "./diagnostic/Diagnostic.module.css";

export function FinalCTA() {
  const [active, setActive] = useState(false);
  const [answers, setAnswers] = useState(createDiagnosticAnswers);
  const [step, setStep] = useState(0);
  const [complete, setComplete] = useState(false);
  const section = useRef<HTMLElement>(null);
  const startButton = useRef<HTMLButtonElement>(null);
  const wasActive = useRef(false);

  useEffect(() => {
    if (active) {
      wasActive.current = true;
      const frame = requestAnimationFrame(() => {
        const heading = section.current?.querySelector<HTMLElement>("[data-diagnostic-heading]");
        heading?.focus({ preventScroll: true });
        heading?.scrollIntoView({ block: "nearest", behavior: "instant" });
      });
      return () => cancelAnimationFrame(frame);
    }
    if (wasActive.current) {
      startButton.current?.focus({ preventScroll: true });
      startButton.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
    }
  }, [active, step, complete]);

  return (
    <section ref={section} className="final-cta section-pad" id="contacto" aria-label="Contacto y diagnóstico web">
      <div className={`container final-cta__inner ${styles.shell}`}>
        {active ? (
          <DiagnosticFlow answers={answers} onChange={setAnswers} step={step} onStepChange={setStep} complete={complete} onCompleteChange={setComplete} onExit={() => setActive(false)} />
        ) : (
          <DiagnosticInitial onStart={() => { setStep(0); setComplete(false); setActive(true); }} startButtonRef={startButton} />
        )}
      </div>
    </section>
  );
}
