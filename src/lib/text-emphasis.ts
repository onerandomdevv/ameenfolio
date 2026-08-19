export type TextSegment = {
  text: string;
  emphasized: boolean;
};

// Deliberately not a Markdown parser. The introduction is one paragraph with
// one kind of emphasis, and pulling in a renderer would also bring links,
// headings and lists into a field that has no use for them.
const MARKER = "**";

/**
 * Splits `text` into runs, marking the ones wrapped in `**double asterisks**`.
 *
 * The emphasis travels with the sentence. It used to be a separate list of
 * phrases matched literally, which meant editing the sentence silently dropped
 * the emphasis unless the list was edited to match — and that list could not be
 * exposed in the admin without asking for the same words twice.
 *
 * An unclosed marker is left as written rather than emphasising the rest of the
 * paragraph: while someone is typing, every other keystroke is a half-open
 * marker, and text that flickers bold as you type reads as a bug.
 */
export function splitEmphasis(text: string): TextSegment[] {
  if (!text) return [];

  const segments: TextSegment[] = [];
  let plain = "";
  let index = 0;

  const flush = () => {
    if (plain) {
      segments.push({ text: plain, emphasized: false });
      plain = "";
    }
  };

  while (index < text.length) {
    if (!text.startsWith(MARKER, index)) {
      plain += text[index];
      index += 1;
      continue;
    }

    const closing = text.indexOf(MARKER, index + MARKER.length);
    const inner =
      closing === -1 ? "" : text.slice(index + MARKER.length, closing);

    // `****` carries no text, so there is nothing to emphasise.
    if (closing === -1 || !inner) {
      plain += MARKER;
      index += MARKER.length;
      continue;
    }

    flush();
    segments.push({ text: inner, emphasized: true });
    index = closing + MARKER.length;
  }

  flush();
  return segments;
}
