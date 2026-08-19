/**
 * What a screen reader announces for a recognition's image.
 *
 * The admin form does not ask for a description per image — for a certificate
 * or an award photo it would be the same sentence typed four times. So alt is
 * derived instead: the recognition's title locates the image, and the position
 * distinguishes it from its siblings. A description stored against an
 * individual image still wins, since it says more than either.
 */
export function recognitionImageAlt({
  alt,
  title,
  index,
  total,
}: {
  alt: string | null;
  title: string;
  index: number;
  total: number;
}) {
  const described = alt?.trim();
  if (described) return described;
  // A lone image needs no ordinal — "1 of 1" is noise.
  return total > 1
    ? `${title} — image ${index + 1} of ${total}`
    : `${title} — image`;
}
