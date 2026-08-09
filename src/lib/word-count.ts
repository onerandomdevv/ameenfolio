// Cards stay compact only if the copy does. A character limit does not achieve
// that — "internationalisation orchestration" is two words and 36 characters,
// while twelve short words wrap to the same two lines every time.
export const MAX_CARD_WORDS = 12;

export function countWords(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function withinCardWordLimit(value: string) {
  return countWords(value) <= MAX_CARD_WORDS;
}

export const cardWordLimitMessage = `Use at most ${MAX_CARD_WORDS} words so the card stays one tidy block.`;
