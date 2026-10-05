"use client";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { Button } from "./Button";
const links = [["Inicio", "#inicio"], ["Servicios", "#servicios"], ["Proyectos", "#proyectos"], ["Nosotros", "#nosotros"], ["Contacto", "#contacto"]];
export function Header() {
  const [open, setOpen] = useState(false);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);
  return <header className="site-header"><div className="header-shell"><a href="#inicio" className="logo-link" onClick={() => setOpen(false)}><Logo /></a><nav className="desktop-nav" aria-label="Navegación principal">{links.map(([label, href]) => <a href={href} key={href}>{label}</a>)}</nav><Button href="#contacto" className="header-cta">Hablemos</Button><button className={`menu-button ${open ? "is-open" : ""}`} type="button" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Cerrar menú" : "Abrir menú"} onClick={() => setOpen(!open)}><span /><span /></button></div><div id="mobile-menu" className={`mobile-menu ${open ? "is-open" : ""}`} aria-hidden={!open}><nav aria-label="Navegación móvil">{links.map(([label, href], i) => <a href={href} key={href} onClick={() => setOpen(false)}><span>0{i + 1}</span>{label}</a>)}</nav><p>Diseño y desarrollo web para empresas.</p></div></header>;
}
