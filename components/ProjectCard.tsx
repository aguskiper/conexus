
import Image, { type StaticImageData } from "next/image";
import { BrowserMockup } from "./BrowserMockup";

type ProjectCardProps = {
  index: number;
  name: string;
  sector: string;
  type: string;
  image?: string | StaticImageData;
  variant?: number;
};

export function ProjectCard({
  index,
  name,
  sector,
  type,
  image,
  variant = 1,
}: ProjectCardProps) {
  return (
    <article className={`project-card project-card--${index} reveal`}>
      {image ? (
        <div className={`project-mockup project-mockup--${((index - 1) % 4) + 1} project-screenshot`}>
          <div className="project-browser project-browser--capture">
            <header aria-hidden="true">
              <span />
              <span />
              <span />
              <i>{name}</i>
            </header>
            <div className="project-capture">
              <Image
                src={image}
                alt={`Captura del sitio de ${name}`}
                unoptimized
                sizes="(max-width: 600px) 100vw, 50vw"
                width={1200}
                height={800}
              />
            </div>
          </div>
        </div>
      ) : (
        <BrowserMockup variant={variant} />
      )}
      <div className="project-meta">
        <div>
          <p>
            {sector} <span>·</span> {type}
          </p>
          <h3>{name}</h3>
        </div>
        <span className="project-kind">{image ? "CLIENTE" : "DEMO"}</span>
      </div>
    </article>
  );
}
