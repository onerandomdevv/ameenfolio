"use client";

import type { ComponentProps } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

export function CopilotMarkdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 text-[13.5px] leading-6 text-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={
          {
            p: ({ className: paragraphClass, ...props }) => (
              <p className={cn("my-3", paragraphClass)} {...props} />
            ),
            h1: (props) => (
              <h1 className="mb-2 mt-5 text-base font-semibold" {...props} />
            ),
            h2: (props) => (
              <h2 className="mb-2 mt-5 text-sm font-semibold" {...props} />
            ),
            h3: (props) => (
              <h3
                className="mb-2 mt-4 text-[13.5px] font-semibold"
                {...props}
              />
            ),
            ul: (props) => (
              <ul className="my-3 list-disc space-y-1 pl-5" {...props} />
            ),
            ol: (props) => (
              <ol className="my-3 list-decimal space-y-1 pl-5" {...props} />
            ),
            blockquote: (props) => (
              <blockquote
                className="my-3 border-l-2 border-border pl-3 text-muted-foreground"
                {...props}
              />
            ),
            a: ({ href, ...props }) => (
              <a
                href={href}
                className="underline underline-offset-4 hover:text-primary"
                {...(href?.startsWith("http")
                  ? { target: "_blank", rel: "noreferrer" }
                  : {})}
                {...props}
              />
            ),
            code: ({ className: codeClassName, ...props }) => (
              <code
                className={cn(
                  "rounded bg-muted px-1 py-0.5 font-mono text-[11.5px]",
                  codeClassName,
                )}
                {...props}
              />
            ),
            pre: ({ className: preClassName, ...props }) => (
              <pre
                className={cn(
                  "my-3 overflow-x-auto rounded-md border border-border bg-muted/40 p-3 text-[11.5px] [&>code]:bg-transparent [&>code]:p-0",
                  preClassName,
                )}
                {...props}
              />
            ),
            table: (props) => (
              <div className="my-3 overflow-x-auto">
                <table
                  className="w-full border-collapse text-left"
                  {...props}
                />
              </div>
            ),
            th: (props) => (
              <th
                className="border-b border-border px-2 py-1 font-medium"
                {...props}
              />
            ),
            td: (props) => (
              <td className="border-b border-border/60 px-2 py-1" {...props} />
            ),
          } satisfies ComponentProps<typeof ReactMarkdown>["components"]
        }
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
