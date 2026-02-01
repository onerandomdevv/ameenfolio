"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Github,
  Linkedin,
  Twitter,
  MessageCircle,
  FileText,
} from "lucide-react";
import { Magnetic } from "@/components/ui/magnetic";
import { SectionReveal } from "@/components/ui/section-reveal";
import { GlitchText } from "@/components/ui/glitch-text";

const HERO_IMAGES = [
  "/herobanner/hero-1.jpg",
  "/herobanner/hero-2.jpg",
  "/herobanner/hero-3.jpg",
  "/herobanner/hero-4.jpg",
];

const EXPERTISE_MODULES = [
  {
    title: "SOFTWARE DEVELOPER",
    desc: "I design and implement robust software solutions with a strong emphasis on algorithmic thinking, code quality, and long-term maintainability.",
  },
  {
    title: "FULL STACK DEVELOPER",
    desc: "I build modern, scalable web applications with attention to both backend architecture and frontend usability.",
  },
  {
    title: "PROMPT ENGINEER",
    desc: "I specialize in designing precise prompts and workflows that improve the reliability and usefulness of large language models.",
  },
];

export function Hero() {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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
          <Magnetic>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Github Profile"
            >
              <Github className="w-5 h-5 text-accent-lime hover:text-white cursor-pointer transition-colors" />
            </a>
          </Magnetic>
          <Magnetic>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn Profile"
            >
              <Linkedin className="w-5 h-5 text-accent-lime hover:text-white cursor-pointer transition-colors" />
            </a>
          </Magnetic>
          <Magnetic>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter Profile"
            >
              <Twitter className="w-5 h-5 text-accent-lime hover:text-white cursor-pointer transition-colors" />
            </a>
          </Magnetic>
          <Magnetic>
            <a href="mailto:contact@example.com" aria-label="Send Email">
              <MessageCircle className="w-5 h-5 text-accent-lime hover:text-white cursor-pointer transition-colors" />
            </a>
          </Magnetic>
        </motion.div>

        <section className="relative min-h-screen md:min-h-[85vh] lg:min-h-screen w-full flex items-center justify-center p-4 pt-24 md:p-6 lg:p-12 lg:pt-12">
          {/* Main Contained Hero Card */}
          <div className="relative w-full h-full min-h-[600px] lg:min-h-full max-w-[1700px] rounded-[2rem] lg:rounded-[3.5rem] overflow-hidden border border-border-subtle shadow-2xl bg-bg-base flex flex-col justify-end">
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
                    src={HERO_IMAGES[currentImage]}
                    alt="Background"
                    fill
                    priority
                    className="object-cover object-center md:object-top lg:object-center opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-bg-base via-transparent to-bg-base opacity-80" />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="relative z-10 w-full h-full flex flex-col lg:flex-row items-end justify-between p-6 md:p-12 lg:p-20 pt-32 lg:pt-20 gap-8">
              {/* Left Bottom: Huge Brand Text */}
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="pointer-events-none"
              >
                <h1 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter text-accent-lime leading-[0.8] break-words">
                  <GlitchText text="AMEEN" />
                </h1>
              </motion.div>

              {/* Right Side: Expertise Card */}
              <div className="w-full lg:w-[450px] mt-8 lg:mt-0">
                <motion.div
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-bg-glass backdrop-blur-3xl p-6 md:p-8 lg:p-12 rounded-[2rem] lg:rounded-[3.5rem] border border-border-subtle space-y-8 lg:space-y-12 relative"
                >
                  <div className="space-y-14">
                    {EXPERTISE_MODULES.map((module, i) => (
                      <div key={i} className="space-y-3 relative group">
                        <h3 className="text-xl font-black tracking-tighter text-accent-lime leading-tight">
                          {module.title}
                        </h3>
                        <p className="text-[13px] text-white font-light leading-relaxed">
                          {module.desc}
                        </p>
                        {i < EXPERTISE_MODULES.length - 1 && (
                          <div className="absolute -bottom-7 left-0 right-0 h-px bg-border-subtle" />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <a
                      href="/resume.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="View Resume"
                      className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-text-primary hover:text-accent-lime transition-colors border-b-2 border-border-highlight pb-1"
                    >
                      <FileText className="w-4 h-4" />
                      VIEW RESUME
                    </a>
                    <span className="text-[11px] font-black text-accent-lime tracking-tight">
                      @onerandomdevv
                    </span>
                  </div>
                </motion.div>
              </div>
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 z-20 md:hidden">
              {HERO_IMAGES.map((_, i) => (
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
