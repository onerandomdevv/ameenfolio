import { describe, expect, it } from "vitest";
import { techStackGroups } from "@/config/tech-stack";

describe("techStackGroups", () => {
  it("keeps the approved groups and technology order", () => {
    expect(
      techStackGroups.map((group) => ({
        name: group.name,
        items: group.items.map(({ name, abbreviation }) => ({
          name,
          abbreviation,
        })),
      })),
    ).toEqual([
      {
        name: "Core Stack",
        items: [
          { name: "JavaScript", abbreviation: "JS" },
          { name: "TypeScript", abbreviation: "TS" },
          { name: "React", abbreviation: "R" },
          { name: "Next.js", abbreviation: "N" },
          { name: "Tailwind CSS", abbreviation: "TW" },
          { name: "Node.js", abbreviation: "N" },
          { name: "NestJS", abbreviation: "N" },
          { name: "PostgreSQL", abbreviation: "PG" },
          { name: "MongoDB", abbreviation: "M" },
          { name: "Redis", abbreviation: "R" },
          { name: "Prisma", abbreviation: "P" },
          { name: "Zustand", abbreviation: "Z" },
        ],
      },
      {
        name: "Tools & Infrastructure",
        items: [
          { name: "Docker", abbreviation: "D" },
          { name: "GitHub Actions", abbreviation: "GH" },
          { name: "Cloudflare", abbreviation: "CF" },
          { name: "AWS", abbreviation: "AWS" },
          { name: "GCP", abbreviation: "G" },
          { name: "VPS", abbreviation: "VPS" },
          { name: "Nginx", abbreviation: "N" },
        ],
      },
    ]);
  });

  it("does not include the deliberately excluded entries", () => {
    const names = techStackGroups.flatMap((group) =>
      group.items.map((item) => item.name),
    );

    expect(names).not.toEqual(
      expect.arrayContaining([
        "Auth.js",
        "NextAuth",
        "Passport.js",
        "JWT",
        "OAuth",
        "NoSQL",
        "Claude",
        "Codex",
        "Gemini",
        "CodeRabbit",
      ]),
    );
  });
});
