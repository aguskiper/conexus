export function Logo({ inverse = false }: { inverse?: boolean }) {
  return <span className={`brand ${inverse ? "brand--inverse" : ""}`} aria-label="Conexus Digital"><span className="brand-mark" aria-hidden="true"><i /><b /><em /></span><span className="brand-words"><strong>CONEXUS</strong><small>DIGITAL</small></span></span>;
}
