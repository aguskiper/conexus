// Decimal strings + BigInt: nunca convertir importes a punto flotante.
export function formatMoney(value: string | null, currency: string): string | null {
  if (!value || !/^\d+(?:\.\d+)?$/.test(value) || !/^[A-Z]{3}$/.test(currency)) return null;
  try {
    const formatter = new Intl.NumberFormat("es-AR", { style: "currency", currency });
    const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
    const [whole, fraction = ""] = value.split(".");
    const scale = BigInt(10) ** BigInt(digits);
    let amount = BigInt(whole) * scale + BigInt(fraction.slice(0, digits).padEnd(digits, "0") || "0");
    if (Number(fraction[digits] || "0") >= 5) amount += BigInt(1);
    const minor = (amount % scale).toString().padStart(digits, "0");
    return formatter.formatToParts(amount / scale).map(part => part.type === "fraction" ? minor : part.value).join("");
  } catch { return null; }
}
