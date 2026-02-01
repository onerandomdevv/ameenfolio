"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, Star, Mail, Bookmark, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlitchText } from "@/components/ui/glitch-text";
import { Magnetic } from "@/components/ui/magnetic";
import { SectionReveal } from "@/components/ui/section-reveal";

const PROJECTS_MOCK: {
  id: number;
  title: string;
  description: string;
  image: string;
  rating: string;
  earned: string;
  rate: string;
  verified: boolean;
  category: string;
}[] = [
  // Mock data removed as per user request
];

type Category = "projects" | "building" | "collabs" | "marketplace";

function ProjectsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("tab") as Category | null;
  const [activeTab, setActiveTab] = React.useState<Category>("projects");

  React.useEffect(() => {
    if (
      initialTab &&
      ["projects", "building", "collabs", "marketplace"].includes(initialTab)
    ) {
      setActiveTab(initialTab);
    } else if (!initialTab) {
      setActiveTab("projects");
    }
  }, [initialTab]);

  const handleTabChange = (tab: Category) => {
    setActiveTab(tab);
    router.push(`/projects?tab=${tab}`, { scroll: false });
  };

  const filteredProjects =
    activeTab === "projects"
      ? PROJECTS_MOCK
      : PROJECTS_MOCK.filter((p) => p.category === activeTab);

  return (
    <div className="min-h-screen bg-transparent pb-32 pt-32">
      {/* Background Grid Effect */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-accent-lime/5 to-transparent blur-[100px]" />
      </div>

      <SectionReveal>
        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          {/* Header Section */}
          <div className="mb-20 relative">
            {/* Projects Counter - Top Right */}
            <div className="absolute top-0 right-0 hidden lg:flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-text-muted">
                Projects Built:
              </span>
              <span className="text-xs font-black text-accent-lime font-mono">
                {PROJECTS_MOCK.length.toString().padStart(2, "0")}
              </span>
            </div>

            <div className="space-y-6">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-text-muted hover:text-accent-lime transition-colors text-xs font-black uppercase tracking-widest mb-4"
              >
                <ArrowRight className="w-4 h-4 rotate-180" /> Back to Home
              </Link>
              <div className="space-y-4">
                <h1 className="text-6xl lg:text-7xl font-black tracking-tighter uppercase leading-none">
                  <span className="text-accent-lime mr-4">
                    <GlitchText text="AMEEN'S" />
                  </span>
                  <span className="text-white">PROJECTS</span>
                </h1>
              </div>
              <p className="text-text-secondary font-mono text-sm lg:text-base max-w-2xl leading-relaxed border-l-2 border-accent-lime pl-6">
                A curated selection of my deployed systems, experimental tools,
                and digital experiences engineering for performance and
                aesthetics.
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-16 flex flex-wrap items-center gap-4 lg:gap-8 border-b border-border-subtle pb-px">
            {(["projects", "building", "collabs", "marketplace"] as const).map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`relative pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all hover:text-accent-lime ${
                    activeTab === tab ? "text-accent-lime" : "text-text-muted"
                  }`}
                >
                  {tab === "marketplace" ? "Marketplace" : tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 h-0.5 w-full bg-accent-lime shadow-[0_0_10px_#ccff00]" />
                  )}
                </button>
              ),
            )}
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 min-h-[400px]">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project, index) => (
                <div
                  key={project.id}
                  className="group relative bg-bg-glass backdrop-blur-md rounded-3xl border border-border-subtle overflow-hidden hover:border-accent-lime/50 transition-all duration-500"
                >
                  {/* Card Image area */}
                  <div className="relative aspect-video w-full overflow-hidden border-b border-border-subtle">
                    <div className="absolute inset-0 bg-accent-lime/10 group-hover:bg-transparent transition-colors z-10 mix-blend-overlay" />
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-4 right-4 z-20">
                      <div className="bg-black/50 backdrop-blur-md border border-white/10 p-2 rounded-full text-white">
                        <Bookmark className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8 space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-black text-white tracking-tighter uppercase group-hover:text-accent-lime transition-colors">
                          {project.title}
                        </h3>
                        {project.verified && (
                          <CheckCircle2 className="w-5 h-5 text-accent-lime" />
                        )}
                      </div>
                      <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">
                        {project.description}
                      </p>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-3 gap-4 py-4 border-y border-border-subtle">
                      <div className="text-center space-y-1 border-r border-border-subtle last:border-0">
                        <div className="text-xs font-black text-accent-lime flex items-center justify-center gap-1">
                          <Star className="w-3 h-3 fill-current" />{" "}
                          {project.rating}
                        </div>
                        <div className="text-[9px] uppercase tracking-widest text-text-muted">
                          RATING
                        </div>
                      </div>
                      <div className="text-center space-y-1 border-r border-border-subtle last:border-0">
                        <div className="text-xs font-black text-white">
                          {project.earned}
                        </div>
                        <div className="text-[9px] uppercase tracking-widest text-text-muted">
                          EARNED
                        </div>
                      </div>
                      <div className="text-center space-y-1">
                        <div className="text-xs font-black text-white">
                          {project.rate}
                        </div>
                        <div className="text-[9px] uppercase tracking-widest text-text-muted">
                          RATE
                        </div>
                      </div>
                    </div>

                    <Button className="w-full rounded-xl bg-accent-lime text-black font-black uppercase tracking-widest hover:bg-white transition-colors h-12">
                      <Mail className="w-4 h-4 mr-2" /> Connect
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center h-64 border border-dashed border-border-subtle rounded-3xl bg-bg-glass/30">
                <div className="w-16 h-16 rounded-full bg-border-subtle flex items-center justify-center mb-4 text-text-muted/50">
                  <Bookmark className="w-8 h-8" />
                </div>
                <p className="text-text-secondary font-mono text-sm uppercase tracking-widest">
                  // No items found in sector
                </p>
                <p className="text-text-muted text-xs mt-2">
                  Awaiting data injection...
                </p>
              </div>
            )}
          </div>
        </div>
      </SectionReveal>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <ProjectsContent />
    </Suspense>
  );
}
