import { PortfolioCopilot } from "@/components/admin/portfolio-copilot";
import { listAssistantThreads } from "@/lib/ai/repository";
import { getOpenAIPortfolioProvider } from "@/lib/ai/openai-provider";

export default async function AdminAssistantPage({
  searchParams,
}: PageProps<"/admin/assistant">) {
  const provider = getOpenAIPortfolioProvider();
  const threads = await listAssistantThreads();
  const requestedThread = (await searchParams).thread;
  const initialThreadId =
    typeof requestedThread === "string" &&
    threads.some((thread) => thread.id === requestedThread)
      ? requestedThread
      : undefined;

  return (
    <PortfolioCopilot
      initialThreads={threads}
      configured={provider.configured}
      defaultModel={provider.defaultModel}
      availableModels={provider.availableModels}
      initialThreadId={initialThreadId}
    />
  );
}
