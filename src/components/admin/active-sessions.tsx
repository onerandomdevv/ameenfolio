"use client";

import { useState, useTransition } from "react";
import {
  Laptop,
  LoaderCircle,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  revokeAdminSession,
  revokeOtherAdminSessions,
} from "@/app/admin/actions/sessions";
import { ListRow, SectionHeading } from "@/components/admin/admin-primitives";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  AdminSessionsResult,
  AdminSessionView,
} from "@/lib/auth/sessions";

function DeviceIcon({ kind }: { kind: AdminSessionView["deviceKind"] }) {
  if (kind === "mobile") return <Smartphone aria-hidden="true" />;
  if (kind === "tablet") return <Tablet aria-hidden="true" />;
  return <Monitor aria-hidden="true" />;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

function SessionMeta({ session }: { session: AdminSessionView }) {
  return (
    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10.5px] text-muted-foreground">
      <span>Last active {formatDate(session.lastActiveAt)}</span>
      <span>Signed in {formatDate(session.createdAt)}</span>
      <span>Expires {formatDate(session.expiresAt)}</span>
      {session.maskedIp ? <span>IP {session.maskedIp}</span> : null}
    </div>
  );
}

export function ActiveSessions({ result }: { result: AdminSessionsResult }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string>();
  const [pending, startTransition] = useTransition();
  const otherSessionCount = result.sessions.filter(
    (session) => !session.current,
  ).length;

  function revokeOne(sessionId: string) {
    setPendingId(sessionId);
    startTransition(async () => {
      try {
        const actionResult = await revokeAdminSession(sessionId);
        if (actionResult.ok) {
          toast.success(actionResult.message);
          router.refresh();
        } else {
          toast.error(actionResult.message);
        }
      } catch {
        toast.error("The session could not be signed out.");
      } finally {
        setPendingId(undefined);
      }
    });
  }

  function revokeOthers() {
    setPendingId("all-other-sessions");
    startTransition(async () => {
      try {
        const actionResult = await revokeOtherAdminSessions();
        if (actionResult.ok) {
          toast.success(actionResult.message);
          router.refresh();
        } else {
          toast.error(actionResult.message);
        }
      } catch {
        toast.error("Other devices could not be signed out.");
      } finally {
        setPendingId(undefined);
      }
    });
  }

  return (
    <section className="mt-8 max-w-[720px]" aria-label="Active sessions">
      <SectionHeading
        meta={`${result.sessions.length} active`}
        action={
          otherSessionCount ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" disabled={pending}>
                  {pendingId === "all-other-sessions" ? (
                    <LoaderCircle
                      data-icon="inline-start"
                      className="animate-spin"
                    />
                  ) : (
                    <Laptop data-icon="inline-start" />
                  )}
                  Sign out other devices
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign out other devices?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This ends {otherSessionCount} other active{" "}
                    {otherSessionCount === 1 ? "session" : "sessions"}. This
                    device stays signed in.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={revokeOthers}
                  >
                    Sign out devices
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null
        }
      >
        Active sessions
      </SectionHeading>

      {result.error ? (
        <Alert variant="destructive">
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
      ) : null}

      {result.sessions.map((session) => (
        <ListRow
          key={session.id}
          icon={<DeviceIcon kind={session.deviceKind} />}
          title={session.deviceLabel}
          titleMeta={
            session.current ? <Badge variant="outline">Current</Badge> : null
          }
          meta={<SessionMeta session={session} />}
          actions={
            session.current ? null : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="ghost" disabled={pending}>
                    {pendingId === session.id ? (
                      <LoaderCircle
                        data-icon="inline-start"
                        className="animate-spin"
                      />
                    ) : null}
                    Sign out
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Sign out this device?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {session.deviceLabel} will need to authenticate with
                      GitHub again to access the admin.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() => revokeOne(session.id)}
                    >
                      Sign out device
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )
          }
        />
      ))}
    </section>
  );
}
