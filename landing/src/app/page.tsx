import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { AIGrowth } from "@/components/AIGrowth";
import { Process } from "@/components/Process";
import { Pricing } from "@/components/Pricing";
import { Showcase } from "@/components/Showcase";
import { BlogSection } from "@/components/BlogSection";
import { FAQ } from "@/components/FAQ";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Services />
        <AIGrowth />
        <Process />
        <Pricing />
        <Showcase />
        <BlogSection />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
