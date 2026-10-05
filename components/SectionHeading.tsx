import type { ReactNode } from "react";
export function SectionHeading({ kicker, children, light = false }: { kicker: string; children: ReactNode; light?: boolean }) { return <div className={`section-heading reveal ${light ? "section-heading--light" : ""}`}><p className="kicker"><span />{kicker}</p><h2>{children}</h2></div>; }
