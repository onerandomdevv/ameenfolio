export type TextSegment = {
  text: string;
  emphasized: boolean;
};

/**
 * Splits `text` into runs, marking the ones that match a term. Lets a config
 * string stay a plain string — the alternative is either markup in the config
 * or the copy hardcoded into the component that styles it.
 */
export function splitEmphasis(
  text: string,
  terms: readonly string[],
): TextSegment[] {
  // Longest first, so a term that contains another does not lose to it.
  const candidates = [...terms]
    .filter((term) => term.length > 0)
    .sort((a, b) => b.length - a.length);

  if (!candidates.length) return text ? [{ text, emphasized: false }] : [];

  const segments: TextSegment[] = [];
  let plain = "";

  const flush = () => {
    if (plain) {
      segments.push({ text: plain, emphasized: false });
      plain = "";
    }
  };

  for (let index = 0; index < text.length; ) {
    const match = candidates.find((term) => text.startsWith(term, index));

    if (match) {
      flush();
      segments.push({ text: match, emphasized: true });
      index += match.length;
      continue;
    }

    plain += text[index];
    index += 1;
  }

  flush();
  return segments;
}
