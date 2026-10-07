import type { Metadata } from "next";
import { CartPage } from "@/components/cart/CartPage";
import { CommerceFrame } from "@/components/cart/CommerceFrame";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Carrito | Conexus Digital", robots: { index: false, follow: false } };
export default function Page() { return <CommerceFrame title="Tu carrito." kicker="TU SELECCIÓN" description="Revisá tus productos antes de continuar."><CartPage /></CommerceFrame>; }
