import amba from "../clientes/ambalogistica.PNG";
import canastilla from "../clientes/canastillanuevo.PNG";
import gron from "../clientes/gronnuevo.PNG";
import terraces from "../clientes/terraces.PNG";
import okohausen from "../clientes/okohausen.PNG";
import biodry from "../clientes/biodry web.PNG";
import cvg from "../clientes/cvg web.PNG";
import { SectionHeading } from "./SectionHeading";
import { ProjectCard } from "./ProjectCard";

const projects = [
  { name: "Amba Logística", sector: "Logística", type: "Sitio Web", image: amba },
  { name: "La Canastilla Ideal", sector: "Tienda de Bebés", type: "E-Commerce", image: canastilla },
  { name: "Gron Costa Rica", sector: "Constructora", type: "Sitio Web", image: gron },
  { name: "TERRACES & SHADOWS", sector: "Constructora", type: "Sitio Web", image: terraces },
  { name: "OKOHAUSEN", sector: "Constructora", type: "Sitio Web", image: okohausen },
  { name: "BIODRY CENTROMÉRICA", sector: "Tecnología & Innovación", type: "Sitio Web", image: biodry },
  { name: "CVG MANAGEMENT", sector: "Software de Gestión", type: "Sitio Web", image: cvg },
  { name: "Nexo Arquitectura", sector: "Arquitectura", type: "Sitio Web", variant: 1 },
  { name: "Lumbre", sector: "Real Estate", type: "Landing Page", variant: 2 },
  { name: "Panorama", sector: "Gastronomía", type: "E-Commerce", variant: 3 },
];

export function Projects() {
  return (
    <section className="projects section-pad" id="proyectos">
      <div className="container">
        <div className="projects-heading">
          <SectionHeading kicker="CLIENTES Y PROYECTOS DEMO">Algunas cosas que <em>construimos.</em></SectionHeading>
          <p>Proyectos de nuestros clientes y demos de las experiencias digitales que podemos crear para cada negocio.</p>
        </div>
        <div className="projects-grid projects-grid--uniform">
          {projects.map((project, index) => (
            <ProjectCard key={project.name} index={index + 1} {...project} />
          ))}
        </div>
      </div>
    </section>
  );
}
