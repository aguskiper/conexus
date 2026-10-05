import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Conexus Digital | Diseño y desarrollo web para empresas",
  description: "Diseñamos y desarrollamos sitios web modernos, rápidos y pensados para ayudar a empresas a crecer en el mundo digital.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
