
import { SectionHeading } from "./SectionHeading";
import { ProjectCard } from "./ProjectCard";

const projects = [
  { name: "Amba Logística", sector: "Logística", type: "Sitio Web", image: "/clientes/ambalogistica.PNG" },
  { name: "La Canastilla Ideal", sector: "Tienda de Bebés", type: "E-Commerce", image: "/clientes/canastillanuevo.PNG" },
  { name: "Gron Costa Rica", sector: "Constructora", type: "Sitio Web", image: "/clientes/gronnuevo.PNG" },
  { name: "TERRACES & SHADOWS", sector: "Constructora", type: "Sitio Web", image: "/clientes/terraces.PNG" },
  { name: "OKOHAUSEN", sector: "Constructora", type: "Sitio Web", image: "/clientes/okohausen.PNG" },
  { name: "BIODRY CENTROMÉRICA", sector: "Tecnología & Innovación", type: "Sitio Web", image: "/clientes/biodry%20web.PNG" },
  { name: "CVG MANAGEMENT", sector: "Software de Gestión", type: "Sitio Web", image: "/clientes/cvg%20web.PNG" },
  { name: "Nexo Arquitectura", sector: "Arquitectura", type: "Sitio Web", variant: 1 },
  { name: "Lumbre", sector: "Real Estate", type: "Landing Page", variant: 2 },
  { name: "Panorama", sector: "Gastronomía", type: "E-Commerce", variant: 3 },
];

export function Projects() {
  return (
    <section className="projects section-pad" id="proyectos">
      <div className="container">
        <div className="projects-heading">
          <SectionHeading kicker="CLIENTES Y PROYECTOS DEMO">
            Algunas cosas que <em>construimos.</em>
          </SectionHeading>
          <p>
            Proyectos de nuestros clientes y demos de las experiencias digitales
            que podemos crear para cada negocio.
          </p>
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
