"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Heart, ArrowRightCircle, ArrowRight } from "lucide-react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { SectionReveal } from "@/components/ui/section-reveal";
import { Magnetic } from "@/components/ui/magnetic";

const MOCK_PROJECTS: {
  id: number;
  title: string;
  description: string;
  category: string;
  image: string;
}[] = [];

export function ProjectsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [likedProjects, setLikedProjects] = useState<number[]>([]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const progress = scrollLeft / (scrollWidth - clientWidth);
    setScrollProgress(progress);
  };

  const toggleLike = (id: number) => {
    setLikedProjects((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
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
            {MOCK_PROJECTS.slice(0, 5).map((project, idx) => (
              <div
                key={project.id}
                className="flex-shrink-0 w-full sm:w-[450px] lg:w-[500px] snap-start border-l border-border-subtle last:border-r"
              >
                <div className="p-6 md:p-10 space-y-6 md:space-y-8 h-full flex flex-col justify-between">
                  <div className="space-y-6 md:space-y-8">
                    {/* Image Container */}
                    <div className="relative aspect-video rounded-3xl overflow-hidden border border-border-subtle group/img bg-bg-card">
                      <ProjectImage
                        image={project.image}
                        title={project.title}
                      />
                      <div className="absolute top-4 right-4 bg-bg-base/60 backdrop-blur-md px-3 py-1 rounded-full border border-border-subtle">
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                          {project.category}
                        </span>
                      </div>
                    </div>

                    {/* Text Content */}
                    <div className="space-y-4">
                      <h3 className="text-2xl md:text-3xl font-black text-accent-lime tracking-tighter uppercase leading-none group-hover:text-accent-lime transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-white font-light text-base leading-relaxed line-clamp-3 italic">
                        {project.description}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Action Bar */}
                  <div className="flex items-center justify-between pt-8 border-t border-border-subtle">
                    <Link href={`/projects/${project.id}`}>
                      <Magnetic>
                        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-text-primary hover:text-accent-lime transition-colors group/link cursor-pointer">
                          View Project
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Magnetic>
                    </Link>
                    <button
                      onClick={() => toggleLike(project.id)}
                      className={`p-3 rounded-full border transition-all ${
                        likedProjects.includes(project.id)
                          ? "bg-accent-lime border-accent-lime text-black scale-110 shadow-[0_0_15px_rgba(190,242,100,0.5)]"
                          : "border-border-subtle text-text-muted hover:bg-text-primary hover:text-bg-base hover:border-text-primary"
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          likedProjects.includes(project.id)
                            ? "fill-current"
                            : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* View More Slide */}
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
          </div>
        </div>

        {/* Slider Indicator Dots */}
        <div className="mt-12 lg:mt-20 flex flex-col items-center gap-6">
          <div className="flex gap-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-500 ${
                  Math.round(scrollProgress * 5) === i
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
