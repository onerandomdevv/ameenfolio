"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  AlertTriangle,
  Github,
  Mail,
  Globe,
  CheckCircle2,
  Send,
  Users,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { client } from "@/lib/sanity";
import { PortableText } from "@portabletext/react";
import { Project } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { ContactModal } from "@/components/project/contact-modal";

const PROJECT_QUERY = `*[_type == "project" && slug.current == $slug][0] {
  _id,
  title,
  description,
  category,
  teamSize,
  roles,
  "mainImage": mainImage.asset->url,
  "gallery": gallery[].asset->url,
  technologies {
    "languages": languages[]->{name, "image": image.asset->url},
    "frontend": frontend[]->{name, "image": image.asset->url},
    "backend": backend[]->{name, "image": image.asset->url},
    "database": database[]->{name, "image": image.asset->url},
    "tools": tools[]->{name, "image": image.asset->url}
  },
  liveUrl,
  githubUrl,
  verified,
  cta,
  content
}`;

function ProjectDetailsContent() {
  const params = useParams();
  const slug = params?.slug;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    async function fetchProject() {
      if (!slug) return;
      try {
        const data = await client.fetch(PROJECT_QUERY, { slug });
        setProject(data);
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProject();
  }, [slug]);

  // Combine mainImage and gallery for the slider (max 3 additional gallery images)
  const slides = project
    ? [project.mainImage, ...(project.gallery || [])]
        .filter(Boolean)
        .slice(0, 4)
    : [];

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-accent-lime border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-accent-lime/5 blur-[80px] md:blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-2xl w-full border border-accent-lime/30 bg-bg-glass backdrop-blur-xl p-8 lg:p-12 rounded-2xl lg:rounded-3xl text-center space-y-6 lg:space-y-8 shadow-[0_0_50px_-10px_rgba(204,255,0,0.1)]">
          <div className="w-20 h-20 bg-accent-lime/10 rounded-full flex items-center justify-center mx-auto border border-accent-lime/20">
            <AlertTriangle className="w-10 h-10 text-accent-lime animate-pulse" />
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter text-white uppercase">
              <span className="text-accent-lime">SYSTEM</span> ERROR
            </h1>
            <p className="text-text-secondary font-mono text-sm uppercase tracking-widest">
              // SLUG: {slug} NOT_FOUND
            </p>
          </div>

          <div className="pt-4 flex justify-center">
            <Link href="/projects">
              <Button className="rounded-xl bg-white text-black font-black uppercase tracking-widest hover:bg-accent-lime transition-all duration-300 h-14 px-8">
                <ArrowLeft className="w-4 h-4 mr-2" /> Return to Database
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pt-32 pb-20">
      {/* Background decoration */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-text-muted hover:text-accent-lime transition-colors text-xs font-black uppercase tracking-widest mb-12"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Link>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left Column: Info */}
          <div className="space-y-12">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-xs font-black uppercase tracking-widest text-accent-lime px-3 py-1 bg-accent-lime/10 border border-accent-lime/20 rounded-full">
                  {project.category}
                </span>
                {project.verified && (
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-text-secondary">
                    <CheckCircle2 className="w-4 h-4 text-accent-lime" />
                    Verified System
                  </div>
                )}
              </div>

              <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter uppercase leading-none">
                {project.title}
              </h1>

              <p className="text-xl text-text-secondary leading-relaxed font-light italic">
                {project.description}
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-4">
              {project.liveUrl && (
                <Link href={project.liveUrl} target="_blank">
                  <Button className="rounded-xl bg-accent-lime text-black font-black uppercase tracking-widest hover:bg-white h-12 px-6">
                    <Globe className="w-4 h-4 mr-2" /> Live Preview
                  </Button>
                </Link>
              )}
              {project.githubUrl && (
                <Link href={project.githubUrl} target="_blank">
                  <Button className="rounded-xl bg-bg-glass text-white border border-border-subtle font-black uppercase tracking-widest hover:bg-white hover:text-black h-12 px-6">
                    <Github className="w-4 h-4 mr-2" /> Source Code
                  </Button>
                </Link>
              )}
              <Link href="https://t.me/onerandomdevv" target="_blank">
                <Button className="rounded-xl bg-white text-black font-black uppercase tracking-widest hover:bg-accent-lime h-12 px-6">
                  <Send className="w-4 h-4 mr-2" /> Contact Dev
                </Button>
              </Link>
            </div>

            {/* Team Collaboration Info - Only for Collab Projects */}
            {project.category?.includes("collabs") &&
              (project.teamSize || project.roles) && (
                <div className="space-y-6">
                  {/* Lime Separator Line */}
                  <div className="w-full h-0.5 bg-accent-lime" />

                  {/* Team Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Team Size */}
                    {project.teamSize && (
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-accent-lime flex-shrink-0" />
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black uppercase tracking-widest text-text-muted">
                            Team:
                          </span>
                          <span className="text-lg font-black text-white">
                            {project.teamSize}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Roles */}
                    {project.roles && project.roles.length > 0 && (
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-accent-lime flex-shrink-0" />
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black uppercase tracking-widest text-text-muted">
                            Role{project.roles.length > 1 ? "s" : ""}:
                          </span>
                          <span className="text-lg font-black text-white">
                            {project.roles.join(", ")}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Tech Stack */}
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-text-muted">
                Core Technologies
              </h3>
              <div className="space-y-4">
                {[
                  { label: "Languages", data: project.technologies?.languages },
                  { label: "Frontend", data: project.technologies?.frontend },
                  { label: "Backend", data: project.technologies?.backend },
                  { label: "Database", data: project.technologies?.database },
                  { label: "Tools", data: project.technologies?.tools },
                ].map(
                  (category) =>
                    category.data &&
                    category.data.length > 0 && (
                      <div key={category.label} className="space-y-2">
                        <span className="text-[10px] font-bold text-accent-lime uppercase tracking-widest block">
                          {category.label}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {category.data.map((tech) => (
                            <div
                              key={tech.name}
                              className="px-3 py-1.5 bg-bg-glass border border-border-subtle rounded-lg flex items-center gap-2"
                            >
                              {tech.image && (
                                <div className="relative w-4 h-4">
                                  <Image
                                    src={tech.image}
                                    alt={tech.name}
                                    fill
                                    className="object-contain"
                                  />
                                </div>
                              )}
                              <span className="text-xs font-bold text-white uppercase tracking-widest">
                                {tech.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ),
                )}
              </div>
            </div>

            {/* Content Body */}
            {project.content && (
              <div className="prose prose-invert max-w-none prose-headings:text-accent-lime prose-headings:uppercase prose-headings:font-black prose-p:text-text-secondary prose-p:font-light prose-p:text-lg">
                <PortableText value={project.content} />
              </div>
            )}
          </div>

          {/* Right Column: Visuals (Cinematic Slider) */}
          <div className="space-y-8">
            <div className="relative aspect-[4/3] rounded-[2.5rem] overflow-hidden border border-border-subtle group bg-bg-card">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ scale: 1.1, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    scale: { duration: 6, ease: "linear" },
                    opacity: { duration: 1, ease: "easeInOut" },
                  }}
                  className="absolute inset-0"
                >
                  {slides[currentSlide] && (
                    <>
                      {/* Debug: Log the image URL being rendered */}
                      {console.log(
                        `[Project Debug] Rendering slide ${currentSlide}:`,
                        slides[currentSlide],
                      )}
                      <Image
                        src={slides[currentSlide] as string}
                        alt={`${project.title} slide ${currentSlide}`}
                        fill
                        unoptimized
                        className="object-cover"
                        onError={(e) =>
                          console.error(
                            `[Project Error] Failed to load image: ${slides[currentSlide]}`,
                            e,
                          )
                        }
                      />
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Slider UI */}
              {slides.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-10 px-4 py-2 bg-black/30 backdrop-blur-md rounded-full border border-white/10">
                  {slides.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-700 ${
                        i === currentSlide
                          ? "w-8 bg-accent-lime"
                          : "w-1.5 bg-white/20"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Gallery Grid (Static thumbnails below) */}
            {slides.length > 1 && (
              <div className="grid grid-cols-3 gap-4">
                {slides.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`relative aspect-video rounded-2xl overflow-hidden border transition-all duration-500 bg-bg-card group ${
                      i === currentSlide
                        ? "border-accent-lime scale-95 shadow-[0_0_20px_rgba(204,255,0,0.2)]"
                        : "border-border-subtle opacity-50 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img as string}
                      alt={`${project.title} thumbnail ${i}`}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </div>
  );
}

export default function ProjectDetailsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <ProjectDetailsContent />
    </Suspense>
  );
}
