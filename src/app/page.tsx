import { Hero } from "@/components/sections/hero";
import { AboutSection } from "@/components/sections/about-section";
import { ExpertiseSection } from "@/components/sections/expertise-section";
import { TechStackSection } from "@/components/sections/tech-stack-section";
import { ProjectsSection } from "@/components/sections/projects-section";
import { MarketplaceSection } from "@/components/sections/marketplace-section";
import { ContactSection } from "@/components/sections/contact-section";

export default function Home() {
  return (
    <>
      <Hero />
      <AboutSection />
      <ExpertiseSection />
      <TechStackSection />
      <ProjectsSection />
      <MarketplaceSection />
      <ContactSection />
    </>
  );
}
