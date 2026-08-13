import { describe, expect, it } from "vitest";
import {
  assistantDecisionSchema,
  assistantMessageSchema,
  assistantThreadIdSchema,
  assistantThreadMutationSchema,
} from "@/lib/ai/validation";

describe("portfolio copilot request validation", () => {
  it("accepts a new message without a thread id", () => {
    expect(
      assistantMessageSchema.parse({ message: "Create a private draft." }),
    ).toEqual({ message: "Create a private draft." });
  });

  it("accepts a safe model identifier and rejects arbitrary values", () => {
    expect(
      assistantMessageSchema.parse({
        message: "Summarize my portfolio.",
        model: "gpt-5.4-mini",
      }).model,
    ).toBe("gpt-5.4-mini");
    expect(() =>
      assistantMessageSchema.parse({
        message: "Summarize my portfolio.",
        model: "../../../another-model",
      }),
    ).toThrow();
  });

  it("rejects empty and oversized prompts", () => {
    expect(() => assistantMessageSchema.parse({ message: "   " })).toThrow();
    expect(() =>
      assistantMessageSchema.parse({ message: "x".repeat(8_001) }),
    ).toThrow();
  });

  it("accepts only explicit approval decisions and UUIDs", () => {
    expect(assistantDecisionSchema.parse({ decision: "approve" })).toEqual({
      decision: "approve",
    });
    expect(() =>
      assistantDecisionSchema.parse({ decision: "execute" }),
    ).toThrow();
    expect(() => assistantThreadIdSchema.parse("../../settings")).toThrow();
  });

  it("validates conversation rename and pin actions", () => {
    expect(
      assistantThreadMutationSchema.parse({
        action: "rename",
        title: "  Portfolio launch  ",
      }),
    ).toEqual({ action: "rename", title: "Portfolio launch" });
    expect(
      assistantThreadMutationSchema.parse({
        action: "set_pinned",
        pinned: true,
      }),
    ).toEqual({ action: "set_pinned", pinned: true });
    expect(() =>
      assistantThreadMutationSchema.parse({ action: "rename", title: "   " }),
    ).toThrow();
    expect(() =>
      assistantThreadMutationSchema.parse({ action: "delete" }),
    ).toThrow();
  });
});
