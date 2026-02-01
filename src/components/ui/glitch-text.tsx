"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface GlitchTextProps {
  text: string;
  className?: string;
}

export function GlitchText({ text, className }: GlitchTextProps) {
  const [isHovered, setIsHovered] = useState(false);

  // We use characters for a more granular glitch if needed
  const chars = text.split("");

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Text */}
      <span className="relative z-10">{text}</span>

      {/* Glitch Layers (Only show/animate on hover) */}
      {isHovered && (
        <>
          <motion.span
            className="absolute top-0 left-0 -z-10 text-red-500 opacity-70 mix-blend-screen pointer-events-none"
            animate={{
              x: [0, -2, 2, -1, 0],
              y: [0, 1, -1, 1, 0],
              clipPath: [
                "inset(10% 0 30% 0)",
                "inset(40% 0 10% 0)",
                "inset(70% 0 15% 0)",
                "inset(0% 0 0% 0)",
              ],
            }}
            transition={{
              duration: 0.2,
              repeat: Infinity,
              repeatType: "mirror",
            }}
          >
            {text}
          </motion.span>
          <motion.span
            className="absolute top-0 left-0 -z-20 text-blue-500 opacity-70 mix-blend-screen pointer-events-none"
            animate={{
              x: [0, 2, -2, 1, 0],
              y: [0, -1, 1, -1, 0],
              clipPath: [
                "inset(30% 0 10% 0)",
                "inset(10% 0 40% 0)",
                "inset(15% 0 70% 0)",
                "inset(0% 0 0% 0)",
              ],
            }}
            transition={{
              duration: 0.25,
              repeat: Infinity,
              repeatType: "mirror",
            }}
          >
            {text}
          </motion.span>
        </>
      )}
    </div>
  );
}
