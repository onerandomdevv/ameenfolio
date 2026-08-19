import { describe, expect, it } from "vitest";
import { orderAssistantThreads } from "@/lib/ai/thread-order";
import type { AssistantThreadSummary } from "@/lib/ai/types";

function thread(
  id: string,
  updatedAt: string,
  pinnedAt: string | null = null,
): AssistantThreadSummary {
  return {
    id,
    title: id,
    provider: "openai",
    model: "gpt-5.4-mini",
    pinnedAt,
    updatedAt,
  };
}

describe("Bippy conversation ordering", () => {
  it("places pinned conversations first and keeps both groups newest-first", () => {
    const ordered = orderAssistantThreads([
      thread("new chat", "2026-08-13T12:00:00.000Z"),
      thread(
        "older pin",
        "2026-08-13T11:00:00.000Z",
        "2026-08-13T09:00:00.000Z",
      ),
      thread("old chat", "2026-08-12T12:00:00.000Z"),
      thread(
        "newer pin",
        "2026-08-11T12:00:00.000Z",
        "2026-08-13T10:00:00.000Z",
      ),
    ]);

    expect(ordered.map((item) => item.id)).toEqual([
      "newer pin",
      "older pin",
      "new chat",
      "old chat",
    ]);
  });
});
