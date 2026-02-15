"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { client } from "@/lib/sanity";
import { urlFor } from "@/lib/sanity-image";

const DEFAULT_ABOUT_IMAGES = ["/about/profile.png", "/about/profile-2.png"];

export function AboutSection() {
  const [aboutImages, setAboutImages] =
    useState<string[]>(DEFAULT_ABOUT_IMAGES);
  const [currentImage, setCurrentImage] = useState(0);
  const [resumeUrl, setResumeUrl] = useState("/resume");

  useEffect(() => {
    async function fetchAboutImages() {
      try {
        const settings = await client.fetch(
          '*[_type == "settings"][0]{aboutImages, "resumeUrl": resume.asset->url}',
        );
        if (settings?.aboutImages?.length > 0) {
          const urls = settings.aboutImages.map((img: any) =>
            urlFor(img).url(),
          );
          setAboutImages(urls);
        }
      } catch (error) {
        console.error("Error fetching about images:", error);
      }
    }
    fetchAboutImages();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % aboutImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [aboutImages.length]);

  return (
    <section
      id="about"
      className="relative py-16 lg:py-32 px-6 lg:px-8 bg-transparent overflow-hidden"
    >
      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="grid gap-16 lg:grid-cols-2 items-center">
          {/* Left Column: Image with creative framing */}
          <div className="relative aspect-square lg:aspect-[4/5] w-full max-w-md mx-auto lg:mx-0">
            <div className="absolute -inset-4 border border-accent-lime rounded-[3rem] -rotate-3 pointer-events-none" />
            <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden border border-accent-lime bg-zinc-900/50 p-4 shadow-2xl">
              <div className="h-full w-full rounded-2xl overflow-hidden relative">
                <AnimatePresence initial={false}>
                  <motion.div
                    key={currentImage}
                    initial={{ x: "100%", scale: 1.1 }}
                    animate={{ x: 0, scale: 1 }}
                    exit={{ x: "-100%" }}
                    transition={{
                      x: { duration: 0.8, ease: "easeInOut" },
                      scale: { duration: 6, ease: "linear" },
                    }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={aboutImages[currentImage]}
                      alt="Ameen"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right Column: Text Content */}
          <div className="space-y-8 lg:space-y-12">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl lg:text-7xl font-black text-accent-lime tracking-tighter uppercase">
                WHO&apos;S AMEEN?
              </h2>
            </div>

            <div className="space-y-8 text-white font-light leading-relaxed text-xl">
              <p>
                Ameen is a software developer with a strong focus on building
                clean, maintainable, and scalable software solutions. His work
                spans full-stack web development, system-level programming, and
                AI-assisted workflows. Ameen has collaborated with other
                developers and teams on a range of projects, contributing to
                system design, implementation, and optimization. He values clear
                communication, shared standards, and building software that
                works well beyond the initial release.
              </p>
              <p>
                I care deeply about structure, performance, and clarity, both in
                code and in user experience. Whether I'm designing backend
                logic, building modern web interfaces, or crafting precise
                prompts for AI models, my goal is always to create software that
                is reliable, understandable, and built to last.
              </p>
            </div>

            <div className="pt-4">
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-text-primary hover:text-accent-lime transition-colors border-b-2 border-border-highlight pb-1"
              >
                <FileText className="w-4 h-4" />
                VIEW RESUME
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
