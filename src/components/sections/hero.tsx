"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Github, Linkedin, Twitter, Mail, FileText } from "lucide-react";
import { Magnetic } from "@/components/ui/magnetic";
import { SectionReveal } from "@/components/ui/section-reveal";
import { GlitchText } from "@/components/ui/glitch-text";
import { client } from "@/lib/sanity";
import { urlFor } from "@/lib/sanity-image";

const DEFAULT_HERO_IMAGES = [
  "/herobanner/hero-1.png",
  "/herobanner/hero-2.jpg",
  "/herobanner/hero-3.jpg",
  "/herobanner/hero-4.jpg",
];

const EXPERTISE_MODULES = [
  {
    title: "SOFTWARE DEVELOPER",
    desc: "Designing and implementing robust software solutions with a strong emphasis on algorithmic thinking, code quality, and long-term maintainability.",
  },
  {
    title: "FULL STACK DEVELOPER",
    desc: "Building modern, scalable web applications with attention to both backend architecture and frontend usability.",
  },
  {
    title: "PROMPT ENGINEER",
    desc: "Specializing in designing precise prompts and workflows that improve the reliability and usefulness of large language models.",
  },
];

export function Hero() {
  const [heroImages, setHeroImages] = useState<string[]>(DEFAULT_HERO_IMAGES);
  const [currentImage, setCurrentImage] = useState(0);
  const [resumeUrl, setResumeUrl] = useState("/resume");

  useEffect(() => {
    async function fetchHeroImages() {
      try {
        const settings = await client.fetch(
          '*[_type == "settings"][0]{heroBanners, "resumeUrl": resume.asset->url, externalResumeLink}',
        );
        if (settings?.heroBanners?.length > 0) {
          const urls = settings.heroBanners.map((img: any) =>
            urlFor(img).url(),
          );
          setHeroImages(urls);
        }
      } catch (error) {
        console.error("Error fetching hero images:", error);
      }
    }
    fetchHeroImages();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  return (
    <SectionReveal>
      <div className="relative min-h-screen bg-transparent overflow-hidden">
        {/* Floating Vertical Social Sidebar (Thin Pill) */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="fixed left-4 lg:left-6 top-[40%] -translate-y-1/2 z-[60] py-6 lg:py-8 w-[40px] lg:w-[50px] bg-bg-glass backdrop-blur-2xl rounded-full hidden md:flex flex-col items-center gap-6 lg:gap-8 border border-border-subtle"
        >
          <div className="flex flex-col items-center w-full gap-4 mb-2">
            <Link href="/" className="group/logo">
              <div className="relative w-6 h-6 transition-transform duration-300 group-hover/logo:scale-120 group-hover/logo:rotate-12">
                <Image
                  src="/brand/logo.png"
                  alt="Logo"
                  fill
                  className="object-contain mix-blend-screen"
                />
              </div>
            </Link>
            <div className="w-6 h-px bg-border-subtle" />
          </div>
          <Magnetic>
            <a
              href="https://github.com/onerandomdevv"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Github Profile"
            >
              <Github className="w-5 h-5 text-accent-lime hover:text-white cursor-pointer transition-colors" />
            </a>
          </Magnetic>
          <Magnetic>
            <a
              href="https://www.linkedin.com/in/onerandomdevv"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn Profile"
            >
              <Linkedin className="w-5 h-5 text-accent-lime hover:text-white cursor-pointer transition-colors" />
            </a>
          </Magnetic>
          <Magnetic>
            <a
              href="https://x.com/onerandomdevv"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter Profile"
            >
              <Twitter className="w-5 h-5 text-accent-lime hover:text-white cursor-pointer transition-colors" />
            </a>
          </Magnetic>
          <Magnetic>
            <a
              href="mailto:abdulkareemalameen85@gmail.com"
              aria-label="Send Email"
            >
              <Mail className="w-5 h-5 text-accent-lime hover:text-white cursor-pointer transition-colors" />
            </a>
          </Magnetic>
        </motion.div>

        <section className="relative min-h-screen md:min-h-[85vh] lg:min-h-screen w-full flex items-center justify-center p-0 md:p-6 lg:p-12 lg:pt-12">
          {/* Main Contained Hero Card - Full Bleed on Mobile, Card on Desktop */}
          <div className="relative w-full h-full min-h-[100dvh] md:min-h-[600px] lg:min-h-full max-w-[1700px] rounded-none md:rounded-[2rem] lg:rounded-[3.5rem] overflow-hidden border-none md:border md:border-border-subtle shadow-none md:shadow-2xl bg-bg-base flex flex-col justify-end">
            {/* Background Slider */}
            <div className="absolute inset-0 z-0">
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
                    src={heroImages[currentImage]}
                    alt="Background"
                    fill
                    priority
                    unoptimized
                    className="object-cover object-center md:object-top lg:object-center opacity-70 md:opacity-60"
                  />
                  {/* Mobile specific gradient: Heavy bottom fade for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/80 to-transparent opacity-90 md:hidden" />

                  {/* Desktop gradient */}
                  <div className="hidden md:block absolute inset-0 bg-gradient-to-tr from-bg-base via-transparent to-bg-base opacity-80" />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="relative z-10 w-full h-full flex flex-col lg:flex-row items-end justify-between p-6 pb-24 md:p-12 lg:p-20 pt-32 lg:pt-20 gap-8">
              {/* Left Bottom: Huge Brand Text */}
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="pointer-events-none w-full md:w-auto"
              >
                <h1 className="text-5xl md:text-5xl lg:text-7xl font-black tracking-tighter text-accent-lime leading-[0.8] break-words">
                  <GlitchText text="AMEEN" />
                </h1>
              </motion.div>

              {/* Right Side: Expertise Card */}
              <div className="w-full lg:w-[450px] mt-4 md:mt-8 lg:mt-0">
                <motion.div
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-transparent md:bg-bg-glass md:backdrop-blur-3xl p-0 md:p-8 lg:p-12 rounded-none md:rounded-[2rem] lg:rounded-[3.5rem] border-none md:border md:border-border-subtle space-y-8 lg:space-y-12 relative"
                >
                  <div className="space-y-14">
                    {EXPERTISE_MODULES.map((module, i) => (
                      <div
                        key={i}
                        className="space-y-2 lg:space-y-3 relative group"
                      >
                        <h3 className="text-lg lg:text-xl font-black tracking-tighter text-accent-lime leading-tight">
                          {module.title}
                        </h3>
                        <p className="text-xs lg:text-[13px] text-zinc-300 lg:text-white font-light leading-relaxed">
                          {module.desc}
                        </p>
                        {i < EXPERTISE_MODULES.length - 1 && (
                          <div className="absolute -bottom-7 left-0 right-0 h-px bg-border-subtle" />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 lg:pt-4 border-t border-white/10 lg:border-none mt-6 lg:mt-0">
                    <a
                      href={resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="View Resume"
                      className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-text-primary hover:text-accent-lime transition-colors border-b-2 border-border-highlight pb-1"
                    >
                      <FileText className="w-4 h-4" />
                      VIEW RESUME
                    </a>
                    <div className="flex items-center gap-2">
                      <div className="relative w-4 h-4">
                        <Image
                          src="/brand/logo.png"
                          alt="Logo"
                          fill
                          className="object-contain mix-blend-screen"
                        />
                      </div>
                      <span className="text-[11px] font-black text-accent-lime tracking-tight">
                        @onerandomdevv
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20 md:hidden">
              {heroImages.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    i === currentImage
                      ? "bg-accent-lime w-4"
                      : "bg-border-highlight"
                  }`}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </SectionReveal>
  );
}
