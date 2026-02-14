"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  Star,
  MessageSquare,
  Bookmark,
  ArrowRight,
  Github,
  Globe,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlitchText } from "@/components/ui/glitch-text";
import { Magnetic } from "@/components/ui/magnetic";
import { SectionReveal } from "@/components/ui/section-reveal";
import { client } from "@/lib/sanity";
import { urlFor } from "@/lib/sanity-image";
import { Project } from "@/types";
import { ErrorBoundary } from "@/components/error-boundary";
import { ProjectsGridSkeleton } from "@/components/skeletons/project-skeletons";
import { ContactModal } from "@/components/project/contact-modal";

type Category = "projects" | "building" | "collabs" | "marketplace";

const PROJECTS_QUERY = `*[_type == "project"] | order(_createdAt desc) {
  _id,
  title,
  slug,
  description,
  category,
  mainImage,
  verified,
  technologies {
    "languages": languages[]->{name, "image": image.asset->url},
    "frontend": frontend[]->{name, "image": image.asset->url},
    "backend": backend[]->{name, "image": image.asset->url},
    "database": database[]->{name, "image": image.asset->url},
    "tools": tools[]->{name, "image": image.asset->url}
  },
  cta
}`;

function ProjectsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("tab") as Category | null;
  const [activeTab, setActiveTab] = useState<Category>("projects");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const data = await client.fetch(PROJECTS_QUERY);
        setProjects(data);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  useEffect(() => {
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

  const handleContact = (project: Project) => {
    setSelectedProject(project);
    setIsContactOpen(true);
  };

  const filteredProjects =
    activeTab === "projects"
      ? projects
      : projects.filter((p) => p.category?.includes(activeTab));

  return (
    <div className="min-h-screen bg-transparent pb-32 pt-32">
      {/* Background Grid Effect */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-accent-lime/5 to-transparent blur-[100px]" />
      </div>

      <SectionReveal>
        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <ErrorBoundary>
            {/* Header Section */}
            <div className="mb-20 relative">
              {/* Projects Counter - Top Right */}
              <div className="absolute top-0 right-0 hidden lg:flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-text-muted">
                  Projects Built:
                </span>
                <span className="text-xs font-black text-accent-lime font-mono">
                  {projects.length.toString().padStart(2, "0")}
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
                  A curated selection of my deployed systems, experimental
                  tools, and digital experiences engineering for performance and
                  aesthetics.
                </p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="mb-16 flex flex-wrap items-center gap-4 lg:gap-8 border-b border-border-subtle pb-px">
              {(
                ["projects", "building", "collabs", "marketplace"] as const
              ).map((tab) => (
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
              ))}
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 min-h-[400px]">
              {loading ? (
                <ProjectsGridSkeleton count={6} />
              ) : filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <div
                    key={project._id}
                    className="group relative bg-bg-glass backdrop-blur-md rounded-none overflow-hidden transition-all duration-500 hover:bg-bg-glass/40 shadow-xl"
                  >
                    {/* Card Image area */}
                    <div className="relative aspect-video w-full overflow-hidden">
                      <div className="absolute inset-0 bg-accent-lime/10 group-hover:bg-transparent transition-colors z-10 mix-blend-overlay" />
                      {project.mainImage && (
                        <Image
                          src={urlFor(project.mainImage).url()}
                          alt={project.title}
                          fill
                          className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-8 space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-2xl font-black text-accent-lime tracking-tighter uppercase transition-colors">
                              {project.title}
                            </h3>
                            {project.category?.includes("collabs") && (
                              <Users className="w-5 h-5 text-accent-lime flex-shrink-0" />
                            )}
                          </div>
                          {project.verified && (
                            <CheckCircle2 className="w-5 h-5 text-accent-lime" />
                          )}
                        </div>
                        <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">
                          {project.description}
                        </p>

                        {/* Tech Stack Tags */}
                        <div className="flex flex-wrap gap-2">
                          {/* Show first language */}
                          {project.technologies?.languages?.[0] && (
                            <span className="text-[10px] uppercase tracking-widest text-text-muted border border-border-subtle px-2 py-1 rounded">
                              {project.technologies.languages[0].name}
                            </span>
                          )}
                          {/* Show first frontend */}
                          {project.technologies?.frontend?.[0] && (
                            <span className="text-[10px] uppercase tracking-widest text-text-muted border border-border-subtle px-2 py-1 rounded">
                              {project.technologies.frontend[0].name}
                            </span>
                          )}
                          {/* Show first backend */}
                          {project.technologies?.backend?.[0] && (
                            <span className="text-[10px] uppercase tracking-widest text-text-muted border border-border-subtle px-2 py-1 rounded">
                              {project.technologies.backend[0].name}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-6 border-t border-border-subtle flex items-center justify-between">
                        <Link href={`/projects/${project.slug.current}`}>
                          <Button className="rounded-xl bg-accent-lime text-black font-black uppercase tracking-widest hover:bg-white transition-all h-10 px-4 flex items-center gap-2 group/btn">
                            View Project
                            <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                          </Button>
                        </Link>

                        <div className="flex items-center gap-2">
                          <div
                            className="p-2 rounded-lg bg-accent-lime/10 border border-accent-lime/20 text-accent-lime"
                            title="Source Code"
                          >
                            <Github className="w-3.5 h-3.5" />
                          </div>
                          <div
                            className="p-2 rounded-lg bg-accent-lime/10 border border-accent-lime/20 text-accent-lime"
                            title="Live Preview"
                          >
                            <Globe className="w-3.5 h-3.5" />
                          </div>
                          <div
                            className="p-2 rounded-lg bg-accent-lime/10 border border-accent-lime/20 text-accent-lime"
                            title="Contact"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
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
          </ErrorBoundary>
        </div>
      </SectionReveal>

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
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
