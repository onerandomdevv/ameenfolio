"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRightCircle, ArrowRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";
import { SectionReveal } from "@/components/ui/section-reveal";
import { Magnetic } from "@/components/ui/magnetic";
import { client } from "@/lib/sanity";
import { urlFor } from "@/lib/sanity-image";
import { Project } from "@/types";

const PROJECTS_QUERY = `*[_type == "project"] | order(_createdAt desc) [0...6] {
  _id,
  title,
  slug,
  description,
  category,
  mainImage
}`;

export function ProjectsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
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

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const progress = scrollLeft / (scrollWidth - clientWidth);
    setScrollProgress(progress || 0);
  };

  return (
    <SectionReveal>
      <section className="py-16 lg:py-32 bg-transparent overflow-hidden">
        <div className="container mx-auto px-6 lg:px-12 mb-12 lg:mb-20 text-center lg:text-left">
          <h2 className="text-4xl md:text-5xl lg:text-7xl font-black text-accent-lime tracking-tighter uppercase mb-6">
            View Ameen&apos;s Project
          </h2>
          <p className="text-white font-light text-xl max-w-2xl lg:mx-0 mx-auto leading-relaxed">
            A selection of projects and systems I’ve worked on, ranging from
            full-stack web applications to software tools and experimental
            builds. Each project reflects my approach to problem-solving,
            architecture, and code quality.
          </p>
        </div>

        {/* Horizontal Slider Container */}
        <div className="relative group">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory cursor-grab active:cursor-grabbing px-6 lg:px-12 gap-0"
            style={{ scrollBehavior: "smooth" }}
          >
            {loading
              ? // Loading placeholders
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 w-full sm:w-[450px] lg:w-[500px] h-[500px] animate-pulse border-l border-border-subtle bg-bg-glass/10"
                  />
                ))
              : projects.map((project, idx) => (
                  <div
                    key={project._id}
                    className="flex-shrink-0 w-full sm:w-[450px] lg:w-[500px] snap-start border-l border-border-subtle last:border-r group/card transition-colors duration-500"
                  >
                    <div className="p-6 md:p-10 space-y-6 md:space-y-8 h-full flex flex-col justify-between">
                      <div className="space-y-6 md:space-y-8">
                        {/* Image Container */}
                        <div className="relative aspect-video rounded-none overflow-hidden border border-border-subtle group/img bg-bg-card">
                          {project.mainImage && (
                            <ProjectImage
                              image={urlFor(project.mainImage).url()}
                              title={project.title}
                            />
                          )}
                        </div>

                        {/* Text Content */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-2xl md:text-3xl font-black text-accent-lime tracking-tighter uppercase leading-none transition-colors">
                              {project.title}
                            </h3>
                            {project.category?.includes("collabs") && (
                              <Users className="w-6 h-6 text-accent-lime flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-white font-light text-base leading-relaxed line-clamp-3 italic transition-colors">
                            {project.description}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Action Bar */}
                      <div className="flex items-center justify-between pt-8 border-t border-border-subtle">
                        <Link href={`/projects/${project.slug.current}`}>
                          <Button className="rounded-xl bg-accent-lime text-black font-black uppercase tracking-widest hover:bg-white transition-all h-10 px-4 flex items-center gap-2 group/btn">
                            View Project
                            <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}

            {!loading && (
              /* View More Slide */
              <div className="flex-shrink-0 w-full sm:w-[450px] lg:w-[400px] snap-start border-l border-border-subtle last:border-r flex items-center justify-center">
                <Link
                  href="/projects"
                  className="flex flex-col items-center gap-6 group/more"
                >
                  <div className="w-24 h-24 rounded-full border border-border-subtle flex items-center justify-center group-hover/more:border-accent-lime group-hover/more:bg-accent-lime transition-all duration-500 overflow-hidden relative">
                    <ArrowRightCircle className="w-10 h-10 text-white/20 group-hover/more:text-black absolute z-10" />
                    <motion.div
                      initial={{ scale: 0 }}
                      whileHover={{ scale: 1 }}
                      className="absolute inset-0 bg-accent-lime"
                    />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted group-hover/more:text-text-primary transition-colors">
                    View more
                  </span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Slider Indicator Dots */}
        <div className="mt-12 lg:mt-20 flex flex-col items-center gap-6">
          <div className="flex gap-3">
            {[...Array(projects.length + 1)].map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-500 ${
                  Math.round(scrollProgress * projects.length) === i
                    ? "w-8 bg-accent-lime"
                    : "w-2 bg-border-subtle"
                }`}
              />
            ))}
          </div>
          <div className="text-[9px] font-black uppercase tracking-[0.3em] text-text-muted/30">
            Scroll to explore
          </div>
        </div>
      </section>
    </SectionReveal>
  );
}

function ProjectImage({ image, title }: { image: string; title: string }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [-20, 20]);

  return (
    <div ref={ref} className="h-full w-full overflow-hidden">
      <motion.img
        src={image}
        alt={title}
        style={{ y }}
        className="w-full h-[120%] object-cover"
      />
    </div>
  );
}
