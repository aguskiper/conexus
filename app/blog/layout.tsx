import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function BlogLayout({ children }: { children: ReactNode }) {
  return <><a className="skip-link" href="#blog-content">Saltar al contenido</a><Header /><main id="blog-content">{children}</main><Footer /></>;
}
