"use client";

import { Moon, Sun } from "lucide-react";

// Kept in step with the inline script in layout.tsx, which sets the class
// before first paint. Both read and write this one key.
const STORAGE_KEY = "theme";

/**
 * Two states, not three.
 *
 * Until it is pressed, nothing is stored and the site follows the operating
 * system — so "system" is the default rather than a third position to hunt for.
 * Pressing it pins the choice, which is what someone reaching for a toggle
 * actually wants.
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
  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.style.colorScheme = next ? "dark" : "light";
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // Storage throws in some privacy modes. The class is already set, so the
      // choice still holds for this page.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      data-bippy-safe-zone
      data-theme-toggle=""
      className="fixed right-4 top-4 z-50 grid size-9 place-items-center rounded-full border border-border bg-background/70 text-muted-foreground backdrop-blur transition-colors hover:text-foreground focus-visible:text-foreground"
    >
      <Moon aria-hidden="true" className="size-4 dark:hidden" />
      <Sun aria-hidden="true" className="hidden size-4 dark:block" />
    </button>
  );
}
