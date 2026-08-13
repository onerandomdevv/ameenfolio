import type { SVGProps } from "react";

export function BippyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M7.25 3.5h8.9a4.35 4.35 0 0 1 4.35 4.35v8.3a4.35 4.35 0 0 1-4.35 4.35h-8.3a4.35 4.35 0 0 1-4.35-4.35V8.4h1.25V6A2.5 2.5 0 0 1 7.25 3.5Z"
        fill="currentColor"
      />
      <rect
        x="6.25"
        y="7"
        width="11.75"
        height="9.75"
        rx="2.4"
        fill="#171717"
      />
      <rect x="9" y="10" width="1.6" height="3.8" rx=".35" fill="#A5EF30" />
      <rect x="14" y="10" width="1.6" height="3.8" rx=".35" fill="#A5EF30" />
    </svg>
  );
}
