import Link from "next/link";
import type { ReactNode } from "react";
export function Button({ href, children, variant = "primary", className = "" }: { href: string; children: ReactNode; variant?: "primary" | "secondary" | "coral"; className?: string; }) {
  return <Link className={`button button--${variant} ${className}`} href={href}>{children}</Link>;
}
