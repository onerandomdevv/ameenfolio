export type TechStackItem = Readonly<{
  id: string;
  name: string;
  abbreviation: string;
}>;

export type TechStackGroup = Readonly<{
  id: string;
  name: string;
  items: readonly TechStackItem[];
}>;

export const techStackGroups = [
  {
    id: "core-stack",
    name: "Core Stack",
    items: [
      { id: "javascript", name: "JavaScript", abbreviation: "JS" },
      { id: "typescript", name: "TypeScript", abbreviation: "TS" },
      { id: "react", name: "React", abbreviation: "R" },
      { id: "nextjs", name: "Next.js", abbreviation: "N" },
      { id: "tailwind-css", name: "Tailwind CSS", abbreviation: "TW" },
      { id: "nodejs", name: "Node.js", abbreviation: "N" },
      { id: "nestjs", name: "NestJS", abbreviation: "N" },
      { id: "postgresql", name: "PostgreSQL", abbreviation: "PG" },
      { id: "mongodb", name: "MongoDB", abbreviation: "M" },
      { id: "redis", name: "Redis", abbreviation: "R" },
      { id: "prisma", name: "Prisma", abbreviation: "P" },
      { id: "zustand", name: "Zustand", abbreviation: "Z" },
    ],
  },
  {
    id: "tools-and-infrastructure",
    name: "Tools & Infrastructure",
    items: [
      { id: "docker", name: "Docker", abbreviation: "D" },
      { id: "github-actions", name: "GitHub Actions", abbreviation: "GH" },
      { id: "cloudflare", name: "Cloudflare", abbreviation: "CF" },
      { id: "aws", name: "AWS", abbreviation: "AWS" },
      { id: "google-cloud-platform", name: "GCP", abbreviation: "G" },
      { id: "virtual-private-server", name: "VPS", abbreviation: "VPS" },
      { id: "nginx", name: "Nginx", abbreviation: "N" },
    ],
  },
] as const satisfies readonly TechStackGroup[];
