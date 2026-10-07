import type { DiagnosticAnswers, DiagnosticRecommendation, Feature } from "./types";

// Primero se evalúa la solución; la renovación o mejora prioriza la auditoría.
// Un catálogo sin pagos nunca se interpreta como una tienda online.
export function recommendDiagnostic(answers: DiagnosticAnswers): DiagnosticRecommendation {
  let solution: DiagnosticRecommendation["kind"] = "undetermined";
  if (answers.goal === "shop" || answers.features.includes("payment")) {
    solution = "ecommerce";
  } else if (answers.goal === "company") {
    solution = "corporate";
  } else if (answers.goal === "campaign") {
    solution = answers.features.includes("other") ? "undetermined" : answers.features.includes("catalog") ? "corporate" : "landing";
  } else if (answers.goal === "unsure" && answers.features.includes("catalog") && !answers.features.includes("other")) {
    solution = "corporate";
  }
  if (answers.goal === "renew" || answers.website === "improve") {
    return { kind: "audit", ...(solution !== "undetermined" ? { suggestedSolution: solution } : {}) };
  }
  return { kind: solution };
}

export function toggleDiagnosticFeature(features: Feature[], feature: Feature): Feature[] {
  if (feature === "unsure") return features.includes("unsure") ? [] : ["unsure"];
  const selected = features.filter(value => value !== "unsure");
  return selected.includes(feature) ? selected.filter(value => value !== feature) : [...selected, feature];
}
