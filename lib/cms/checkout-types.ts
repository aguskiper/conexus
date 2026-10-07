export interface CheckoutMethod { method: string; label: string; instructions: string }
export interface CheckoutSettings { enabled: boolean; currency: string; reservationMinutes: number; methods: CheckoutMethod[]; payment?: { enabled: boolean; provider: string | null; label: string } }
export interface OrderRequest {
  customer: { firstName: string; lastName: string; email: string; phone: string };
  items: { slug: string; quantity: number }[];
  shipping: { method: string };
  notes?: string;
}
export interface OrderReceipt { orderNumber: string; status: "PENDING_PAYMENT"; total: string; currency: string; publicStatusToken?: string }
export class CheckoutError extends Error {
  constructor(public readonly code: string, public readonly status: number = 503, public readonly retryAfter?: number) { super("Checkout request failed"); }
}
