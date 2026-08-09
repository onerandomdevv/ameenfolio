export const portfolioIdentity = {
  name: "Aliameen Kareem",
  role: "Full-Stack Engineer",
  // The line break is rendered via `whitespace-pre-line` on the intro paragraph.
  introduction:
    "I am a Software Engineer and Founder building products. From idea to design, engineering, deployment, and leading the team behind it.\nI build, ship, and share the journey.",
  // Phrases within `introduction` rendered bold and underlined. Matched
  // literally and case-sensitively, so a phrase edited above has to be edited
  // here too or it silently stops being emphasised.
  introductionEmphasis: ["Software Engineer", "Founder"],
} as const;
