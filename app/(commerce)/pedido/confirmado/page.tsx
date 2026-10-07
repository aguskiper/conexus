import type { Metadata } from "next";
import { OrderConfirmation } from "@/components/cart/OrderConfirmation";
import { CommerceFrame } from "@/components/cart/CommerceFrame";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pedido recibido | Conexus Digital", robots: { index: false, follow: false } };
export default function Page() { return <CommerceFrame><OrderConfirmation /></CommerceFrame>; }
