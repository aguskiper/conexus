import type { DiagnosticContact } from "@/lib/diagnostic/types";
import styles from "./Diagnostic.module.css";

export function DiagnosticContactForm({ contact, onChange }: { contact: DiagnosticContact; onChange: (contact: DiagnosticContact) => void }) {
  const fields = [
    { key: "name" as const, label: "Nombre", type: "text", autoComplete: "name", placeholder: "Tu nombre", required: true },
    { key: "company" as const, label: "Empresa (opcional)", type: "text", autoComplete: "organization", placeholder: "Tu empresa", required: false },
    { key: "whatsapp" as const, label: "WhatsApp", type: "tel", autoComplete: "tel", placeholder: "+54 9 11 1234 5678", required: true },
    { key: "email" as const, label: "Email", type: "email", autoComplete: "email", placeholder: "nombre@empresa.com", required: true },
  ];
  return (
    <>
      <div className={styles.contactGrid}>
        {fields.map(field => (
          <label className={styles.field} htmlFor={`diagnostic-${field.key}`} key={field.key}>{field.label}
            <input id={`diagnostic-${field.key}`} name={field.key} type={field.type} autoComplete={field.autoComplete} placeholder={field.placeholder} required={field.required} maxLength={field.key === "email" ? 254 : 160} value={contact[field.key]}
              pattern={field.key === "whatsapp" ? "[+0-9\\(\\) .\\-]{6,30}" : field.key === "name" ? ".*\\S.*" : undefined}
              title={field.key === "whatsapp" ? "Ingresá un número de teléfono con código de área (6 a 30 caracteres)." : undefined}
              onChange={event => onChange({ ...contact, [field.key]: event.target.value })}
            />
          </label>
        ))}
      </div>
      <p className={styles.localNote}>En esta versión, tus datos quedan solo en esta sesión del diagnóstico. No se envían automáticamente ni se guardan al recargar la página.</p>
    </>
  );
}
