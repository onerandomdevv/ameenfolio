"use client";

import { useState, useTransition } from "react";
import { Brain, LoaderCircle, PanelLeftOpen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { forgetBippyMemory } from "@/app/admin/actions/bippy";
import { BippyMobileWorkspaceSidebar } from "@/components/admin/bippy-mobile-workspace-sidebar";
import { BippyWorkspaceSidebar } from "@/components/admin/bippy-workspace-sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  AssistantMemoryView,
  AssistantThreadSummary,
} from "@/lib/ai/types";
import { cn } from "@/lib/utils";

function MemoryRow({
  memory,
  onForgotten,
}: {
  memory: AssistantMemoryView;
  onForgotten: (id: string) => void;
}) {
  const [pending, startTransition] = useTransition();

  function forget() {
    startTransition(async () => {
      const result = await forgetBippyMemory(memory.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      onForgotten(memory.id);
      toast.success("Bippy forgot that memory.");
    });
  }

  return (
    <div className="flex items-start gap-4 border-b border-border/60 py-4 first:border-t">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[13px] font-semibold text-foreground">
            {memory.label}
          </p>
          <Badge
            variant="secondary"
            className="rounded-sm font-mono text-[9px] uppercase"
          >
            {memory.category}
          </Badge>
        </div>
        <p className="mt-1 text-[13px] leading-6 text-muted-foreground">
          {memory.content}
        </p>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={pending}
            aria-label={`Forget ${memory.label}`}
          >
            {pending ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 aria-hidden="true" />
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Forget this memory?</AlertDialogTitle>
            <AlertDialogDescription>
              Bippy will no longer use “{memory.label}” in future conversations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={forget}>
              Forget
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function BippyMemoryWorkspace({
  threads,
  initialMemories,
}: {
  threads: AssistantThreadSummary[];
  initialMemories: AssistantMemoryView[];
}) {
  const [memories, setMemories] = useState(initialMemories);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div
      className={cn(
        "size-full overflow-hidden",
        sidebarOpen && "lg:grid lg:grid-cols-[210px_minmax(0,1fr)]",
      )}
    >
      <BippyMobileWorkspaceSidebar
        open={mobileSidebarOpen}
        onOpenChange={setMobileSidebarOpen}
        threads={threads}
      />
      {sidebarOpen ? (
        <div className="hidden min-h-0 lg:block">
          <BippyWorkspaceSidebar
            className="size-full"
            threads={threads}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      ) : null}

      <section className="min-h-0 overflow-y-auto" aria-label="Bippy memory">
        <div className="mx-auto w-full max-w-[720px] px-5 py-4 sm:px-7">
          <div className="mb-5 flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Open Bippy sidebar"
              aria-controls="bippy-mobile-workspace-sidebar"
              aria-expanded={mobileSidebarOpen}
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden"
            >
              <PanelLeftOpen aria-hidden="true" />
            </Button>
            {!sidebarOpen ? (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Open Bippy sidebar"
                aria-controls="bippy-workspace-sidebar"
                aria-expanded={false}
                onClick={() => setSidebarOpen(true)}
                className="hidden lg:inline-flex"
              >
                <PanelLeftOpen aria-hidden="true" />
              </Button>
            ) : null}
            <div>
              <h1 className="text-[15px] font-semibold">Memory</h1>
              <p className="text-[12px] text-muted-foreground">
                Information Bippy carries into every conversation.
              </p>
            </div>
          </div>

          {memories.length ? (
            <div>
              {memories.map((memory) => (
                <MemoryRow
                  key={memory.id}
                  memory={memory}
                  onForgotten={(id) =>
                    setMemories((current) =>
                      current.filter((item) => item.id !== id),
                    )
                  }
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-center text-center">
              <Brain
                className="size-6 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="mt-3 text-[13px] font-medium">No memories yet</p>
              <p className="mt-1 max-w-sm text-[12px] leading-5 text-muted-foreground">
                Tell Bippy “remember this” in a chat when something should carry
                into future conversations.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
