import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createDiagnosticAnswers } from "../lib/diagnostic/types.ts";
import { recommendDiagnostic, toggleDiagnosticFeature } from "../lib/diagnostic/recommend.ts";
import * as config from "../lib/diagnostic/config.ts";
import { buildDiagnosticWhatsAppUrl } from "../lib/diagnostic/whatsapp.ts";

const cases = [
  ["vender productos", { goal: "shop" }, "ecommerce"],
  ["pago online prevalece sobre empresa", { goal: "company", features: ["payment"] }, "ecommerce"],
  ["objetivo incierto con pagos", { goal: "unsure", features: ["payment"] }, "ecommerce"],
  ["campaña con contacto", { goal: "campaign", features: ["contact", "whatsapp"] }, "landing"],
  ["campaña con catálogo sin pagos", { goal: "campaign", features: ["catalog"] }, "corporate"],
  ["presentar empresa", { goal: "company", features: ["contact"] }, "corporate"],
  ["catálogo sin pagos no es una tienda", { goal: "unsure", features: ["catalog"] }, "corporate"],
  ["objetivo incierto", { goal: "unsure", features: ["unsure"] }, "undetermined"],
  ["contacto solo no define una solución", { goal: "unsure", features: ["contact", "whatsapp"] }, "undetermined"],
  ["renovación prioriza auditoría", { goal: "renew", website: "rebuild" }, "audit"],
  ["renovación con pagos mantiene auditoría como primer paso", { goal: "renew", features: ["payment"] }, "audit"],
  ["funciones especiales requieren análisis", { goal: "campaign", features: ["other"] }, "undetermined"],
  ["mejorar web prioriza auditoría", { goal: "shop", website: "improve", features: ["payment"] }, "audit"],
  ["rehacer tienda sin objetivo de renovación", { goal: "shop", website: "rebuild" }, "ecommerce"],
];

test("WhatsApp incluye todas las respuestas y datos con caracteres especiales", () => {
  const answers = {
    ...createDiagnosticAnswers(), goal: "company", website: "improve", currentUrl: "https://ejemplo.com/?a=1&b=2",
    features: ["catalog", "whatsapp"], stage: "planning",
    contact: { name: "María & Juan", company: "Empresa + Diseño", whatsapp: "+54 9 261 1234567", email: "hola+web@ejemplo.com" },
  };
  const before = structuredClone(answers);
  const url = new URL(buildDiagnosticWhatsAppUrl(answers, recommendDiagnostic(answers), config));
  assert.equal(url.origin, "https://wa.me");
  assert.equal(url.pathname, "/5492614603581");
  const text = url.searchParams.get("text");
  for (const value of [...Object.values(answers.contact), answers.currentUrl, "Presentar mi empresa o servicios", "Sí, pero quiero mejorarla", "Catálogo de productos, WhatsApp", "Estoy planificando el proyecto", "AUDITORÍA GRATUITA", "SITIO WEB CORPORATIVO"]) assert.ok(text.includes(value));
  assert.equal([...url.searchParams.keys()].length, 1);
  assert.deepEqual(answers, before);
});
test("WhatsApp excluye una URL anterior cuando ahora sería la primera web", () => {
  const answers = { ...createDiagnosticAnswers(), goal: "shop", website: "first", currentUrl: "https://anterior.com" };
  const text = new URL(buildDiagnosticWhatsAppUrl(answers, recommendDiagnostic(answers), config)).searchParams.get("text");
  assert.ok(text.includes("E-COMMERCE"));
  assert.ok(text.includes("Empresa: No indicada"));
  assert.ok(!text.includes("https://anterior.com"));
});
for (const [name, changes, expected] of cases) {
  test(name, () => {
    const answers = { ...createDiagnosticAnswers(), ...changes };
    const before = structuredClone(answers);
    assert.equal(recommendDiagnostic(answers).kind, expected);
    assert.deepEqual(answers, before);
  });
}
test("auditoría conserva la solución sugerida para futuras integraciones", () => {
  assert.deepEqual(recommendDiagnostic({ ...createDiagnosticAnswers(), goal: "shop", website: "improve" }), { kind: "audit", suggestedSolution: "ecommerce" });
});
test("No estoy seguro es excluyente sin mutar respuestas anteriores", () => {
  const original = ["contact", "whatsapp"];
  assert.deepEqual(toggleDiagnosticFeature(original, "unsure"), ["unsure"]);
  assert.deepEqual(original, ["contact", "whatsapp"]);
  assert.deepEqual(toggleDiagnosticFeature(["unsure"], "payment"), ["payment"]);
  assert.deepEqual(toggleDiagnosticFeature(["contact"], "contact"), []);
});
test("cada sesión tiene su propio objeto de respuestas y contacto", () => {
  const first = createDiagnosticAnswers();
  first.contact.name = "Prueba";
  first.features.push("contact");
  assert.equal(createDiagnosticAnswers().contact.name, "");
  assert.deepEqual(createDiagnosticAnswers().features, []);
});
test("WhatsApp valida formato compatible con patrones HTML modernos", () => {
  const source = readFileSync(new URL("../components/diagnostic/DiagnosticContactForm.tsx", import.meta.url), "utf8");
  const literal = source.match(/pattern=\{field.key === "whatsapp" \? ("(?:[^"\\]|\\.)*")/)[1];
  const pattern = new RegExp("^(?:" + JSON.parse(literal) + ")$", "v");
  assert.ok(pattern.test("+54 9 (11) 1234-5678"));
  assert.ok(!pattern.test("no es un teléfono"));
});
test("configuración de opciones coincide con el alcance vigente", () => {
  const config = readFileSync(new URL("../lib/diagnostic/config.ts", import.meta.url), "utf8");
  const groups = ["goalOptions", "websiteOptions", "featureOptions", "stageOptions"];
  const expected = [["company", "shop", "campaign", "renew", "unsure"], ["improve", "rebuild", "first"], ["contact", "whatsapp", "catalog", "payment", "other", "unsure"], ["now", "comparing", "planning", "exploring"]];
  groups.forEach((group, index) => {
    const block = config.slice(config.indexOf("export const " + group)).split("];")[0];
    assert.deepEqual([...block.matchAll(/value: "([^"]+)"/g)].map(match => match[1]), expected[index]);
  });
});
