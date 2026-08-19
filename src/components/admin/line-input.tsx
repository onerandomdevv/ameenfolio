"use client";

import { forwardRef } from "react";
import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// An input with no box of its own. The field row it sits in already draws a
// rule underneath, so a border here would be a second line saying the same
// thing — which is what made the old forms read as a stack of containers.
const base =
  "w-full bg-transparent p-0 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/70";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  as?: "input";
  mono?: boolean;
  invalid?: boolean;
};
type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  as: "textarea";
  mono?: boolean;
  invalid?: boolean;
};

export const LineInput = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  InputProps | TextareaProps
>(function LineInput(
  { as = "input", mono, invalid, className, ...props },
  ref,
) {
  const classes = cn(
    base,
    mono && "font-mono text-[12.5px]",
    invalid && "text-destructive placeholder:text-destructive/60",
    className,
  );

  if (as === "textarea") {
    return (
      <textarea
        ref={ref as React.Ref<HTMLTextAreaElement>}
        className={cn(classes, "resize-y leading-6")}
        {...(props as TextareaHTMLAttributes<HTMLTextAreaElement>)}
      />
    );
  }

  return (
    <input
      ref={ref as React.Ref<HTMLInputElement>}
      className={classes}
      {...(props as InputHTMLAttributes<HTMLInputElement>)}
    />
  );
});

// Native select with its chrome removed: only the chevron marks it as
// something you can change, which is enough on a row that already has a rule.
export function LineSelect({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative inline-flex items-center">
      <select
        className={cn(
          base,
          "cursor-pointer appearance-none pr-5 [&>option]:bg-popover [&>option]:text-foreground",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-0 size-3.5 text-muted-foreground"
        aria-hidden="true"
      />
    </span>
  );
}
