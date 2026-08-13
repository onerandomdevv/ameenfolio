import "client-only";

// The same key the inline script in layout.tsx reads before first paint.
const STORAGE_KEY = "theme";

// Matches the duration in globals.css. Cleared on a timer rather than
// transitionend, which fires once per property per element — thousands of times
// on a full page.
const TRANSITION_MS = 320;
let clearTransition: number | undefined;

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

  // Colours cross-fade only while the theme is changing. A permanent global
  // transition would also ease every hover and focus change, and make the
  // first paint after navigation animate from the wrong colours.
  root.dataset.themeTransition = "";
  window.clearTimeout(clearTransition);
  clearTransition = window.setTimeout(() => {
    delete root.dataset.themeTransition;
  }, TRANSITION_MS);

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
