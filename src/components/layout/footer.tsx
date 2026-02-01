import { Github, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative z-10 py-10 px-6 bg-[rgba(204,255,0,0.9)] border-t border-black/10">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 mb-10">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-3xl font-black tracking-tighter text-black uppercase">
              AMEEN
            </h2>
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
