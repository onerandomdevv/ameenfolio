import type { Metadata } from "next";
import { BippyAnalyticsWorkspace } from "@/components/admin/bippy-analytics-workspace";
import { listAssistantThreads } from "@/lib/ai/repository";

export const metadata: Metadata = {
  title: "Bippy Analytics",
  description: "Private controls and performance analytics for Bippy.",
};

export default async function BippyAnalyticsPage() {
  return <BippyAnalyticsWorkspace threads={await listAssistantThreads()} />;
}
