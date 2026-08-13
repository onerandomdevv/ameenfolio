"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Brain,
  MessageSquarePlus,
  PanelLeftClose,
} from "lucide-react";
import { BippyIcon } from "@/components/bippy/bippy-icon";
import { Button } from "@/components/ui/button";
import type { AssistantThreadSummary } from "@/lib/ai/types";
import { useAdminBase } from "@/lib/use-admin-base";
import { cn } from "@/lib/utils";

function shortDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function BippyWorkspaceSidebar({
  threads,
  activeId,
  disabled = false,
  onClose,
  onNewChat,
  onSelectThread,
  id = "bippy-workspace-sidebar",
  className,
}: {
  threads: AssistantThreadSummary[];
  activeId?: string | null;
  disabled?: boolean;
  onClose: () => void;
  onNewChat?: () => void;
  onSelectThread?: (id: string) => void;
  id?: string;
  className?: string;
}) {
  const pathname = usePathname();
  const base = useAdminBase();
  const chatHref = `${base}/assistant`;
  const analyticsHref = `${chatHref}/analytics`;
  const tokensHref = `${chatHref}/tokens`;
  const memoryHref = `${chatHref}/memory`;
  const analyticsActive = pathname === analyticsHref;
  const tokensActive = pathname === tokensHref;
  const memoryActive = pathname === memoryHref;
  const chatActive = !analyticsActive && !tokensActive && !memoryActive;

  return (
    <aside
      id={id}
      className={cn(
        "flex min-h-0 flex-col border-border/60 px-2 py-2 lg:border-r",
        className,
      )}
    >
      <div className="flex min-h-10 items-center gap-2 px-1">
        <BippyIcon className="size-5 text-foreground" />
        <span className="text-[14px] font-semibold">Bippy</span>
        <Button
          className="ml-auto"
          variant="ghost"
          size="icon-sm"
          aria-label="Close Bippy sidebar"
          aria-controls={id}
          aria-expanded={true}
          onClick={onClose}
        >
          <PanelLeftClose aria-hidden="true" />
        </Button>
      </div>

      <nav className="mt-2 grid gap-0.5" aria-label="Bippy">
        {onNewChat ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onNewChat}
            className={cn(
              "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-left text-[13px] transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50",
              chatActive && !activeId && "bg-accent",
            )}
          >
            <MessageSquarePlus className="size-4" aria-hidden="true" />
            New chat
          </button>
        ) : (
          <Link
            href={chatHref}
            className={cn(
              "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[13px] transition-colors hover:bg-accent",
              chatActive && "bg-accent",
            )}
          >
            <MessageSquarePlus className="size-4" aria-hidden="true" />
            New chat
          </Link>
        )}
        <Link
          href={analyticsHref}
          aria-current={analyticsActive ? "page" : undefined}
          className={cn(
            "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[13px] transition-colors hover:bg-accent",
            analyticsActive && "bg-accent",
          )}
        >
          <Activity className="size-4" aria-hidden="true" />
          Bippy Analytics
        </Link>
        <Link
          href={tokensHref}
          aria-current={tokensActive ? "page" : undefined}
          className={cn(
            "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[13px] transition-colors hover:bg-accent",
            tokensActive && "bg-accent",
          )}
        >
          <BarChart3 className="size-4" aria-hidden="true" />
          Token Analytics
        </Link>
        <Link
          href={memoryHref}
          aria-current={memoryActive ? "page" : undefined}
          className={cn(
            "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[13px] transition-colors hover:bg-accent",
            memoryActive && "bg-accent",
          )}
        >
          <Brain className="size-4" aria-hidden="true" />
          Memory
        </Link>
      </nav>

      <p className="mt-5 px-2.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-muted-foreground">
        Chats
      </p>
      <div className="mt-1 min-h-0 flex-1 overflow-y-auto">
        {threads.map((thread) => {
          const current = chatActive && activeId === thread.id;
          const content = (
            <>
              <span className="block truncate text-[12.5px] font-medium">
                {thread.title}
              </span>
              <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">
                {shortDate(thread.updatedAt)}
              </span>
            </>
          );

          return onSelectThread ? (
            <button
              type="button"
              key={thread.id}
              disabled={disabled}
              onClick={() => onSelectThread(thread.id)}
              className={cn(
                "mb-0.5 block w-full rounded-md px-2.5 py-2 text-left transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50",
                current && "bg-accent",
              )}
            >
              {content}
            </button>
          ) : (
            <Link
              key={thread.id}
              href={`${chatHref}?thread=${thread.id}`}
              className="mb-0.5 block rounded-md px-2.5 py-2 transition-colors hover:bg-accent"
            >
              {content}
            </Link>
          );
        })}
        {!threads.length ? (
          <p className="px-2.5 py-3 text-[12px] text-muted-foreground">
            No chats yet.
          </p>
        ) : null}
      </div>
    </aside>
  );
}
