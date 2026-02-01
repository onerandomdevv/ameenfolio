"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRightCircle, Play, Tag } from "lucide-react";
import { motion } from "framer-motion";

const MOCK_MARKETPLACE: {
  id: number;
  title: string;
  description: string;
  image: string;
}[] = [
  // {
  //   id: 1,
  //   title: "Venture SaaS Template",
  //   description:
  //     "A high-conversion landing page and dashboard template optimized for modern software startups.",
  //   image:
  //     "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000",
  // },
];

export function MarketplaceSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const progress = scrollLeft / (scrollWidth - clientWidth);
    setScrollProgress(progress);
  };

  return (
    <section className="py-16 lg:py-32 bg-transparent overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12 mb-12 lg:mb-20 text-center lg:text-left">
        <h2 className="text-4xl md:text-5xl lg:text-7xl font-black text-accent-lime tracking-tighter uppercase mb-6">
          Marketplace.
        </h2>
        <p className="text-white font-light text-xl max-w-2xl lg:mx-0 mx-auto leading-relaxed">
          Pre-built and custom website solutions designed for performance,
          clarity, and long-term use. Suitable for businesses, startups, and
          individuals looking for clean, reliable web systems.
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
          {MOCK_MARKETPLACE.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="flex-shrink-0 w-full sm:w-[450px] lg:w-[500px] snap-start border-l border-white/5 last:border-r"
            >
              <div className="p-6 md:p-10 space-y-6 md:space-y-8 h-full flex flex-col justify-between">
                <div className="space-y-6 md:space-y-8">
                  {/* Image Container */}
                  <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 group/img">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Text Content */}
                  <div className="space-y-4">
                    <h3 className="text-2xl md:text-3xl font-black text-accent-lime tracking-tighter uppercase leading-none group-hover:text-accent-lime transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-white font-light text-base leading-relaxed line-clamp-3 italic">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="flex items-center gap-4 pt-8 border-t border-white/5">
                  <button className="flex-1 py-4 px-6 rounded-full border border-white/10 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60 hover:bg-white hover:text-black hover:border-white transition-all group/btn">
                    <Play className="w-3 h-3 group-hover:fill-current" />
                    Watch Reel
                  </button>
                  <button className="flex-[1.2] py-4 px-6 rounded-full bg-white text-black flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-accent-lime hover:scale-[1.02] transition-all">
                    <Tag className="w-3 h-3" />
                    Make an offer
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* View More Slide */}
          <div className="flex-shrink-0 w-full sm:w-[450px] lg:w-[400px] snap-start border-l border-white/5 last:border-r flex items-center justify-center">
            <Link
              href="/marketplace"
              className="flex flex-col items-center gap-6 group/more"
            >
              <div className="w-24 h-24 rounded-full border border-white/10 flex items-center justify-center group-hover/more:border-accent-lime group-hover/more:bg-accent-lime transition-all duration-500 overflow-hidden relative">
                <ArrowRightCircle className="w-10 h-10 text-white/20 group-hover/more:text-black absolute z-10" />
                <motion.div
                  initial={{ scale: 0 }}
                  whileHover={{ scale: 1 }}
                  className="absolute inset-0 bg-accent-lime"
                />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 group-hover/more:text-white transition-colors">
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
                  : "w-2 bg-white/10"
              }`}
            />
          ))}
        </div>
        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/10">
          Scroll to explore Marketplace
        </div>
      </div>
    </section>
  );
}
