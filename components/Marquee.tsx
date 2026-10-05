const items = [
  "DESARROLLO",
  "E-COMMERCE",
  "EXPERIENCIAS",
  "DISEÑO",
  "TECNOLOGÍA",
  "DESARROLLO",
  "OPORTUNIDADES",
  "HERRAMIENTAS DIGITALES",
];

const marqueeText = `${items.join(" ✦ ")} ✦`;

export function Marquee() {
  return (
    <div
      className="marquee"
      aria-label="Desarrollo, e-commerce, experiencias, diseño, tecnología, desarrollo, oportunidades y herramientas digitales"
    >
      <div className="marquee__track" aria-hidden="true">
        <span className="marquee__group">{marqueeText}</span>
        <span className="marquee__group">{marqueeText}</span>
      </div>
    </div>
  );
}
