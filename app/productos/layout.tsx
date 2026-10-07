import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
export default function ProductsLayout({ children }: { children: ReactNode }) {
  return <><a className="skip-link" href="#products-content">Saltar al contenido</a><Header /><main id="products-content">{children}</main><Footer /></>;
}
