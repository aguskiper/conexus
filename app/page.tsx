import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { Services } from "@/components/Services";
import { Differentials } from "@/components/Differentials";
import { Process } from "@/components/Process";
import { Projects } from "@/components/Projects";
import { ConnectionSection } from "@/components/ConnectionSection";
import { About } from "@/components/About";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <Header />
      <main id="contenido">
        <Hero /><Marquee /><Services /><Differentials /><Process />
        <Projects /><ConnectionSection /><About /><FinalCTA />
      </main>
      <Footer />
    </>
  );
}
