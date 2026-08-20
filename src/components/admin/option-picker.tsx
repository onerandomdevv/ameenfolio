"use client";

import { createElement, useState, type ComponentType } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type PickerOption = {
  value: string;
  label: string;
  /** Rendered beside the label. The icon picker's whole point. */
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

type OptionPickerProps = {
  value: string;
  // readonly, so a config array declared `as const` — which is how the icon
  // list is written — can be passed straight in without being copied first.
  options: readonly PickerOption[];
  onChange: (value: string) => void;
  /** Heading inside the dialog — says what is being chosen. */
  title: string;
  /** Shown on the trigger when nothing is selected. */
  placeholder?: string;
  /** Adds a "None" row that clears the value. */
  clearable?: boolean;
  clearLabel?: string;
};

/**
 * A select replaced by a dialog.
 *
 * A native <select> renders its list with the operating system's styling, which
 * cannot be themed and — the reason this exists — cannot show anything but
 * text. Choosing an icon from a list of icon *names* is choosing blind.
 *
 * Deliberately not a combobox: these lists are short and fixed, so a filter
 * input would be one more thing to tab past for no gain.
 */
export function OptionPicker({
  value,
  options,
  onChange,
  title,
  placeholder = "Select",
  clearable = false,
  clearLabel = "None",
}: OptionPickerProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  function choose(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        // The visible label is the value alone — often just "None" — which
        // tells a screen reader nothing about which field it belongs to. The
        // title names the field, so the two together read as one control.
        aria-label={`${title}: ${selected?.label ?? placeholder}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-2 bg-transparent p-0 text-left text-[13px] outline-none",
          selected ? "text-foreground" : "text-muted-foreground/70",
        )}
      >
        {selected?.icon
          ? createElement(selected.icon, {
              className: "size-3.5 shrink-0",
              "aria-hidden": true,
            })
          : null}
        <span className="min-w-0 flex-1 truncate">
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className="size-3.5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="admin-theme gap-3 p-4 sm:max-w-[340px] sm:p-5">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-medium">
              {title}
            </DialogTitle>
          </DialogHeader>

          {/* Capped and scrollable: the article list grows with every post, and
              a dialog that runs past the viewport puts its last option out of
              reach on a phone. */}
          <ul className="-mx-1 max-h-[min(60vh,320px)] overflow-y-auto px-1">
            {clearable ? (
              <OptionRow
                label={clearLabel}
                muted
                selected={!value}
                onSelect={() => choose("")}
              />
            ) : null}
            {options.map((option) => (
              <OptionRow
                key={option.value}
                label={option.label}
                icon={option.icon}
                selected={option.value === value}
                onSelect={() => choose(option.value)}
              />
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}

function OptionRow({
  label,
  icon,
  selected,
  muted,
  onSelect,
}: {
  label: string;
  icon?: PickerOption["icon"];
  selected: boolean;
  muted?: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        // min-h-11 because this is a touch target in a dialog, unlike the
        // inline triggers elsewhere in these forms.
        className={cn(
          "flex min-h-11 w-full items-center gap-2.5 rounded-md px-2 text-left text-[13px]",
          "transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
          muted ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {icon ? (
          <span className="grid size-6 shrink-0 place-items-center rounded-md bg-accent">
            {createElement(icon, {
              className: "size-3.5",
              "aria-hidden": true,
            })}
          </span>
        ) : null}
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {selected ? (
          <Check
            className="size-3.5 shrink-0 text-foreground"
            aria-hidden="true"
          />
        ) : null}
      </button>
    </li>
  );
}
