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
      {/* Deliberately larger than the 14px title beside it: the icon is what
          identifies the recognition at a glance, so it leads and the text
          reads as its caption. No top offset — a 24px mark and a 24px line
          box already share a baseline. */}
      {createElement(getRecognitionIcon(iconName), {
        className: "size-6 shrink-0 text-foreground",
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
        data-bippy-reaction="curious"
        data-bippy-safe-zone
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
