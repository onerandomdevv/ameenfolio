import { describe, expect, it } from "vitest";
import { rateBippyPerformance } from "@/components/bippy/bippy-performance";

describe("rateBippyPerformance", () => {
  it("rates smooth animation as good", () => {
    expect(
      rateBippyPerformance({ averageFps: 60, slowFramePercentage: 2 }),
    ).toBe("good");
  });

  it("rates acceptable animation as fair", () => {
    expect(
      rateBippyPerformance({ averageFps: 49, slowFramePercentage: 9 }),
    ).toBe("fair");
  });

  it("flags consistently slow animation", () => {
    expect(
      rateBippyPerformance({ averageFps: 38, slowFramePercentage: 21 }),
    ).toBe("needs-attention");
  });
});
