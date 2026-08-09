import { describe, expect, it } from "vitest";
import { splitEmphasis } from "@/lib/text-emphasis";
import { portfolioIdentity } from "@/config/portfolio";

describe("splitEmphasis", () => {
  it("marks each term and keeps the surrounding text intact", () => {
    expect(splitEmphasis("a Founder here", ["Founder"])).toEqual([
      { text: "a ", emphasized: false },
      { text: "Founder", emphasized: true },
      { text: " here", emphasized: false },
    ]);
  });

  it("preserves the original text exactly when rejoined", () => {
    const text = portfolioIdentity.introduction;
    const rejoined = splitEmphasis(text, portfolioIdentity.introductionEmphasis)
      .map((segment) => segment.text)
      .join("");

    expect(rejoined).toBe(text);
  });

  it("prefers the longest term when one contains another", () => {
    expect(
      splitEmphasis("Software Engineer", ["Engineer", "Software Engineer"]),
    ).toEqual([{ text: "Software Engineer", emphasized: true }]);
  });

  it("matches every occurrence", () => {
    const marked = splitEmphasis("Founder and Founder", ["Founder"]).filter(
      (segment) => segment.emphasized,
    );

    expect(marked).toHaveLength(2);
  });

  it("is case sensitive", () => {
    expect(splitEmphasis("founder", ["Founder"])).toEqual([
      { text: "founder", emphasized: false },
    ]);
  });

  it("returns the text untouched when there are no terms", () => {
    expect(splitEmphasis("plain", [])).toEqual([
      { text: "plain", emphasized: false },
    ]);
    expect(splitEmphasis("", ["Founder"])).toEqual([]);
  });

  it("emphasises both configured phrases in the real introduction", () => {
    const marked = splitEmphasis(
      portfolioIdentity.introduction,
      portfolioIdentity.introductionEmphasis,
    )
      .filter((segment) => segment.emphasized)
      .map((segment) => segment.text);

    expect(marked).toEqual(["Software Engineer", "Founder"]);
  });
});
