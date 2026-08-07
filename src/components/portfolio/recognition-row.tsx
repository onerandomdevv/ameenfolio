import { createElement } from "react";
import { ArrowUpRight } from "lucide-react";
import {
  getRecognitionIcon,
  type RecognitionIconName,
} from "@/config/recognition-icons";

type RecognitionRowProps = {
  title: string;
  iconName: RecognitionIconName;
  verificationUrl: string | null;
};

export function RecognitionRow({
  title,
  iconName,
  verificationUrl,
}: RecognitionRowProps) {
  const content = (
    <>
      {createElement(getRecognitionIcon(iconName), {
        className: "mt-1 size-4 shrink-0 text-foreground",
        "aria-hidden": true,
      })}
      <span className="min-w-0 flex-1 text-sm leading-6">{title}</span>
      {verificationUrl ? (
        <ArrowUpRight
          className="mt-1 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
          aria-hidden="true"
        />
      ) : null}
    </>
  );

  if (verificationUrl) {
    return (
      <a
        href={verificationUrl}
        target="_blank"
        rel="noreferrer"
        className="group flex min-h-11 w-full items-start gap-3 py-3 text-left text-foreground/90 transition-colors hover:text-primary focus-visible:text-primary focus-visible:outline-none"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="flex min-h-11 w-full items-start gap-3 py-3 text-left text-foreground/90">
      {content}
    </div>
  );
}
