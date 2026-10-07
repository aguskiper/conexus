import type { Metadata } from "next";
import { PaymentReturnPage } from "@/components/payment/PaymentReturnPage";
import { validOrderNumber } from "@/lib/cms/payment-types";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Estado del pago | Conexus Digital", robots: { index: false, follow: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ orderNumber?: string }> }) {
  const query = await searchParams;
  // Ningún otro parámetro de Mercado Pago decide el estado.
  const orderNumber = query.orderNumber === undefined ? undefined : validOrderNumber(query.orderNumber) ? query.orderNumber : "";
  return <PaymentReturnPage mode="error" orderNumber={orderNumber} />;
}
