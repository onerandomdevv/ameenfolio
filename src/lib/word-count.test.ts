import { describe, expect, it } from "vitest";
import {
  MAX_CARD_WORDS,
  countWords,
  withinCardWordLimit,
} from "@/lib/word-count";
import { projectSchema, recognitionSchema } from "@/lib/validation";

const words = (count: number) =>
  Array.from({ length: count }, () => "w").join(" ");

describe("countWords", () => {
  it("counts words separated by any run of whitespace", () => {
    expect(countWords("one  two\tthree\nfour")).toBe(4);
  });

  it("ignores surrounding whitespace", () => {
    expect(countWords("  solo  ")).toBe(1);
  });

  it("counts nothing for blank input", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   ")).toBe(0);
  });
});

describe("withinCardWordLimit", () => {
  it("allows exactly the limit", () => {
    expect(withinCardWordLimit(words(MAX_CARD_WORDS))).toBe(true);
  });

  it("rejects one word over", () => {
    expect(withinCardWordLimit(words(MAX_CARD_WORDS + 1))).toBe(false);
  });
});

describe("card copy limits", () => {
  const project = {
    title: "Twizrr",
    url: "https://twizrr.com",
    iconName: "custom",
    showOnHomepage: true,
    homepageOrder: 0,
    published: true,
  };

  it("rejects a project description over the word limit", () => {
    const result = projectSchema.safeParse({
      ...project,
      shortDescription:
        "Twizrr is a Social-commerce marketplace that connects business owners, Customers and Content Creators in one unified platform.",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a project description within the word limit", () => {
    const result = projectSchema.safeParse({
      ...project,
      shortDescription:
        "Social-commerce marketplace connecting business owners, customers and content creators.",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a recognition title over the word limit", () => {
    const result = recognitionSchema.safeParse({
      title: words(MAX_CARD_WORDS + 1),
      iconName: "trophy",
      displayOrder: 0,
      published: true,
    });

    expect(result.success).toBe(false);
  });

  it("accepts the existing recognition titles", () => {
    for (const title of [
      "2nd Place at 234 AI HACKATHON x COMMERCE FUSION",
      "1st Place at Africastalking x Google AI Hackathon",
    ]) {
      expect(
        recognitionSchema.safeParse({
          title,
          iconName: "github",
          displayOrder: 0,
          published: true,
        }).success,
      ).toBe(true);
    }
  });
});
