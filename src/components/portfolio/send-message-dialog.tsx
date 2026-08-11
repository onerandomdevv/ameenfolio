"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/brand-icons";
import { ChatBubbleGlyph, MailGlyph } from "@/components/icons/glyph-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type SendMessageDialogProps = {
  email: string;
  whatsappUrl?: string;
};

export function SendMessageDialog({
  email,
  whatsappUrl,
}: SendMessageDialogProps) {
  const [open, setOpen] = useState(false);

  const channels = [
    {
      label: "WhatsApp",
      hint: "Usually the quickest",
      href: whatsappUrl,
      icon: WhatsAppIcon,
      external: true,
    },
    {
      label: "Email",
      hint: email,
      href: `mailto:${email}`,
      icon: MailGlyph,
      external: false,
    },
    // A channel with no URL configured is dropped rather than rendered dead:
    // the dialog exists to offer a choice, and an inert row is not one.
  ].filter((channel): channel is typeof channel & { href: string } =>
    Boolean(channel.href),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* Sits inside a sentence, so it takes no minimum height: forcing a
            44px tap target here would break the line it belongs to. WCAG
            exempts targets that are inline in a block of text for exactly
            this reason. */}
        <button
          type="button"
          data-bippy-reaction="curious"
          data-bippy-dialogue="contact"
          data-bippy-safe-zone
          className="inline-flex items-center gap-1.5 align-baseline text-foreground underline decoration-border underline-offset-[3px] transition-colors hover:decoration-foreground focus-visible:decoration-foreground"
        >
          <ChatBubbleGlyph className="size-3.5 shrink-0" aria-hidden="true" />
          send a message
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Send a message</DialogTitle>
          <DialogDescription>Pick whichever suits you.</DialogDescription>
        </DialogHeader>
        <ul className="grid gap-2">
          {channels.map((channel) => {
            const Icon = channel.icon;

            return (
              <li key={channel.label}>
                <a
                  href={channel.href}
                  target={channel.external ? "_blank" : undefined}
                  rel={channel.external ? "noreferrer" : undefined}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent focus-visible:bg-accent"
                >
                  <Icon
                    className="size-5 shrink-0 text-foreground"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">
                      {channel.label}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {channel.hint}
                    </span>
                  </span>
                  <ArrowUpRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </a>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
