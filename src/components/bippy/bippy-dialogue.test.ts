import { describe, expect, it } from "vitest";
import {
  bippyDialogues,
  isBippyDialogueKey,
} from "@/components/bippy/bippy-dialogue";

describe("Bippy contextual dialogue", () => {
  it("recognizes only configured dialogue keys", () => {
    expect(isBippyDialogueKey("projects")).toBe(true);
    expect(isBippyDialogueKey("projects-dwell")).toBe(true);
    expect(isBippyDialogueKey("unknown")).toBe(false);
    expect(isBippyDialogueKey(undefined)).toBe(false);
  });

  it("keeps every message brief enough for the companion bubble", () => {
    for (const dialogue of Object.values(bippyDialogues)) {
      expect(dialogue.text.length).toBeLessThanOrEqual(64);
      expect(dialogue.duration).toBeGreaterThanOrEqual(2_000);
      expect(dialogue.duration).toBeLessThanOrEqual(6_000);
    }
  });
});
