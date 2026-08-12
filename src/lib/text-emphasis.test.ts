import { describe, expect, it } from "vitest";
import { portfolioIdentity } from "@/config/portfolio";
import { splitEmphasis } from "@/lib/text-emphasis";

const rejoin = (text: string) =>
  splitEmphasis(text)
    .map((segment) => segment.text)
    .join("");

describe("splitEmphasis", () => {
  it("emphasises text between double asterisks and drops the markers", () => {
    expect(
      splitEmphasis("I am a **Software Engineer** and a **Founder**."),
    ).toEqual([
      { text: "I am a ", emphasized: false },
      { text: "Software Engineer", emphasized: true },
      { text: " and a ", emphasized: false },
      { text: "Founder", emphasized: true },
      { text: ".", emphasized: false },
    ]);
  });

  it("keeps the visible text intact for the shipped introduction", () => {
    expect(rejoin(portfolioIdentity.introduction)).toBe(
      portfolioIdentity.introduction.replaceAll("**", ""),
    );
  });

  it("preserves newlines so the paragraph keeps its line breaks", () => {
    const segments = splitEmphasis("First line.\nSecond **line**.");
    expect(segments[0].text).toContain("\n");
    expect(rejoin("First line.\nSecond **line**.")).toBe(
      "First line.\nSecond line.",
    );
  });

  // Half-typed markers are the normal state of a field being edited, so they
  // must not emphasise the remainder of the paragraph.
  it("leaves an unclosed marker as written", () => {
    expect(splitEmphasis("I am a **Software")).toEqual([
      { text: "I am a **Software", emphasized: false },
    ]);
  });

  it("leaves an empty marker pair as written", () => {
    expect(splitEmphasis("a **** b")).toEqual([
      { text: "a **** b", emphasized: false },
    ]);
  });

  it("returns nothing for empty text", () => {
    expect(splitEmphasis("")).toEqual([]);
  });

  it("handles emphasis at both ends", () => {
    expect(splitEmphasis("**all of it**")).toEqual([
      { text: "all of it", emphasized: true },
    ]);
  });
});
