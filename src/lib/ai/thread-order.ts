import type { AssistantThreadSummary } from "@/lib/ai/types";

export function orderAssistantThreads(threads: AssistantThreadSummary[]) {
  return [...threads].sort((a, b) => {
    if (a.pinnedAt && !b.pinnedAt) return -1;
    if (!a.pinnedAt && b.pinnedAt) return 1;
    if (a.pinnedAt && b.pinnedAt) {
      return new Date(b.pinnedAt).getTime() - new Date(a.pinnedAt).getTime();
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}
