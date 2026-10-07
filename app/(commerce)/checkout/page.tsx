import type { Metadata } from "next";
import { CheckoutPage } from "@/components/cart/CheckoutPage";
import { CommerceFrame } from "@/components/cart/CommerceFrame";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Checkout | Conexus Digital", robots: { index: false, follow: false } };
export default function Page() { return <CommerceFrame title="Confirmá tu pedido." kicker="ÚLTIMO PASO" description="Completá tus datos y elegí cómo retirarlo."><CheckoutPage /></CommerceFrame>; }
