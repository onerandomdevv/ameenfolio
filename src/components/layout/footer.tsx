import { Github, Twitter } from "lucide-react";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="relative z-10 py-10 px-6 bg-[rgba(204,255,0,0.9)] border-t border-black/10">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 mb-10">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 bg-black rounded-xl p-2 shadow-lg flex items-center justify-center">
                <Image
                  src="/brand/logo.png"
                  alt="Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <h2 className="text-3xl font-black tracking-tighter text-black uppercase">
                AMEEN
              </h2>
            </div>
            <p className="text-black font-medium text-sm max-w-sm leading-relaxed">
              Crafting digital ecosystems with purpose. Building the future of
              web interactions, one pixel at a time.
            </p>
          </div>

          {/* Navigation Column */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-black/50">
              Explore
            </h3>
            <ul className="space-y-2">
              {[
                { label: "Home", href: "/" },
                { label: "About", href: "/#about" },
                { label: "Roles", href: "/#expertise" },
                { label: "Projects", href: "/projects" },
                { label: "Marketplace", href: "/projects?tab=marketplace" },
                { label: "Contact", href: "/#contact" },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-xs font-bold text-black hover:text-white transition-colors uppercase tracking-wider"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Socials Column */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-black/50">
              Connect
            </h3>
            <ul className="space-y-2">
              {[
                {
                  label: "Github",
                  href: "https://github.com/onerandomdevv",
                  icon: Github,
                },
                {
                  label: "Twitter",
                  href: "https://x.com/onerandomdevv",
                  icon: Twitter,
                },
                {
                  label: "LinkedIn",
                  href: "https://www.linkedin.com/in/onerandomdevv",
                  icon: ({ className }: { className?: string }) => (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={className}
                    >
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                      <rect x="2" y="9" width="4" height="12" />
                      <circle cx="4" cy="4" r="2" />
                    </svg>
                  ),
                },
                {
                  label: "Telegram",
                  href: "https://t.me/onerandomdevv",
                  icon: ({ className }: { className?: string }) => (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={className}
                    >
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  ),
                },
                {
                  label: "WhatsApp",
                  href: "https://wa.link/m4mxba",
                  icon: ({ className }: { className?: string }) => (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={className}
                    >
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                  ),
                },
                {
                  label: "Email",
                  href: "mailto:abdulkareemalameen85@gmail.com",
                  icon: ({ className }: { className?: string }) => (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={className}
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  ),
                },
              ].map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 group"
                  >
                    <social.icon className="w-3.5 h-3.5 text-black group-hover:text-white transition-colors" />
                    <span className="text-xs font-bold text-black group-hover:text-white transition-colors uppercase tracking-wider">
                      {social.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-black/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-black">
            © 2026 AMEEN — CRAFTING DIGITAL ECOSYSTEMS
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-black/50">
            Designed & Built by Onerandomdevv
          </div>
        </div>
      </div>
    </footer>
  );
}
