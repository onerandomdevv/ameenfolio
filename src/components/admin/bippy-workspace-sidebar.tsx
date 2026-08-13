"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  Brain,
  MessageSquarePlus,
  MoreHorizontal,
  PanelLeftClose,
  Pencil,
  Pin,
  PinOff,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { BippyIcon } from "@/components/bippy/bippy-icon";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { AssistantThreadSummary } from "@/lib/ai/types";
import { useAdminBase } from "@/lib/use-admin-base";
import { cn } from "@/lib/utils";

export function BippyWorkspaceSidebar({
  threads,
  activeId,
  disabled = false,
  onClose,
  onNewChat,
  onSelectThread,
  onThreadUpdated,
  onThreadDeleted,
  id = "bippy-workspace-sidebar",
  className,
}: {
  threads: AssistantThreadSummary[];
  activeId?: string | null;
  disabled?: boolean;
  onClose: () => void;
  onNewChat?: () => void;
  onSelectThread?: (id: string) => void;
  onThreadUpdated?: (thread: AssistantThreadSummary) => void;
  onThreadDeleted?: (id: string) => void;
  id?: string;
  className?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const base = useAdminBase();
  const chatHref = `${base}/assistant`;
  const analyticsHref = `${chatHref}/analytics`;
  const tokensHref = `${chatHref}/tokens`;
  const memoryHref = `${chatHref}/memory`;
  const analyticsActive = pathname === analyticsHref;
  const tokensActive = pathname === tokensHref;
  const memoryActive = pathname === memoryHref;
  const chatActive = !analyticsActive && !tokensActive && !memoryActive;
  const [busyId, setBusyId] = useState<string | null>(null);
  const [renameThread, setRenameThread] =
    useState<AssistantThreadSummary | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [deleteThread, setDeleteThread] =
    useState<AssistantThreadSummary | null>(null);

  async function changeThread(
    thread: AssistantThreadSummary,
    body:
      | { action: "rename"; title: string }
      | { action: "set_pinned"; pinned: boolean },
  ) {
    setBusyId(thread.id);
    try {
      const response = await fetch(
        `/api/admin/assistant/threads/${thread.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const result = (await response.json().catch(() => null)) as
        | AssistantThreadSummary
        | { error?: string }
        | null;
      if (!response.ok || !result || !("id" in result)) {
        throw new Error(
          result && "error" in result
            ? result.error
            : "Could not update the conversation.",
        );
      }
      onThreadUpdated?.(result);
      if (!onThreadUpdated) router.refresh();
      return true;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update the conversation.",
      );
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function rename(event: FormEvent) {
    event.preventDefault();
    const title = renameTitle.trim();
    if (!renameThread || !title) return;
    const changed = await changeThread(renameThread, {
      action: "rename",
      title,
    });
    if (changed) {
      toast.success("Conversation renamed.");
      setRenameThread(null);
    }
  }

  async function togglePinned(thread: AssistantThreadSummary) {
    const pinned = !thread.pinnedAt;
    if (
      await changeThread(thread, {
        action: "set_pinned",
        pinned,
      })
    ) {
      toast.success(pinned ? "Conversation pinned." : "Conversation unpinned.");
    }
  }

  async function remove() {
    if (!deleteThread) return;
    const thread = deleteThread;
    setBusyId(thread.id);
    try {
      const response = await fetch(
        `/api/admin/assistant/threads/${thread.id}`,
        {
          method: "DELETE",
        },
      );
      if (!response.ok) throw new Error("Could not delete the conversation.");
      onThreadDeleted?.(thread.id);
      if (!onThreadDeleted) router.refresh();
      toast.success("Conversation deleted.");
      setDeleteThread(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not delete the conversation.",
      );
    } finally {
      setBusyId(null);
    }
  }

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
          const selecting = disabled || busyId === thread.id;
          const title = (
            <span className="flex min-w-0 items-center gap-1.5">
              {thread.pinnedAt ? (
                <Pin
                  className="size-3 shrink-0 fill-current text-muted-foreground"
                  aria-label="Pinned"
                />
              ) : null}
              <span className="truncate text-[12.5px] font-medium">
                {thread.title}
              </span>
            </span>
          );

          return (
            <div
              key={thread.id}
              className={cn(
                "group/thread mb-0.5 flex min-h-9 items-center rounded-md transition-colors hover:bg-accent",
                current && "bg-accent",
              )}
            >
              {onSelectThread ? (
                <button
                  type="button"
                  disabled={selecting}
                  onClick={() => onSelectThread(thread.id)}
                  className="min-w-0 flex-1 px-2.5 py-2 text-left disabled:pointer-events-none disabled:opacity-50"
                >
                  {title}
                </button>
              ) : (
                <Link
                  href={`${chatHref}?thread=${thread.id}`}
                  className="min-w-0 flex-1 px-2.5 py-2"
                >
                  {title}
                </Link>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    disabled={selecting}
                    aria-label={`Actions for ${thread.title}`}
                    className="mr-1 opacity-100 sm:opacity-0 sm:group-hover/thread:opacity-100 sm:focus-visible:opacity-100 sm:data-[state=open]:opacity-100"
                  >
                    <MoreHorizontal aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onSelect={() => {
                      setRenameThread(thread);
                      setRenameTitle(thread.title);
                    }}
                  >
                    <Pencil aria-hidden="true" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => void togglePinned(thread)}>
                    {thread.pinnedAt ? (
                      <PinOff aria-hidden="true" />
                    ) : (
                      <Pin aria-hidden="true" />
                    )}
                    {thread.pinnedAt ? "Unpin chat" : "Pin chat"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setDeleteThread(thread)}
                  >
                    <Trash2 aria-hidden="true" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
        {!threads.length ? (
          <p className="px-2.5 py-3 text-[12px] text-muted-foreground">
            No chats yet.
          </p>
        ) : null}
      </div>

      <Dialog
        open={Boolean(renameThread)}
        onOpenChange={(open) => {
          if (!open && !busyId) setRenameThread(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={rename} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Rename conversation</DialogTitle>
              <DialogDescription>
                Choose a short name that makes this chat easy to find.
              </DialogDescription>
            </DialogHeader>
            <Input
              autoFocus
              value={renameTitle}
              onChange={(event) => setRenameTitle(event.target.value)}
              maxLength={80}
              aria-label="Conversation name"
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={Boolean(busyId)}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={!renameTitle.trim() || Boolean(busyId)}
              >
                Rename
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteThread)}
        onOpenChange={(open) => {
          if (!open && !busyId) setDeleteThread(null);
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleteThread?.title}” and its complete message and action
              history will be permanently deleted. Portfolio changes already
              applied are not undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(busyId)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={Boolean(busyId)}
              onClick={() => void remove()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}
