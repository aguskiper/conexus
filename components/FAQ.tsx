"use client";

import { useRef, useState } from "react";

type FAQItem = { question: string; answer: React.ReactNode };

const questions: FAQItem[] = [
  {
    question: "¿Qué necesito para tener una página web?",
    answer: <>Para publicar tu sitio necesitás principalmente un dominio y un servicio de hosting. Si todavía no los tenés, en Conexus Digital te guiamos durante todo el proceso para elegirlos y contratarlos correctamente.</>,
  },
  {
    question: "¿Qué es un dominio?",
    answer: <>Es la dirección que las personas utilizan para ingresar a tu sitio web, por ejemplo tuempresa.com.ar. El dominio pertenece al cliente y recomendamos que siempre sea registrado a su nombre para que mantenga el control total sobre él.</>,
  },
  {
    question: "¿Qué es el hosting?",
    answer: <>Es el servicio donde se alojan los archivos y recursos necesarios para que tu página esté disponible en Internet. Existen diferentes opciones según las necesidades de cada proyecto y podemos asesorarte para elegir la más adecuada.</>,
  },
  {
    question: "¿El dominio y el hosting están incluidos?",
    answer: <>No. Tanto el dominio como el hosting son contratados y abonados directamente por el cliente. De esta forma, siempre mantenés la propiedad y el control de ambos servicios. Si necesitás ayuda, te acompañamos durante todo el proceso de contratación.</>,
  },
  {
    question: "¿Qué es una landing page?",
    answer: <>Es una página diseñada alrededor de un objetivo específico, como recibir consultas, presentar un servicio, promocionar un producto o captar potenciales clientes. A diferencia de un sitio corporativo completo, concentra la información y las acciones principales en una única página.</>,
  },
  {
    question: "No sé qué tipo de página necesito, ¿me pueden asesorar?",
    answer: <>Sí. No necesitás conocer términos técnicos ni saber de antemano si necesitás una landing page, un sitio institucional o un e-commerce. Contanos sobre tu empresa, qué querés ofrecer y cuáles son tus objetivos, y te recomendaremos la alternativa más adecuada.</>,
  },
  {
    question: "¿Cuánto tarda en estar lista mi página?",
    answer: <>Depende del tamaño y la complejidad del proyecto. Antes de comenzar definimos el alcance, las etapas y un plazo estimado de entrega para que sepas desde el principio cómo avanzará el desarrollo.</>,
  },
  {
    question: "¿Qué pasa después de que me entregan la web?",
    answer: <><strong>Todos nuestros proyectos incluyen 1 mes de soporte sin costo</strong> a partir de la entrega del sitio. Durante ese período te acompañamos ante cualquier inconveniente relacionado con el desarrollo realizado y durante la puesta en funcionamiento de la web.<br /><br />El soporte contempla asistencia y corrección de posibles inconvenientes sobre lo desarrollado originalmente. Nuevas secciones, funcionalidades o modificaciones que amplíen el alcance original del proyecto podrán presupuestarse por separado.</>,
  },
  {
    question: "Ya tengo una página web, ¿pueden trabajar sobre ella?",
    answer: <>Sí. Podemos realizar una <strong>auditoría inicial sin costo</strong> para revisar el estado actual de tu sitio, detectar problemas y determinar si es posible corregirlo u optimizarlo, o si resulta más conveniente desarrollar uno nuevo.</>,
  },
  {
    question: "¿Mi página se va a ver bien en celulares?",
    answer: <>Sí. Todos nuestros sitios se desarrollan con diseño responsive, adaptándose correctamente a computadoras, tablets y smartphones. La experiencia mobile forma parte del desarrollo desde el comienzo del proyecto.</>,
  },
  {
    question: "¿Voy a ser propietario de mi página?",
    answer: <>Sí. Una vez finalizado y abonado el proyecto, el sitio desarrollado para tu empresa es tuyo. Además, recomendamos que tanto el dominio como el hosting estén registrados directamente a nombre del cliente para que siempre mantenga el control de sus activos digitales.</>,
  },
  {
    question: "¿Qué es el SEO y por qué es importante?",
    answer: <>SEO significa optimización para motores de búsqueda. Es el conjunto de prácticas que ayuda a que buscadores como Google puedan encontrar, comprender e indexar correctamente un sitio web.<br /><br />Desarrollamos nuestros sitios teniendo en cuenta buenas prácticas técnicas de SEO y dejamos la web preparada para estar disponible en los motores de búsqueda.<br /><br />A partir de ahí, el posicionamiento puede potenciarse mediante una estrategia de marketing digital, generación de contenido, SEO, publicidad en buscadores, redes sociales y otras acciones destinadas a atraer potenciales clientes.</>,
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number | null = null;
    if (event.key === "ArrowDown") next = (index + 1) % questions.length;
    if (event.key === "ArrowUp") next = (index - 1 + questions.length) % questions.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = questions.length - 1;
    if (next !== null) {
      event.preventDefault();
      buttons.current[next]?.focus();
    }
  };

  return (
    <section className="faq section-pad" aria-labelledby="faq-title">
      <div className="container faq-grid">
        <div className="faq-intro reveal">
          <p className="kicker"><span />ANTES DE EMPEZAR</p>
          <h2 id="faq-title">Preguntas que suelen <em>hacernos.</em></h2>
          <p>Todo lo que necesitás saber antes de empezar tu proyecto.</p>
          <div className="faq-signal" aria-hidden="true">
            <i /><span /><b /><em>?</em>
          </div>
        </div>
        <div className="faq-list">
          {questions.map((item, index) => {
            const isOpen = openIndex === index;
            const buttonId = `faq-button-${index + 1}`;
            const panelId = `faq-panel-${index + 1}`;
            return (
              <article className={`faq-item reveal ${isOpen ? "is-open" : ""}`} key={item.question}>
                <h3>
                  <button
                    ref={(node) => { buttons.current[index] = node; }}
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    onKeyDown={(event) => handleKeyDown(event, index)}
                  >
                    <span className="faq-number">{String(index + 1).padStart(2, "0")}</span>
                    <span className="faq-question">{item.question}</span>
                    <span className="faq-toggle" aria-hidden="true"><i /><i /></span>
                  </button>
                </h3>
                <div id={panelId} role="region" aria-labelledby={buttonId} aria-hidden={!isOpen} className="faq-panel">
                  <div><p>{item.answer}</p></div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
