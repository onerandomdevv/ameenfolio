import type { Metadata } from "next";
import { BippyMemoryWorkspace } from "@/components/admin/bippy-memory-workspace";
import { listAssistantMemories } from "@/lib/ai/memory";
import { listAssistantThreads } from "@/lib/ai/repository";

export const metadata: Metadata = {
  title: "Bippy Memory",
  description: "Review the information Bippy remembers across conversations.",
  robots: { index: false, follow: false },
};

export default async function BippyMemoryPage() {
  const [threads, memories] = await Promise.all([
    listAssistantThreads(),
    listAssistantMemories(),
  ]);

  return <BippyMemoryWorkspace threads={threads} initialMemories={memories} />;
}
