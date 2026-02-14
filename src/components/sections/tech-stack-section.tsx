import React from "react";
import Image from "next/image";
import { SectionReveal } from "@/components/ui/section-reveal";

const LANGUAGES_DATA = [
  { name: "JavaScript", logo: "/tech/languages/javascript.png" },
  { name: "TypeScript", logo: "/tech/languages/typescript.svg" },
  { name: "Python", logo: "/tech/languages/python.png" },
];

const TECH_STACK_DATA = [
  {
    title: "Frontend",
    contents: [
      { name: "React", logo: "/tech/frontend/react.svg" },
      { name: "Next.js", logo: "/tech/frontend/nextjs.png" },
      { name: "Redux", logo: "/tech/frontend/redux.png" },
      { name: "Tailwind CSS", logo: "/tech/frontend/tailwind.svg" },
      { name: "Framer Motion", logo: "/tech/frontend/framer.png" },
      { name: "Bootstrap", logo: "/tech/frontend/bootstrap.svg" },
    ],
  },
  {
    title: "Backend",
    contents: [
      { name: "Node.js", logo: "/tech/backend/nodejs.svg" },
      { name: "NestJS", logo: "/tech/backend/nestjs.svg" },
      { name: "Express.js", logo: "/tech/backend/express.png" },
    ],
  },
  {
    title: "Database",
    contents: [
      { name: "PostgreSQL", logo: "/tech/database/postgresql.svg" },
      { name: "MongoDB", logo: "/tech/database/mongodb.svg" },
      { name: "Supabase", logo: "/tech/database/supabase.png" },
      { name: "Prisma", logo: "/tech/database/prisma.png" },
    ],
  },
  {
    title: "Tools",
    contents: [
      { name: "Git", logo: "/tech/tools/git.svg" },
      { name: "AWS", logo: "/tech/tools/aws.svg" },
      { name: "Vercel", logo: "/tech/tools/vercel.png" },
      { name: "Render", logo: "/tech/tools/render.png" },
      { name: "OpenAI GPT", logo: "/tech/tools/chatgpt.svg" },
      { name: "Claude", logo: "/tech/tools/claude.svg" },
      { name: "Gemini", logo: "/tech/tools/gemini.svg" },
    ],
  },
];

export function TechStackSection() {
  return (
    <SectionReveal>
      <section className="container mx-auto py-16 lg:py-32 px-6 lg:px-12 bg-transparent relative z-10">
        {/* Section Header */}
        <div className="mb-12 lg:mb-24 text-center">
          <h2 className="text-4xl md:text-5xl lg:text-7xl font-black text-accent-lime tracking-tighter uppercase leading-none">
            TECH STACK.
          </h2>
        </div>

        {/* Languages Grid - Prominent Cards */}
        <div className="mb-12 md:mb-20">
          <h3 className="text-2xl font-black uppercase tracking-tighter text-white mb-8 md:mb-10 text-center lg:text-left flex items-center justify-center lg:justify-start gap-4">
            <span className="w-8 h-1 bg-accent-lime rounded-full" />
            Languages
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8">
            {LANGUAGES_DATA.map((lang) => (
              <div
                key={lang.name}
                className="group relative bg-bg-glass backdrop-blur-md rounded-2xl border border-border-subtle p-8 flex flex-col items-center justify-center gap-6 hover:border-accent-lime/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(204,255,0,0.1)]"
              >
                <div className="relative w-24 h-24 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                  <Image
                    src={lang.logo}
                    alt={`${lang.name} logo`}
                    fill
                    className="object-contain drop-shadow-lg"
                  />
                </div>
                <h4 className="text-lg font-black uppercase tracking-widest text-zinc-400 group-hover:text-accent-lime transition-colors">
                  {lang.name}
                </h4>

                {/* Decorative Elements */}
                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-border-highlight group-hover:bg-accent-lime transition-colors" />
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-lime/0 to-transparent group-hover:via-accent-lime/50 transition-all duration-500" />
              </div>
            ))}
          </div>
        </div>

        {/* Tech Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-12">
          {TECH_STACK_DATA.map((column) => (
            <div key={column.title} className="space-y-10">
              {/* Column Heading with + icon style */}
              <h3 className="text-xl font-black uppercase tracking-tighter text-accent-lime flex items-center justify-between border-b border-border-subtle pb-4">
                {column.title}
                <span className="text-accent-lime text-2xl">+</span>
              </h3>

              {/* Contents List */}
              <ul className="space-y-6">
                {column.contents.map((item) => (
                  <li
                    key={item.name}
                    className="flex items-center gap-4 group/item"
                  >
                    <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-bg-glass border border-border-subtle p-2 transition-colors">
                      <Image
                        src={item.logo}
                        alt={`${item.name} logo`}
                        width={30}
                        height={30}
                        className="w-full h-full object-contain transition-all duration-300"
                      />
                    </div>
                    <span className="text-[13px] font-bold uppercase tracking-widest text-zinc-300 transition-colors">
                      {item.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </SectionReveal>
  );
}
