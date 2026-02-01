"use client";

import { motion } from "framer-motion";
import React from "react";

export function SectionReveal({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{
        duration: 0.8,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
    >
      {children}
    </motion.div>
  );
}
