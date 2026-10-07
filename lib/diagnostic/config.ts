import type { Feature, Goal, RecommendationKind, Stage, Website } from "./types";

export const goalOptions: { value: Goal; label: string; symbol: string }[] = [
  { value: "company", label: "Presentar mi empresa o servicios", symbol: "▤" },
  { value: "shop", label: "Vender productos online", symbol: "＋" },
  { value: "campaign", label: "Promocionar un producto o servicio específico", symbol: "◎" },
  { value: "renew", label: "Renovar una web que ya tengo", symbol: "↻" },
  { value: "unsure", label: "No estoy seguro", symbol: "?" },
];
export const websiteOptions: { value: Website; label: string; symbol: string }[] = [
  { value: "improve", label: "Sí, pero quiero mejorarla", symbol: "↗" },
  { value: "rebuild", label: "Sí, pero quiero hacerla de nuevo", symbol: "↻" },
  { value: "first", label: "No, sería mi primera web", symbol: "✦" },
];
export const featureOptions: { value: Feature; label: string; symbol: string }[] = [
  { value: "contact", label: "Formulario de contacto", symbol: "▤" },
  { value: "whatsapp", label: "WhatsApp", symbol: "↗" },
  { value: "catalog", label: "Catálogo de productos", symbol: "▦" },
  { value: "payment", label: "Compra y pago online", symbol: "＋" },
  { value: "other", label: "Otra", symbol: "✦" },
  { value: "unsure", label: "No estoy seguro", symbol: "?" },
];
export const stageOptions: { value: Stage; label: string; symbol: string }[] = [
  { value: "now", label: "Quiero comenzar cuanto antes", symbol: "↗" },
  { value: "comparing", label: "Ya estoy comparando propuestas", symbol: "▤" },
  { value: "planning", label: "Estoy planificando el proyecto", symbol: "◎" },
  { value: "exploring", label: "Solo quiero conocer mis opciones", symbol: "?" },
];
export const questionTitles = [
  "¿Qué querés lograr con tu web?",
  "¿Actualmente tenés una página web?",
  "¿Qué funcionalidades necesitás?",
  "¿En qué etapa está tu proyecto?",
  "¡Ya casi está! ¿A dónde podemos enviarte nuestra recomendación?",
];
export const results: Record<RecommendationKind, { label: string; title: string; text: string; benefits: string[]; cta: string }> = {
  landing: {
    label: "LANDING PAGE",
    title: "Una Landing Page puede ser un excelente punto de partida.",
    text: "Por lo que nos contaste, necesitás una página enfocada en presentar una propuesta concreta y convertir visitas en consultas.",
    benefits: ["Diseño responsive", "Formulario de contacto", "Integración con WhatsApp", "SEO técnico inicial"],
    cta: "Quiero recibir una propuesta",
  },
  corporate: {
    label: "SITIO WEB CORPORATIVO",
    title: "Tu proyecto necesita una presencia digital más completa.",
    text: "Un sitio web corporativo te permitirá presentar tu empresa, servicios y propuesta de valor de manera profesional.",
    benefits: ["Diseño personalizado", "Diseño responsive", "Secciones adaptadas a tu empresa", "Formularios de contacto", "Integración con WhatsApp", "SEO técnico inicial"],
    cta: "Quiero recibir una propuesta",
  },
  ecommerce: {
    label: "E-COMMERCE",
    title: "Tu proyecto necesita un E-commerce.",
    text: "Buscás mostrar productos, recibir pagos y gestionar ventas desde tu propia tienda online.",
    benefits: ["Tienda online", "Diseño responsive", "Hasta 10 productos cargados inicialmente", "Mercado Pago configurado", "Gestión de productos"],
    cta: "Quiero recibir una propuesta",
  },
  audit: {
    label: "AUDITORÍA GRATUITA",
    title: "Antes de empezar de nuevo, revisemos tu web actual.",
    text: "Podemos realizar una auditoría inicial gratuita para determinar qué se puede mejorar y si realmente necesitás desarrollar un sitio nuevo.",
    benefits: [],
    cta: "Solicitar auditoría gratuita",
  },
  undetermined: {
    label: "CONOZCAMOS TU PROYECTO",
    title: "Tu proyecto necesita un poco más de análisis.",
    text: "No todos los negocios necesitan el mismo tipo de web. Preferimos conocer mejor tu proyecto antes de recomendarte una solución.",
    benefits: [],
    cta: "Hablar con Conexus",
  },
};
