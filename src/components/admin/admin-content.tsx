"use client";

import { usePathname } from "next/navigation";
import { useAdminBase } from "@/lib/use-admin-base";
import { cn } from "@/lib/utils";

export function AdminContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const base = useAdminBase();
  const isAssistant =
    pathname === `${base}/assistant` ||
    pathname.startsWith(`${base}/assistant/`);

  return (
    <div
      className={cn(
        "lg:pl-[216px]",
        isAssistant && "h-[calc(100dvh-54px)] overflow-hidden lg:h-dvh",
      )}
    >
      <main
        className={cn(
          "w-full",
          isAssistant
            ? "h-full max-w-none overflow-hidden"
            : "max-w-[940px] px-5 pb-24 pt-6 sm:px-7 lg:pt-7",
        )}
      >
        {children}
      </main>
    </div>
  );
}
