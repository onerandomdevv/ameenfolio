import React from "react";
import { Code, Layout, Terminal } from "lucide-react";
import { SectionReveal } from "@/components/ui/section-reveal";

export function ExpertiseSection() {
  return (
    <SectionReveal>
      <section
        id="expertise"
        className="relative py-16 lg:py-32 px-6 lg:px-8 bg-transparent overflow-hidden"
      >
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="mb-12 lg:mb-24 space-y-4 max-w-2xl mx-auto text-center">
            <h2 className="text-4xl lg:text-5xl font-black text-accent-lime tracking-tighter uppercase">
              EXPERTISE & ROLES.
            </h2>
          </div>

          <div className="grid gap-12 lg:grid-cols-3">
            {[
              {
                icon: <Code className="w-6 h-6" />,
                title: "Software Developer",
                desc: "I design and implement robust software solutions with a strong emphasis on algorithmic thinking, code quality, and long-term maintainability.",
                areas: [
                  "Python development",
                  "Algorithm design and optimization",
                  "System-level and desktop applications",
                  "Clean, well-documented codebases",
                ],
              },
              {
                icon: <Layout className="w-6 h-6" />,
                title: "Full-Stack Developer",
                desc: "I build modern, scalable web applications with attention to both backend architecture and frontend usability.",
                areas: [
                  "Responsive and performant web apps",
                  "API design and integration",
                  "Scalable application architecture",
                  "Seamless user experiences across the stack",
                ],
              },
              {
                icon: <Terminal className="w-6 h-6" />,
                title: "Prompt Engineer",
                desc: "I specialize in designing precise prompts and workflows that improve the reliability and usefulness of large language models.",
                areas: [
                  "LLM prompt optimization",
                  "AI-driven workflows and automation",
                  "Model interaction design",
                  "Task-specific prompt structuring",
                ],
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-bg-card p-6 md:p-10 space-y-8 lg:space-y-12 border border-border-subtle rounded-3xl backdrop-blur-sm"
              >
                <div className="space-y-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-bg-glass border border-border-subtle rounded-xl text-accent-lime">
                    {item.icon}
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-black uppercase tracking-tight text-accent-lime leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-white font-light leading-relaxed text-base">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="h-px w-full bg-border-subtle" />
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-lime">
                      Key focus areas
                    </h4>
                    <div className="flex flex-col gap-3">
                      {item.areas.map((area, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-1 h-1 rounded-full bg-border-highlight" />
                          <span className="text-[11px] font-bold uppercase tracking-widest text-white">
                            {area}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SectionReveal>
  );
}
