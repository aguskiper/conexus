export type Goal = "company" | "shop" | "campaign" | "renew" | "unsure";
export type Website = "improve" | "rebuild" | "first";
export type Feature = "contact" | "whatsapp" | "catalog" | "payment" | "other" | "unsure";
export type Stage = "now" | "comparing" | "planning" | "exploring";
export type RecommendationKind = "landing" | "corporate" | "ecommerce" | "audit" | "undetermined";
export interface DiagnosticContact { name: string; company: string; whatsapp: string; email: string }
export interface DiagnosticAnswers {
  goal: Goal | null;
  website: Website | null;
  currentUrl: string;
  features: Feature[];
  stage: Stage | null;
  contact: DiagnosticContact;
}
export interface DiagnosticRecommendation {
  kind: RecommendationKind;
  suggestedSolution?: Exclude<RecommendationKind, "audit" | "undetermined">;
}
export function createDiagnosticAnswers(): DiagnosticAnswers {
  return { goal: null, website: null, currentUrl: "", features: [], stage: null, contact: { name: "", company: "", whatsapp: "", email: "" } };
}
