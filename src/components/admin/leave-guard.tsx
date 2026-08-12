"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Leaving unpublished work is the only place a draft is offered. Something
// already on the site has nowhere to be drafted back to, so editing it and
// pressing Cancel just leaves — the caller decides by not opening this.
export function LeaveGuard({
  open,
  noun,
  onOpenChange,
  onDiscard,
  onSaveDraft,
  saving,
}: {
  open: boolean;
  noun: string;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
  onSaveDraft: () => void;
  saving?: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {/* Portals to the body, outside the .admin-theme wrapper, so it carries
          the class or it is painted in the public site's palette. */}
      <AlertDialogContent className="admin-theme">
        <AlertDialogHeader>
          <AlertDialogTitle>Save this {noun} as a draft?</AlertDialogTitle>
          <AlertDialogDescription>
            You have written something but not published it. Keep it as a draft
            to come back to, or delete it and start over.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {/* Cancel closes and returns to the form. A modal with only two
              destructive-ish choices would trap someone who hit Cancel by
              mistake. */}
          <AlertDialogCancel disabled={saving}>Keep editing</AlertDialogCancel>
          <button
            type="button"
            onClick={onDiscard}
            disabled={saving}
            className="inline-flex h-9 items-center justify-center rounded-md border border-destructive/40 px-3 text-sm text-destructive transition-colors hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-50"
          >
            Delete
          </button>
          {/* preventDefault so the dialog stays open while the save runs.
              AlertDialogAction closes on click by default, which unmounts the
              button before `disabled` can take effect — leaving a live control
              that a second click would fire again, inserting a second row. */}
          <AlertDialogAction
            disabled={saving}
            onClick={(event) => {
              event.preventDefault();
              if (!saving) onSaveDraft();
            }}
          >
            {saving ? "Saving…" : "Save draft"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
