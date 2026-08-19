import "server-only";

import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { agentMemories } from "@/db/schema";
import type { AssistantMemoryView } from "@/lib/ai/types";

export const memoryCategories = ["preference", "fact", "instruction"] as const;
export type MemoryCategory = (typeof memoryCategories)[number];

function memoryView(
  row: typeof agentMemories.$inferSelect,
): AssistantMemoryView {
  return {
    id: row.id,
    label: row.label,
    content: row.content,
    category: row.category as MemoryCategory,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listAssistantMemories() {
  const rows = await getDb()
    .select()
    .from(agentMemories)
    .orderBy(desc(agentMemories.updatedAt));
  return rows.map(memoryView);
}

export async function rememberAssistantMemory(input: {
  label: string;
  content: string;
  category: MemoryCategory;
  sourceThreadId: string;
}) {
  const now = new Date();
  const [row] = await getDb()
    .insert(agentMemories)
    .values({ ...input, updatedAt: now })
    .onConflictDoUpdate({
      target: agentMemories.label,
      set: {
        content: input.content,
        category: input.category,
        sourceThreadId: input.sourceThreadId,
        updatedAt: now,
      },
    })
    .returning();
  return memoryView(row);
}

export async function deleteAssistantMemory(id: string) {
  const [deleted] = await getDb()
    .delete(agentMemories)
    .where(eq(agentMemories.id, id))
    .returning({ id: agentMemories.id });
  return Boolean(deleted);
}

export async function getAssistantMemoryContext() {
  const memories = await listAssistantMemories();
  if (!memories.length) return "No curated memories have been saved.";

  return memories
    .map(
      (memory) => `- [${memory.category}] ${memory.label}: ${memory.content}`,
    )
    .join("\n");
}
