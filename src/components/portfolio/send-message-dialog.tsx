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
        <button
          type="button"
          data-bippy-reaction="curious"
          data-bippy-safe-zone
          className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-foreground underline underline-offset-4 transition-colors hover:text-primary focus-visible:text-primary"
        >
          <ChatBubbleGlyph className="size-4" aria-hidden="true" />
          Send a message
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
