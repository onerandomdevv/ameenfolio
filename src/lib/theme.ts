import "client-only";

// The same key the inline script in layout.tsx reads before first paint.
const STORAGE_KEY = "theme";

/**
 * Flips the theme and remembers the choice.
 *
 * Lives here rather than inside the toggle button because two things reach for
 * it now — the button, and a double-click on Bippy. A second copy would be a
 * second place for the storage key to be spelled.
 */
export function toggleTheme() {
  const root = document.documentElement;
  const next = !root.classList.contains("dark");

  root.classList.toggle("dark", next);
  // Keeps native UI — scrollbars, form controls — on the same side as the page.
  root.style.colorScheme = next ? "dark" : "light";

  try {
    localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
  } catch {
    // Storage throws in some privacy modes. The class is already set, so the
    // choice still holds for this page.
  }
}
