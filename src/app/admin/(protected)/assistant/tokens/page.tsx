import type { Metadata } from "next";
import { BippyTokenAnalyticsWorkspace } from "@/components/admin/bippy-token-analytics-workspace";
import { getBippyTokenAnalytics } from "@/lib/ai/analytics";
import { listAssistantThreads } from "@/lib/ai/repository";

export const metadata: Metadata = {
  title: "Bippy Token Analytics",
  description: "Private token usage and conversation compaction analytics.",
};

export default async function BippyTokenAnalyticsPage() {
  const [threads, analytics] = await Promise.all([
    listAssistantThreads(),
    getBippyTokenAnalytics(),
  ]);

  return (
    <BippyTokenAnalyticsWorkspace threads={threads} analytics={analytics} />
  );
}
