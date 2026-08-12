import type { SVGProps } from "react";

// Solid glyphs rather than stroked outlines, so the non-brand recognition
// icons carry the same visual weight as the brand marks they sit beside in the
// same list. Cut-outs use fill-rule="evenodd" instead of a <mask>, because a
// mask needs a document-unique id and these can repeat across recognitions.

// Flap and body are separate <path> elements. As subpaths of one path the flap
// would punch a hole in the body under the nonzero winding rule.
export function MailGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" focusable="false" {...props}>
      <path d="M2.3 7.1 12 13.2l9.7-6.1A2 2 0 0 0 19.8 5.6H4.2a2 2 0 0 0-1.9 1.5z" />
      <path d="M22 9.35 12.5 15.3a1 1 0 0 1-1 0L2 9.35v7.05a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2z" />
    </svg>
  );
}

export function ChatBubbleGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" focusable="false" {...props}>
      <path d="M4 3h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9.6L5 21.2a1 1 0 0 1-1.6-.8V17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
    </svg>
  );
}

export function BriefcaseGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" focusable="false" {...props}>
      <path d="M9 2h6a2 2 0 0 1 2 2v2h-2.2V4.2H9.2V6H7V4a2 2 0 0 1 2-2z" />
      <path d="M4 7h16a2 2 0 0 1 2 2v3.4h-8V11h-4v1.4H2V9a2 2 0 0 1 2-2z" />
      <path d="M2 13.9h8v1.4h4v-1.4h8V19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z" />
    </svg>
  );
}

// Head and shoulders as separate <path> elements, for the reason given above:
// as subpaths of one path the head would punch a hole in the shoulders.
export function UserGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" focusable="false" {...props}>
      <path d="M12 2.4a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6z" />
      <path d="M12 13.6c4.3 0 7.8 2.6 7.8 5.8v.6a1.6 1.6 0 0 1-1.6 1.6H5.8a1.6 1.6 0 0 1-1.6-1.6v-.6c0-3.2 3.5-5.8 7.8-5.8z" />
    </svg>
  );
}

export function TrophyGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" focusable="false" {...props}>
      <path d="M6 2h12v2h3a1 1 0 0 1 1 1v2a5 5 0 0 1-4.42 4.96A6.01 6.01 0 0 1 13 15.91V19h3a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2h3v-3.09a6.01 6.01 0 0 1-4.58-3.95A5 5 0 0 1 2 7V5a1 1 0 0 1 1-1h3zm0 4H4v1a3 3 0 0 0 2 2.83zm12 0v3.83A3 3 0 0 0 20 7V6z" />
    </svg>
  );
}

// Ribbon and disc are separate <path> elements rather than subpaths of one.
// Sharing a path makes the disc a hole in the ribbon under the nonzero winding
// rule, which renders the medal as an empty ring.
export function MedalGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" focusable="false" {...props}>
      <path d="M5.1 2h3.3l2.5 4.5a7.4 7.4 0 0 0-2.7 1.1z" />
      <path d="M18.9 2h-3.3l-2.5 4.5a7.4 7.4 0 0 1 2.7 1.1z" />
      <path d="M12 8a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13z" />
    </svg>
  );
}

export function StarGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" focusable="false" {...props}>
      <path d="M12 .587l3.668 7.431 8.332 1.151-6.064 5.828 1.48 8.279L12 18.896l-7.416 4.38 1.48-8.279L0 9.169l8.332-1.151z" />
    </svg>
  );
}

export function BadgeCheckGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" focusable="false" {...props}>
      <path
        fillRule="evenodd"
        d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1.4 14.6l-3.5-3.5 1.4-1.42 2.1 2.1 4.9-4.9 1.42 1.42z"
      />
    </svg>
  );
}

export function AwardGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" focusable="false" {...props}>
      <path d="M12 1.6a6.6 6.6 0 1 1 0 13.2 6.6 6.6 0 0 1 0-13.2z" />
      <path d="M7.5 15.85a8.5 8.5 0 0 0 9 0L18.6 22.4 12 19.6l-6.6 2.8z" />
    </svg>
  );
}

export function CrownGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" focusable="false" {...props}>
      <path d="M2 6.5l4.8 3.7L12 2.8l5.2 7.4L22 6.5 20.2 19H3.8zM4 20.4h16V22H4z" />
    </svg>
  );
}

export function SparklesGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" focusable="false" {...props}>
      <path d="M10 1.8l1.85 5.35L17.2 9l-5.35 1.85L10 16.2l-1.85-5.35L2.8 9l5.35-1.85zm8 12l.95 2.75 2.75.95-2.75.95L18 21.4l-.95-2.75-2.75-.95 2.75-.95z" />
    </svg>
  );
}
