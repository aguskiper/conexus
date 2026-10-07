import type * as Config from "./config";
import type { DiagnosticAnswers, DiagnosticRecommendation } from "./types";

type MessageConfig = Pick<typeof Config, "goalOptions" | "websiteOptions" | "featureOptions" | "stageOptions" | "results">;
export const DIAGNOSTIC_WHATSAPP_NUMBER = "5492614603581";

export function buildDiagnosticWhatsAppUrl(answers: DiagnosticAnswers, recommendation: DiagnosticRecommendation, config: MessageConfig): string {
  const label = (options: { value: string; label: string }[], value: string | null) => options.find(option => option.value === value)?.label ?? "Sin especificar";
  const message = [
    "Hola Conexus Digital, completé el Diagnóstico Web y quiero conversar sobre mi proyecto.",
    "",
    "DATOS DE CONTACTO",
    `Nombre: ${answers.contact.name.trim()}`,
    `Empresa: ${answers.contact.company.trim() || "No indicada"}`,
    `WhatsApp: ${answers.contact.whatsapp.trim()}`,
    `Email: ${answers.contact.email.trim()}`,
    "",
    "MI PROYECTO",
    `Objetivo: ${label(config.goalOptions, answers.goal)}`,
    `Web actual: ${label(config.websiteOptions, answers.website)}`,
    ...(answers.website !== "first" && answers.currentUrl.trim() ? [`URL actual: ${answers.currentUrl.trim()}`] : []),
    `Funcionalidades: ${answers.features.map(feature => label(config.featureOptions, feature)).join(", ") || "Sin especificar"}`,
    `Etapa: ${label(config.stageOptions, answers.stage)}`,
    "",
    `RECOMENDACIÓN: ${config.results[recommendation.kind].label}`,
    ...(recommendation.suggestedSolution ? [`Alternativa a evaluar tras la auditoría: ${config.results[recommendation.suggestedSolution].label}`] : []),
  ].join("\n");
  return `https://wa.me/${DIAGNOSTIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
