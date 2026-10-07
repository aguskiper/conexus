"use client";
import { CommerceFrame } from "@/components/cart/CommerceFrame";
import { PaymentStatusPanel, type PaymentReturn } from "./PaymentStatusPanel";
export function PaymentReturnPage({ mode, orderNumber }: { mode: PaymentReturn; orderNumber?: string }) {
  return <CommerceFrame><PaymentStatusPanel mode={mode} orderNumber={orderNumber} /></CommerceFrame>;
}
