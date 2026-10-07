import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { Services } from "@/components/Services";
import { WebIncludes } from "@/components/WebIncludes";
import { Differentials } from "@/components/Differentials";
import { Process } from "@/components/Process";
import { Projects } from "@/components/Projects";
import { ConnectionSection } from "@/components/ConnectionSection";
import { FAQ } from "@/components/FAQ";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";
import { Suspense } from "react";
import { LatestBlog } from "@/components/blog/LatestBlog";
import { LatestProducts } from "@/components/products/LatestProducts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <Header />
      <main id="contenido">
        <Hero /><Marquee /><Services /><WebIncludes /><Differentials /><Process />
        <Projects /><ConnectionSection /><Suspense fallback={null}><LatestProducts /></Suspense><Suspense fallback={null}><LatestBlog /></Suspense><FAQ /><FinalCTA />
      </main>
      <Footer />
    </>
  );
}
