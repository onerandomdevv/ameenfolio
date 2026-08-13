"use client";

import { Moon, Sun } from "lucide-react";
import { toggleTheme } from "@/lib/theme";

/**
 * Two states, not three.
 *
 * The site is dark until someone says otherwise: the OS preference is not
 * consulted, so a visitor whose laptop is in light mode still arrives at the
 * version this was designed as. Pressing this stores the choice, and the
 * pre-paint script in layout.tsx honours it from then on.
 *
 * Which icon shows is decided by CSS, not React state. The theme lives on the
 * document element before React exists, so any attempt to mirror it into state
 * has to survive hydration: the server cannot know what the browser resolved,
 * and a component that reads the class on mount renders the wrong icon — or,
 * as this one did, no icon at all — until something tells it to look again.
 * A `dark:` variant has no such problem, because it is the same class doing
 * the work.
 */
export function ThemeToggle() {
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      data-bippy-safe-zone
      data-theme-toggle=""
      className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-background/70 text-muted-foreground backdrop-blur transition-colors hover:text-foreground focus-visible:text-foreground"
    >
      <Moon aria-hidden="true" className="size-4 dark:hidden" />
      <Sun aria-hidden="true" className="hidden size-4 dark:block" />
    </button>
  );
}
