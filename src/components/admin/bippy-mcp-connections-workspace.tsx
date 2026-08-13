"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  Cable,
  LoaderCircle,
  PanelLeftOpen,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  removeBippyMcpConnection,
  saveBippyMcpConnection,
  saveBippyMcpToolSettings,
} from "@/app/admin/actions/bippy-mcp";
import { BippyMobileWorkspaceSidebar } from "@/components/admin/bippy-mobile-workspace-sidebar";
import { BippyWorkspaceSidebar } from "@/components/admin/bippy-workspace-sidebar";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { AssistantThreadSummary } from "@/lib/ai/types";
import type { BippyMcpConnectionView } from "@/lib/ai/bippy-mcp";
import { cn } from "@/lib/utils";

type ConnectionForm = {
  id?: string;
  name: string;
  serverUrl: string;
  authType: "none" | "bearer" | "oauth";
  credential: string;
};

const emptyForm: ConnectionForm = {
  name: "",
  serverUrl: "",
  authType: "none",
  credential: "",
};

function readableDate(value: Date | string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function BippyMcpConnectionsWorkspace({
  threads,
  initialConnections,
}: {
  threads: AssistantThreadSummary[];
  initialConnections: BippyMcpConnectionView[];
}) {
  const [connections, setConnections] = useState(initialConnections);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [connectionForm, setConnectionForm] = useState<ConnectionForm | null>(
    null,
  );
  const [toolConnection, setToolConnection] =
    useState<BippyMcpConnectionView | null>(null);
  const [allowedTools, setAllowedTools] = useState<string[]>([]);
  const [readOnlyTools, setReadOnlyTools] = useState<string[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [pending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const handledOAuthResult = useRef(false);

  useEffect(() => {
    if (handledOAuthResult.current) return;
    const result = searchParams.get("oauth");
    if (!result) return;
    handledOAuthResult.current = true;
    if (result === "connected") {
      toast.success("OAuth connected. Choose the tools Bippy may use.");
    } else {
      toast.error("OAuth authorization could not be completed.");
    }
    const clean = new URL(window.location.href);
    clean.searchParams.delete("oauth");
    window.history.replaceState(null, "", clean);
  }, [searchParams]);

  const sortedConnections = useMemo(
    () => [...connections].sort((a, b) => a.name.localeCompare(b.name)),
    [connections],
  );

  function replaceConnection(connection: BippyMcpConnectionView) {
    setConnections((current) => [
      ...current.filter((item) => item.id !== connection.id),
      connection,
    ]);
  }

  function editConnection(connection: BippyMcpConnectionView) {
    setConnectionForm({
      id: connection.id,
      name: connection.name,
      serverUrl: connection.serverUrl,
      authType: connection.authType as "none" | "bearer" | "oauth",
      credential: "",
    });
  }

  function configureTools(connection: BippyMcpConnectionView) {
    setToolConnection(connection);
    setAllowedTools(connection.allowedTools);
    setReadOnlyTools(connection.readOnlyTools);
    setEnabled(connection.enabled);
  }

  function submitConnection(event: FormEvent) {
    event.preventDefault();
    if (!connectionForm) return;
    startTransition(async () => {
      const result = await saveBippyMcpConnection(connectionForm);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      if (result.authorizationUrl) {
        window.location.assign(result.authorizationUrl);
        return;
      }
      replaceConnection(result.connection);
      setConnectionForm(null);
      configureTools(result.connection);
      toast.success("Connection verified. Choose the tools Bippy may use.");
    });
  }

  function submitTools() {
    if (!toolConnection) return;
    startTransition(async () => {
      const result = await saveBippyMcpToolSettings({
        id: toolConnection.id,
        enabled,
        allowedTools,
        readOnlyTools,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      replaceConnection(result.connection);
      setToolConnection(null);
      toast.success("Bippy's MCP tools were updated.");
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await removeBippyMcpConnection(id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setConnections((current) => current.filter((item) => item.id !== id));
      toast.success("Connection removed.");
    });
  }

  return (
    <div
      className={cn(
        "size-full overflow-hidden",
        sidebarOpen && "lg:grid lg:grid-cols-[210px_minmax(0,1fr)]",
      )}
    >
      <BippyMobileWorkspaceSidebar
        open={mobileSidebarOpen}
        onOpenChange={setMobileSidebarOpen}
        threads={threads}
      />
      {sidebarOpen ? (
        <div className="hidden min-h-0 lg:block">
          <BippyWorkspaceSidebar
            className="size-full"
            threads={threads}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      ) : null}

      <section
        className="min-h-0 overflow-y-auto"
        aria-label="Bippy MCP connections"
      >
        <div className="mx-auto w-full max-w-[760px] px-5 py-4 sm:px-7">
          <div className="flex items-start gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Open Bippy sidebar"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden"
            >
              <PanelLeftOpen aria-hidden="true" />
            </Button>
            {!sidebarOpen ? (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Open Bippy sidebar"
                onClick={() => setSidebarOpen(true)}
                className="hidden lg:inline-flex"
              >
                <PanelLeftOpen aria-hidden="true" />
              </Button>
            ) : null}
            <div className="min-w-0 flex-1">
              <h1 className="text-[15px] font-semibold">Connections</h1>
              <p className="text-[12px] text-muted-foreground">
                Choose the external MCP services and tools available to Bippy.
              </p>
            </div>
            <Button size="sm" onClick={() => setConnectionForm(emptyForm)}>
              <Plus aria-hidden="true" /> Add
            </Button>
          </div>

          <div className="mt-5 border-t border-border/60">
            {sortedConnections.map((connection) => (
              <article
                key={connection.id}
                className="border-b border-border/60 py-4"
              >
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13.5px] font-medium">
                        {connection.name}
                      </p>
                      <Badge
                        variant={connection.enabled ? "outline" : "secondary"}
                        className="rounded-sm font-mono text-[9px]"
                      >
                        {connection.authType === "oauth" &&
                        !connection.oauthConnected
                          ? "Authorization needed"
                          : connection.enabled
                            ? "Enabled"
                            : "Disabled"}
                      </Badge>
                    </div>
                    <p className="mt-1 break-all font-mono text-[10px] text-muted-foreground">
                      {connection.serverUrl}
                    </p>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {connection.allowedTools.length} of{" "}
                      {connection.discoveredTools.length} tools allowed · Last
                      verified {readableDate(connection.lastConnectedAt)}
                    </p>
                    {connection.lastError ? (
                      <p className="mt-2 text-[11px] text-destructive">
                        {connection.lastError}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Configure tools for ${connection.name}`}
                      onClick={() => configureTools(connection)}
                    >
                      <ShieldCheck aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit ${connection.name}`}
                      onClick={() => editConnection(connection)}
                    >
                      <Pencil aria-hidden="true" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove ${connection.name}`}
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent size="sm">
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Remove {connection.name}?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Bippy immediately loses access to every tool from
                            this server. Its encrypted credential is deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            onClick={() => remove(connection.id)}
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </article>
            ))}
            {!connections.length ? (
              <div className="flex min-h-56 flex-col items-center justify-center text-center">
                <Cable
                  className="size-6 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="mt-3 text-[13px] font-medium">
                  No MCP connections
                </p>
                <p className="mt-1 max-w-sm text-[12px] leading-5 text-muted-foreground">
                  Connect a remote MCP server, review its tools, then explicitly
                  enable only what Bippy needs.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <Dialog
        open={Boolean(connectionForm)}
        onOpenChange={(open) => !open && setConnectionForm(null)}
      >
        <DialogContent>
          <form onSubmit={submitConnection}>
            <DialogHeader>
              <DialogTitle>
                {connectionForm?.id ? "Edit connection" : "Add MCP connection"}
              </DialogTitle>
              <DialogDescription>
                Bippy connects from the server. Tokens are encrypted and never
                sent to the browser.
              </DialogDescription>
            </DialogHeader>
            {connectionForm ? (
              <div className="mt-5 grid gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="mcp-name">Name</Label>
                  <Input
                    id="mcp-name"
                    value={connectionForm.name}
                    onChange={(event) =>
                      setConnectionForm({
                        ...connectionForm,
                        name: event.target.value,
                      })
                    }
                    placeholder="Eraser"
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="mcp-url">Server URL</Label>
                  <Input
                    id="mcp-url"
                    type="url"
                    value={connectionForm.serverUrl}
                    onChange={(event) =>
                      setConnectionForm({
                        ...connectionForm,
                        serverUrl: event.target.value,
                      })
                    }
                    placeholder="https://example.com/mcp"
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Authentication</Label>
                  <Select
                    value={connectionForm.authType}
                    onValueChange={(value) =>
                      setConnectionForm({
                        ...connectionForm,
                        authType: value as "none" | "bearer" | "oauth",
                        credential: "",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No authentication</SelectItem>
                      <SelectItem value="bearer">Bearer token</SelectItem>
                      <SelectItem value="oauth">OAuth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {connectionForm.authType === "bearer" ? (
                  <div className="grid gap-1.5">
                    <Label htmlFor="mcp-token">Bearer token</Label>
                    <Input
                      id="mcp-token"
                      type="password"
                      autoComplete="off"
                      value={connectionForm.credential}
                      onChange={(event) =>
                        setConnectionForm({
                          ...connectionForm,
                          credential: event.target.value,
                        })
                      }
                      placeholder={
                        connectionForm.id
                          ? "Leave blank to keep the existing token"
                          : "Paste token"
                      }
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
            <DialogFooter className="mt-6">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={pending}>
                {pending ? (
                  <LoaderCircle className="animate-spin" aria-hidden="true" />
                ) : (
                  <RefreshCw aria-hidden="true" />
                )}{" "}
                {connectionForm?.authType === "oauth"
                  ? "Continue with OAuth"
                  : "Verify & discover"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(toolConnection)}
        onOpenChange={(open) => !open && setToolConnection(null)}
      >
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{toolConnection?.name} tools</DialogTitle>
            <DialogDescription>
              Allowed tools are exposed to Bippy. Mark only genuinely
              non-mutating tools as read-only.
            </DialogDescription>
          </DialogHeader>
          {toolConnection ? (
            <div className="mt-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div>
                  <p className="text-[13px] font-medium">Enable connection</p>
                  <p className="text-[11px] text-muted-foreground">
                    At least one tool must be allowed.
                  </p>
                </div>
                <Switch checked={enabled} onCheckedChange={setEnabled} />
              </div>
              {toolConnection.discoveredTools.map((definition) => {
                const allowed = allowedTools.includes(definition.name);
                const readOnly = readOnlyTools.includes(definition.name);
                return (
                  <div
                    key={definition.name}
                    className="border-b border-border/60 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <Switch
                        className="mt-0.5"
                        checked={allowed}
                        onCheckedChange={(checked) => {
                          setAllowedTools((current) =>
                            checked
                              ? [...new Set([...current, definition.name])]
                              : current.filter(
                                  (name) => name !== definition.name,
                                ),
                          );
                          if (!checked)
                            setReadOnlyTools((current) =>
                              current.filter(
                                (name) => name !== definition.name,
                              ),
                            );
                        }}
                        aria-label={`Allow ${definition.name}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-[11px] font-medium">
                          {definition.title ?? definition.name}
                        </p>
                        <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                          {definition.description ??
                            "No description supplied by the server."}
                        </p>
                        {allowed ? (
                          <div className="mt-2 flex items-center justify-between rounded-sm bg-muted/40 px-2.5 py-2">
                            <span className="text-[10.5px]">
                              Execute without approval
                            </span>
                            <Switch
                              checked={readOnly}
                              onCheckedChange={(checked) =>
                                setReadOnlyTools((current) =>
                                  checked
                                    ? [
                                        ...new Set([
                                          ...current,
                                          definition.name,
                                        ]),
                                      ]
                                    : current.filter(
                                        (name) => name !== definition.name,
                                      ),
                                )
                              }
                              aria-label={`Treat ${definition.name} as read-only`}
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={submitTools}
              disabled={pending || (enabled && !allowedTools.length)}
            >
              {pending ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : null}{" "}
              Save tools
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
