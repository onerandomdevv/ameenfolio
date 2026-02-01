import React from "react";
import Image from "next/image";
import { SectionReveal } from "@/components/ui/section-reveal";

const TECH_STACK_DATA = [
  {
    title: "Frontend",
    contents: [
      { name: "JavaScript", logo: "/tech/frontend/javascript.png" },
      { name: "TypeScript", logo: "/tech/frontend/typescript.svg" },
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
    ],
  },
  {
    title: "Tools",
    contents: [
      { name: "Git", logo: "/tech/tools/git.svg" },
      { name: "AWS", logo: "/tech/tools/aws.svg" },
      { name: "Vercel", logo: "/tech/tools/vercel.png" },
      { name: "Render", logo: "/tech/tools/render.png" },
      { name: "ChatGPT", logo: "/tech/tools/chatgpt.svg" },
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

        {/* 4-Column Text-Based Grid */}
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
                  <li key={item.name} className="flex items-center gap-4">
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-glass border border-border-subtle p-1.5">
                      <Image
                        src={item.logo}
                        alt={`${item.name} logo`}
                        width={30}
                        height={30}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-[13px] font-bold uppercase tracking-widest text-white">
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
