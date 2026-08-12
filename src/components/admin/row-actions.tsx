"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

// Below sm the labels drop and the two controls become squares. A row already
// carries a title, a date and often a pin button; spelling out "Edit" and
// "Delete" beside all that was what pushed phone rows onto a second line.
// The word stays in the accessible name either way — sr-only, not removed.
export const compactAction = "max-sm:w-8 max-sm:px-0";
export const compactActionLabel = "sr-only sm:not-sr-only";

const compact = compactAction;
const label = compactActionLabel;

export function EditAction({ href, what }: { href: string; what: string }) {
  return (
    <Button asChild variant="outline" size="sm" className={compact}>
      <Link href={href}>
        <Pencil aria-hidden="true" />
        <span className={label}>Edit</span>
        <span className="sr-only sm:hidden">{what}</span>
      </Link>
    </Button>
  );
}

export function DeleteAction({
  what,
  title,
  description,
  confirmLabel = "Delete",
  pending,
  disabled,
  onConfirm,
}: {
  what: string;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  pending?: boolean;
  disabled?: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          // Explicit, because this one is used inside the settings form, where
          // a button with no type defaults to submit.
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending || disabled}
          className={`${compact} text-muted-foreground hover:bg-destructive/10 hover:text-destructive`}
        >
          <Trash2 aria-hidden="true" />
          <span className={label}>Delete</span>
          <span className="sr-only sm:hidden">{what}</span>
        </Button>
      </AlertDialogTrigger>
      {/* The dialog portals to the body, outside the .admin-theme wrapper, so
          it has to carry the class or it is painted in the public palette. */}
      <AlertDialogContent className="admin-theme">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
