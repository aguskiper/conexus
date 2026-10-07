import styles from "./WebIncludes.module.css";

const benefits = [
  [
    { title: "Diseño personalizado", text: "Una web diseñada en función de la identidad y necesidades de tu empresa.", art: "design" },
    { title: "Diseño responsive", text: "Adaptada para verse correctamente en computadoras, tablets y celulares.", art: "responsive" },
    { title: "Optimización de velocidad", text: "Desarrollo enfocado en lograr una experiencia rápida y fluida.", art: "speed" },
  ],
  [
    { title: "SEO técnico inicial", text: "Estructura preparada para facilitar la indexación del sitio en motores de búsqueda.", art: "seo" },
    { title: "Formularios de contacto", text: "Formularios adaptados a las necesidades de cada proyecto.", art: "form" },
    { title: "Integración con WhatsApp", text: "Accesos directos para facilitar el contacto de potenciales clientes.", art: "chat" },
  ],
  [
    { title: "Sitio autogestionable", text: "Cuando el proyecto lo requiera, podrás administrar contenidos sin depender de nosotros para cada cambio.", art: "manage" },
    { title: "Capacitación y acompañamiento", text: "Te guiamos para que puedas utilizar y administrar las funciones principales de tu sitio.", art: "guide" },
    { title: "1 mes de soporte incluido", text: "Acompañamiento sin costo durante el primer mes posterior a la entrega.", art: "support" },
  ],
];

function BenefitArt({ kind }: { kind: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={styles.art}>
      {kind === "design" && <><rect x="8" y="12" width="44" height="38" rx="7" fill="var(--paper)" /><path d="M8 22h44M15 17h1m5 0h1" /><rect x="15" y="29" width="15" height="14" rx="4" fill="var(--coral)" /><path d="M36 31h9m-9 6h6M44 42l3 17 4-6 7-2z" fill="var(--yellow)" /></>}
      {kind === "responsive" && <><rect x="5" y="10" width="40" height="31" rx="5" fill="var(--paper)" /><path d="M5 34h40M25 41v9m-8 0h16" /><rect x="38" y="25" width="20" height="31" rx="5" fill="var(--lav)" /><path d="M44 30h8m-6 21h4" /><path d="M12 18h24m-24 6h14" /></>}
      {kind === "speed" && <><path d="M10 49a25 25 0 1 1 44 0" fill="var(--paper)" /><path d="M15 36h4m26 0h4M22 19l3 4m17-4-3 4M32 13v5" /><path d="M32 38l12-12" strokeWidth="3" /><circle cx="32" cy="38" r="5" fill="var(--coral)" /><path d="M21 53h22" /><path d="M8 10h9m-13 7h7" /></>}
      {kind === "seo" && <><rect x="6" y="10" width="39" height="42" rx="6" fill="var(--paper)" /><path d="M13 20h18m-18 8h11m-11 8h8" /><circle cx="39" cy="36" r="12" fill="var(--yellow)" /><path d="M48 45l10 11m-25-20 4 4 7-8" /></>}
      {kind === "form" && <><rect x="10" y="6" width="42" height="51" rx="7" fill="var(--paper)" /><path d="M18 16h18" /><rect x="18" y="23" width="26" height="7" rx="2" fill="var(--mint)" /><rect x="18" y="35" width="26" height="7" rx="2" fill="var(--mint)" /><path d="M31 48h13m-5-4 5 4-5 4" /><path d="M4 44l4 4 6-8" /></>}
      {kind === "chat" && <><path d="M9 12h38a8 8 0 0 1 8 8v20a8 8 0 0 1-8 8H25L12 57l2-9H9a8 8 0 0 1-8-8V20a8 8 0 0 1 8-8z" fill="var(--mint)" /><path d="M21 23c-4 7 9 20 16 16l4-5-7-4-3 3-6-6 3-3-4-6z" fill="var(--paper)" /><path d="M49 5v5m6-2-3 4" /></>}
      {kind === "manage" && <><rect x="7" y="10" width="49" height="43" rx="7" fill="var(--paper)" /><path d="M7 21h49M20 21v32" /><path d="M12 28h3m-3 7h3m-3 7h3M27 29h20m-20 9h20m-20 9h20" /><circle cx="34" cy="29" r="4" fill="var(--coral)" /><circle cx="43" cy="38" r="4" fill="var(--yellow)" /><circle cx="32" cy="47" r="4" fill="var(--mint)" /></>}
      {kind === "guide" && <><path d="M6 15c10-4 18-3 26 2 8-5 16-6 26-2v34c-10-4-18-3-26 2-8-5-16-6-26-2z" fill="var(--paper)" /><path d="M32 17v34M13 25l5 5 7-8m-12 15h12m14-12h12m-12 8h12m-12 8h7" /><path d="M27 7h10" /></>}
      {kind === "support" && <><path d="M12 36v-9a20 20 0 0 1 40 0v9" /><rect x="7" y="29" width="11" height="18" rx="5" fill="var(--coral)" /><rect x="46" y="29" width="11" height="18" rx="5" fill="var(--coral)" /><path d="M51 47v3a7 7 0 0 1-7 7h-8" /><rect x="27" y="53" width="12" height="7" rx="3" fill="var(--yellow)" /><circle cx="25" cy="31" r="2" fill="currentColor" /><circle cx="39" cy="31" r="2" fill="currentColor" /><path d="M27 40q5 5 10 0" /></>}
    </svg>
  );
}

export function WebIncludes() {
  return (
    <section className={styles.section} aria-labelledby="web-includes-title">
      <div className="container">
        <div className={`${styles.heading} reveal`}>
          <p className="kicker"><span />DE PRINCIPIO A FIN</p>
          <h2 id="web-includes-title">¿Qué incluye <em>tu web?</em></h2>
          <p className={styles.subtitle}>Todo lo necesario para que tengas un sitio moderno, profesional y listo para empezar.</p>
        </div>
        <div className={`${styles.workspace} reveal`}>
          <div className={styles.toolbar} aria-hidden="true">
            <div className={styles.dots}><i /><i /><i /></div>
            <span className={styles.address}>conexus / tu próximo sitio</span>
            <span className={styles.ready}><i />LISTO PARA EMPEZAR</span>
          </div>
          <div className={styles.columns}>
            {benefits.map((group, index) => (
              <div className={styles.group} key={index}>
                <div className={styles.groupTitle} aria-hidden="true">
                  <span>0{index + 1}</span><b>{["HECHA PARA VOS", "LISTA PARA CONECTAR", "CON VOS DESPUÉS"][index]}</b><i>✓</i>
                </div>
                <ul className={styles.benefits}>
                  {group.map(benefit => (
                    <li className={styles.benefit} key={benefit.title}>
                      <div className={styles.illustration}><BenefitArt kind={benefit.art} /><span className={styles.check} aria-hidden="true">✓</span></div>
                      <div><h3>{benefit.title}</h3><p>{benefit.text}</p></div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className={styles.status} aria-hidden="true"><span><i />DISEÑO + TECNOLOGÍA + ACOMPAÑAMIENTO</span><span>Todo conectado <b>↗</b></span></div>
        </div>
      </div>
    </section>
  );
}
