"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { name: "About", href: "#about" },
  { name: "Roles", href: "#expertise" },
  { name: "Projects", href: "/projects" },
  { name: "Contact", href: "#contact" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-[400px] md:w-fit md:max-w-none">
        <nav className="bg-bg-glass backdrop-blur-2xl px-6 py-3 md:px-10 md:py-4 rounded-full flex items-center justify-between gap-12 border border-border-subtle shadow-lg">
          {/* Brand/Logo */}
          <Link
            href="/"
            className="text-xs md:text-sm font-black tracking-tighter text-text-primary uppercase z-[110]"
          >
            onerandomdevv
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-10">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-lime hover:text-white transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden flex flex-col gap-1.5 z-[110] relative p-1"
            aria-label="Toggle Menu"
          >
            <span
              className={`w-5 h-0.5 bg-accent-lime transition-transform duration-300 ${isOpen ? "rotate-45 translate-y-2" : ""}`}
            />
            <span
              className={`w-5 h-0.5 bg-accent-lime transition-opacity duration-300 ${isOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`w-5 h-0.5 bg-accent-lime transition-transform duration-300 ${isOpen ? "-rotate-45 -translate-y-2" : ""}`}
            />
          </button>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[90] bg-black/95 backdrop-blur-xl flex items-center justify-center md:hidden"
          >
            <div className="flex flex-col items-center gap-8">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="text-2xl font-black uppercase tracking-widest text-white hover:text-accent-lime transition-colors"
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
