// The starting copy, used until it is edited in the admin. Once Profile is
// saved, the stored values win and this is only the fallback for a site that
// has never been set up.
export const portfolioIdentity = {
  name: "Aliameen Kareem",
  role: "Full-Stack Engineer",
  // `\n` starts a new line, rendered by `whitespace-pre-line` on the intro
  // paragraph, and **double asterisks** make a phrase bold and underlined.
  // Both are what the admin's Description field produces.
  introduction:
    "I am a **Software Engineer** and **Founder** building products. From idea to design, engineering, deployment, and leading the team behind it.\nI build, ship, and share the journey.",
} as const;
