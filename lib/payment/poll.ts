import type { PublicOrderStatus } from "@/lib/cms/payment-types";
import { terminalPayment } from "./state";
import { PaymentError } from "./errors";
export const POLL_INTERVAL = 3000, POLL_TIMEOUT = 45000;
export function abortableWait(delay: number, signal: AbortSignal): Promise<void> {
  return new Promise(resolve => {
    if (signal.aborted) { resolve(); return; }
    const finish = () => { clearTimeout(timer); signal.removeEventListener("abort", finish); resolve(); };
    const timer = setTimeout(finish, delay);
    signal.addEventListener("abort", finish, { once: true });
  });
}
export async function pollPayment(options: {
  fetchStatus: () => Promise<PublicOrderStatus>; onStatus: (status: PublicOrderStatus) => void;
  onError: (error: PaymentError) => void; onTimeout: () => void;
  signal: AbortSignal; visible?: () => boolean; wait?: (delay: number, signal: AbortSignal) => Promise<void>; now?: () => number;
}) {
  const now = options.now || Date.now, wait = options.wait || abortableWait, started = now();
  let attempts = 0;
  while (!options.signal.aborted && now() - started < POLL_TIMEOUT && attempts < 15) {
    if (options.visible && !options.visible()) { await wait(Math.min(1000, POLL_TIMEOUT - (now() - started)), options.signal); continue; }
    let delay = POLL_INTERVAL;
    try {
      attempts++;
      const status = await options.fetchStatus();
      if (options.signal.aborted) return;
      options.onStatus(status);
      if (terminalPayment(status)) return;
    } catch (error) {
      if (options.signal.aborted) return;
      const safe = error instanceof PaymentError ? error : new PaymentError("CMS_UNAVAILABLE");
      options.onError(safe);
      if (["NOT_FOUND", "TOKEN_UNAVAILABLE"].includes(safe.code)) return;
      if (safe.retryAfter) delay = Math.max(delay, safe.retryAfter * 1000);
    }
    const remaining = POLL_TIMEOUT - (now() - started);
    if (remaining <= 0) break;
    await wait(Math.min(delay, remaining), options.signal);
  }
  if (!options.signal.aborted) options.onTimeout();
}
