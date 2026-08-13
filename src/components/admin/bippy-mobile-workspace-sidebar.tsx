"use client";

import { BippyWorkspaceSidebar } from "@/components/admin/bippy-workspace-sidebar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import type { AssistantThreadSummary } from "@/lib/ai/types";

export function BippyMobileWorkspaceSidebar({
  open,
  onOpenChange,
  threads,
  activeId,
  disabled,
  onNewChat,
  onSelectThread,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  threads: AssistantThreadSummary[];
  activeId?: string | null;
  disabled?: boolean;
  onNewChat?: () => void;
  onSelectThread?: (id: string) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="admin-theme w-[82vw] max-w-[18rem] gap-0 p-0 lg:hidden"
      >
        <SheetTitle className="sr-only">Bippy navigation</SheetTitle>
        <BippyWorkspaceSidebar
          id="bippy-mobile-workspace-sidebar"
          className="size-full"
          threads={threads}
          activeId={activeId}
          disabled={disabled}
          onClose={() => onOpenChange(false)}
          onNewChat={
            onNewChat
              ? () => {
                  onNewChat();
                  onOpenChange(false);
                }
              : undefined
          }
          onSelectThread={
            onSelectThread
              ? (id) => {
                  onSelectThread(id);
                  onOpenChange(false);
                }
              : undefined
          }
        />
      </SheetContent>
    </Sheet>
  );
}
