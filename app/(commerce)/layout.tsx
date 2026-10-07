import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
export default function CommerceLayout({ children }: { children: ReactNode }) {
  return <><a className="skip-link" href="#commerce-content">Saltar al contenido</a><Header /><main id="commerce-content">{children}</main><Footer /></>;
}
