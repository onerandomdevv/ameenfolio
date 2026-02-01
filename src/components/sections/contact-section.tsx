import React from "react";
import { Twitter, MessageCircle, Send, Mail, Github } from "lucide-react";

export function ContactSection() {
  return (
    <section
      id="contact"
      className="container mx-auto py-16 lg:py-32 px-6 lg:px-12 bg-transparent"
    >
      <div className="max-w-7xl mx-auto">
        {/* Centralized Heading Area */}
        <div className="text-center mb-12 lg:mb-24 space-y-6">
          <h2 className="text-4xl md:text-6xl lg:text-8xl font-black text-accent-lime tracking-tighter uppercase leading-none">
            Get in touch.
          </h2>
          <p className="text-white font-light text-xl leading-relaxed max-w-2xl mx-auto">
            If you&apos;re interested in working together, discussing a project,
            or exploring a collaboration, feel free to reach out.
          </p>
        </div>

        {/* Two Column Grid */}
        <div className="grid lg:grid-cols-2 gap-20 lg:gap-32 items-center">
          {/* Left Column: Interests */}
          <div className="space-y-8 lg:space-y-12 lg:max-w-md lg:ml-auto w-full">
            <h4 className="text-3xl md:text-4xl lg:text-6xl font-black uppercase tracking-tighter text-accent-lime">
              Open to:
            </h4>
            <ul className="space-y-6">
              {[
                "Software development roles",
                "Full-stack projects",
                "AI-assisted workflows and tooling",
                "Collaborations",
                "Jobs & Hiring",
              ].map((item) => (
                <li key={item} className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-accent-lime" />
                  <span className="text-xl font-bold text-white">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column: Contact Card */}
          <div className="flex justify-center lg:justify-start">
            <div className="w-full max-w-md bg-zinc-900/50 p-8 lg:p-16 rounded-[3rem] lg:rounded-[4rem] border border-white/5 backdrop-blur-md relative overflow-hidden group">
              <div className="relative z-10 flex flex-col items-center gap-8 lg:gap-12 text-center">
                <h3 className="text-3xl font-black text-accent-lime tracking-tighter uppercase">
                  Contact me.
                </h3>

                {/* Social Icons Arrangement */}
                <div className="space-y-8 w-full">
                  <div className="flex justify-center gap-6 lg:gap-8">
                    {[
                      {
                        Icon: Twitter,
                        href: "https://x.com/onerandomdevv",
                        color: "hover:text-white",
                      },
                      {
                        Icon: MessageCircle,
                        href: "https://wa.me",
                        color: "hover:text-accent-lime",
                      },
                      {
                        Icon: Send,
                        href: "https://t.me",
                        color: "hover:text-blue-400",
                      },
                    ].map((social, i) => (
                      <a
                        key={i}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-5 rounded-2xl bg-white/5 border border-white/5 text-white/20 transition-all ${social.color} hover:bg-white/10 hover:scale-110 active:scale-95`}
                      >
                        <social.Icon className="w-6 h-6" />
                      </a>
                    ))}
                  </div>

                  <div className="flex justify-center gap-6 lg:gap-8">
                    {[
                      {
                        Icon: Mail,
                        href: "mailto:ameen@example.com",
                        color: "hover:text-red-400",
                      },
                      {
                        Icon: Github,
                        href: "https://github.com/onerandomdevv",
                        color: "hover:text-white",
                      },
                    ].map((social, i) => (
                      <a
                        key={i}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-5 rounded-2xl bg-white/5 border border-white/5 text-white/20 transition-all ${social.color} hover:bg-white/10 hover:scale-110 active:scale-95`}
                      >
                        <social.Icon className="w-6 h-6" />
                      </a>
                    ))}
                  </div>
                </div>

                <p className="text-[13px] font-medium italic text-white leading-relaxed max-w-[250px]">
                  &quot;These are the fastest way to get in touch with
                  AMEEN&quot;
                </p>
              </div>

              {/* Decorative Glow */}
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-accent-lime/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-accent-lime/10 transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
