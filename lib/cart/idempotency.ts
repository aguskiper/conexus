import type { OrderRequest } from "@/lib/cms/checkout-types";
export const ATTEMPT_KEY = "conexus-checkout-attempt-v1";
export interface Attempt { key: string; fingerprint: string }
export function pendingAttempt(storage: Pick<Storage, "getItem">): Attempt | null {
  try {
    const value = JSON.parse(storage.getItem(ATTEMPT_KEY) || "null");
    return value && typeof value.key === "string" && /^[a-f0-9-]{36}$/i.test(value.key) && typeof value.fingerprint === "string" && /^[a-f0-9]{64}$/i.test(value.fingerprint) ? { key: value.key, fingerprint: value.fingerprint } : null;
  } catch { return null; }
}
export async function checkoutAttempt(payload: OrderRequest, storage: Pick<Storage, "getItem" | "setItem">): Promise<Attempt> {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const fingerprint = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), byte => byte.toString(16).padStart(2, "0")).join("");
  const existing = pendingAttempt(storage);
  if (existing) {
    if (existing.fingerprint !== fingerprint) throw new Error("PENDING_ATTEMPT");
    return existing;
  }
  const attempt = { key: crypto.randomUUID(), fingerprint };
  storage.setItem(ATTEMPT_KEY, JSON.stringify(attempt));
  return attempt;
}
export function finishAttempt(storage: Pick<Storage, "removeItem">) { storage.removeItem(ATTEMPT_KEY); }
