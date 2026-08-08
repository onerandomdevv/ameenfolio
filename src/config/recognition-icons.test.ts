import { describe, expect, it } from "vitest";
import {
  getRecognitionIcon,
  recognitionIconNames,
} from "@/config/recognition-icons";

describe("recognition icon registry", () => {
  it("resolves every persisted icon name", () => {
    for (const name of recognitionIconNames) {
      expect(getRecognitionIcon(name)).toBeTruthy();
    }
  });

  it("falls back safely when legacy data contains an unknown icon", () => {
    expect(getRecognitionIcon("legacy-icon")).toBe(
      getRecognitionIcon("trophy"),
    );
  });
});
