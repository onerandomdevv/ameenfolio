"use client";

import { useState } from "react";
import { PanelLeftOpen } from "lucide-react";
import { BippyMobileWorkspaceSidebar } from "@/components/admin/bippy-mobile-workspace-sidebar";
import { BippyWorkspaceSidebar } from "@/components/admin/bippy-workspace-sidebar";
import { BippyPlayground } from "@/components/bippy/bippy-playground";
import { Button } from "@/components/ui/button";
import type { AssistantThreadSummary } from "@/lib/ai/types";
import { cn } from "@/lib/utils";

export function BippyAnalyticsWorkspace({
  threads,
}: {
  threads: AssistantThreadSummary[];
}) {
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
      <section className="min-h-0 overflow-y-auto" aria-label="Bippy Analytics">
        <div className="mx-auto w-full max-w-[780px] px-5 py-4 sm:px-7">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Open Bippy sidebar"
            aria-controls="bippy-mobile-workspace-sidebar"
            aria-expanded={mobileSidebarOpen}
            onClick={() => setMobileSidebarOpen(true)}
            className="mb-3 lg:hidden"
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
              className="mb-3 hidden lg:inline-flex"
            >
              <PanelLeftOpen aria-hidden="true" />
            </Button>
          ) : null}
          <BippyPlayground />
        </div>
      </section>
    </div>
  );
}
